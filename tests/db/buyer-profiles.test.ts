import { randomUUID } from 'node:crypto';

import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asRole, asSuperuser, createDatabase, createOrderFixture } from './helpers';

/**
 * Perfiles de comprador (CP-02, CP-07): alta automática, rol inamovible desde el cliente,
 * datos personales mínimos y lectura de las propias órdenes.
 */

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

async function signUp(email: string, metadata: Record<string, unknown> = {}): Promise<string> {
  const id = randomUUID();
  await asSuperuser(db);
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)', [
    id,
    email,
    JSON.stringify(metadata),
  ]);
  return id;
}

describe('alta de usuario', () => {
  it('al crear un usuario se crea un perfil buyer', async () => {
    const id = await signUp('ana.perez@example.test');

    const perfil = await db.query<{
      role: string;
      display_name: string;
      university: string | null;
      marketing_opt_in: boolean;
      consented_at: string | null;
    }>(`select role, display_name, university, marketing_opt_in, consented_at from public.profiles where id = $1`, [id]);

    expect(perfil.rows).toEqual([
      { role: 'buyer', display_name: 'ana.perez', university: null, marketing_opt_in: false, consented_at: null },
    ]);
  });

  it('los metadatos no elevan el rol', async () => {
    const id = await signUp('intruso@example.test', { role: 'admin', display_name: 'Falso admin' });

    const perfil = await db.query<{ role: string; display_name: string }>(
      `select role, display_name from public.profiles where id = $1`,
      [id],
    );

    expect(perfil.rows[0]).toEqual({ role: 'buyer', display_name: 'intruso' });
  });

  it('el rol por defecto de un perfil nuevo es buyer', async () => {
    const result = await db.query<{ column_default: string }>(
      `select column_default from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'`,
    );

    expect(result.rows[0].column_default).toContain('buyer');
  });

  it('el disparador no puede ejecutarse desde el cliente', async () => {
    await asRole(db, 'anon');
    await expect(db.query(`select public.handle_new_user()`)).rejects.toThrow(/permission denied/);
    await asRole(db, 'authenticated', randomUUID());
    await expect(db.query(`select public.handle_new_user()`)).rejects.toThrow(/permission denied/);
    await asSuperuser(db);
  });
});

describe('perfil propio', () => {
  it('un usuario no puede cambiar su propio rol', async () => {
    const id = await signUp('sin-rol@example.test');

    await asRole(db, 'authenticated', id);
    await expect(db.query(`update public.profiles set role = 'admin' where id = auth.uid()`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(db.query(`update public.profiles set role = 'organizer' where id = auth.uid()`)).rejects.toThrow(
      /permission denied/,
    );
    await asSuperuser(db);

    const perfil = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [id]);
    expect(perfil.rows[0].role).toBe('buyer');
  });

  it('un usuario actualiza su universidad y su consentimiento', async () => {
    const id = await signUp('uni@example.test');
    const otro = await signUp('otro@example.test');

    await asRole(db, 'authenticated', id);
    const propio = await db.query(
      `update public.profiles
          set display_name = 'Ana Pérez', university = 'Universidad de El Salvador', marketing_opt_in = true
        where id = auth.uid()`,
    );
    const ajeno = await db.query(`update public.profiles set university = 'Ajena' where id = $1`, [otro]);
    await asSuperuser(db);

    const perfil = await db.query<{
      display_name: string;
      university: string;
      marketing_opt_in: boolean;
      consented_at: string | null;
    }>(`select display_name, university, marketing_opt_in, consented_at from public.profiles where id = $1`, [id]);
    const intacto = await db.query<{ university: string | null }>(
      `select university from public.profiles where id = $1`,
      [otro],
    );

    expect(propio.affectedRows).toBe(1);
    expect(ajeno.affectedRows).toBe(0);
    expect(perfil.rows[0]).toMatchObject({
      display_name: 'Ana Pérez',
      university: 'Universidad de El Salvador',
      marketing_opt_in: true,
    });
    expect(perfil.rows[0].consented_at).not.toBeNull();
    expect(intacto.rows[0].university).toBeNull();
  });

  it('retirar el consentimiento borra la fecha de consentimiento', async () => {
    const id = await signUp('retira@example.test');

    await asRole(db, 'authenticated', id);
    await db.query(`update public.profiles set marketing_opt_in = true where id = auth.uid()`);
    await db.query(`update public.profiles set marketing_opt_in = false where id = auth.uid()`);
    await asSuperuser(db);

    const perfil = await db.query<{ marketing_opt_in: boolean; consented_at: string | null }>(
      `select marketing_opt_in, consented_at from public.profiles where id = $1`,
      [id],
    );
    expect(perfil.rows[0]).toEqual({ marketing_opt_in: false, consented_at: null });
  });

  it('el cliente no puede escribir consented_at directamente', async () => {
    const id = await signUp('fecha@example.test');

    await asRole(db, 'authenticated', id);
    await expect(db.query(`update public.profiles set consented_at = now() where id = auth.uid()`)).rejects.toThrow(
      /permission denied/,
    );
    await asSuperuser(db);
  });

  it('universidad de más de 80 caracteres se rechaza', async () => {
    const id = await signUp('larga@example.test');

    await asRole(db, 'authenticated', id);
    await expect(
      db.query(`update public.profiles set university = $1 where id = auth.uid()`, ['U'.repeat(81)]),
    ).rejects.toThrow(/check constraint/);
    const limite = await db.query(`update public.profiles set university = $1 where id = auth.uid()`, [
      'U'.repeat(80),
    ]);
    await asSuperuser(db);

    expect(limite.affectedRows).toBe(1);
  });
});

describe('my_orders', () => {
  async function eventId(): Promise<string> {
    const result = await db.query<{ id: string }>(`select id from public.events where slug = 'congreso-demo-ia'`);
    return result.rows[0].id;
  }

  it('my_orders devuelve solo las órdenes propias', async () => {
    const compradorA = await signUp('compra-a@example.test');
    const compradorB = await signUp('compra-b@example.test');
    const evento = await eventId();
    const propia = await createOrderFixture(db, evento);
    const ajena = await createOrderFixture(db, evento);
    await createOrderFixture(db, evento);
    await db.query(`update public.orders set buyer_user_id = $1 where id = $2`, [compradorA, propia]);
    await db.query(`update public.orders set buyer_user_id = $1 where id = $2`, [compradorB, ajena]);

    await asRole(db, 'authenticated', compradorA);
    const filas = await db.query<{
      order_id: string;
      status: string;
      total_cents: number;
      checkout_request_id: string | null;
      event_id: string;
      event_title: string;
    }>(`select * from public.my_orders()`);
    await asSuperuser(db);

    expect(filas.rows).toHaveLength(1);
    expect(filas.rows[0]).toMatchObject({
      order_id: propia,
      status: 'pending',
      total_cents: 0,
      event_id: evento,
    });
    expect(filas.rows[0].event_title).toEqual(expect.any(String));
  });

  it('un usuario sin órdenes recibe una lista vacía', async () => {
    const id = await signUp('sin-ordenes@example.test');

    await asRole(db, 'authenticated', id);
    const filas = await db.query(`select * from public.my_orders()`);
    await asSuperuser(db);

    expect(filas.rows).toEqual([]);
  });

  it('anon no puede ejecutar my_orders', async () => {
    await asRole(db, 'anon');
    await expect(db.query(`select * from public.my_orders()`)).rejects.toThrow(/permission denied/);
    await asSuperuser(db);
  });

  it('buyer_user_id queda en null si se borra la cuenta', async () => {
    const id = await signUp('borrada@example.test');
    const orden = await createOrderFixture(db, await eventId());
    await db.query(`update public.orders set buyer_user_id = $1 where id = $2`, [id, orden]);

    await db.query(`delete from auth.users where id = $1`, [id]);

    const fila = await db.query<{ buyer_user_id: string | null }>(
      `select buyer_user_id from public.orders where id = $1`,
      [orden],
    );
    expect(fila.rows[0].buyer_user_id).toBeNull();
  });
});
