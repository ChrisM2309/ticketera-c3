import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createUser } from './helpers';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

/** Crea un usuario de Auth con un correo conocido; el disparador de alta le da el perfil `buyer`. */
async function createAccount(email: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ id: string }>(
    `insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id`,
    [email],
  );
  return result.rows[0].id;
}

async function roleOf(userId: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [userId]);
  return result.rows[0].role;
}

async function link(slug: string, email: string, name = 'Comunidad Tech', description: string | null = null) {
  return db.query<{ admin_link_organizer: string }>(`select public.admin_link_organizer($1, $2, $3, $4)`, [
    name,
    slug,
    description,
    email,
  ]);
}

describe('admin_link_organizer', () => {
  it('solo el administrador puede vincular', async () => {
    const admin = await createUser(db, 'admin');
    const organizer = await createUser(db, 'organizer');
    const ownerId = await createAccount('dueno@example.test');
    const buyer = await createAccount('comprador-comun@example.test');

    for (const caller of [organizer, buyer]) {
      await asRole(db, 'authenticated', caller);
      await expect(link('comunidad-tech', 'dueno@example.test')).rejects.toThrow(/Solo el administrador/);
    }

    await asRole(db, 'anon');
    await expect(link('comunidad-tech', 'dueno@example.test')).rejects.toThrow(/permission denied/);

    await asRole(db, 'authenticated', admin);
    const result = await link('comunidad-tech', 'dueno@example.test');
    expect(result.rows[0].admin_link_organizer).toMatch(/^[0-9a-f-]{36}$/);

    await asSuperuser(db);
    const rows = await db.query<{ owner_user_id: string }>(
      `select owner_user_id from public.organizers where slug = 'comunidad-tech'`,
    );
    expect(rows.rows).toEqual([{ owner_user_id: ownerId }]);
  });

  it('un correo inexistente falla', async () => {
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', admin);
    await expect(link('sin-dueno', 'nadie@example.test')).rejects.toThrow(/No existe una cuenta con ese correo/);

    await asSuperuser(db);
    const rows = await db.query(`select 1 from public.organizers where slug = 'sin-dueno'`);
    expect(rows.rows).toEqual([]);
  });

  it('el correo se compara sin distinguir mayúsculas ni espacios', async () => {
    const admin = await createUser(db, 'admin');
    const ownerId = await createAccount('Ana@Example.test');

    await asRole(db, 'authenticated', admin);
    await link('ana-eventos', '  ana@example.TEST  ');

    expect(await roleOf(ownerId)).toBe('organizer');
  });

  it('el dueño pasa de buyer a organizer', async () => {
    const admin = await createUser(db, 'admin');
    const ownerId = await createAccount('futuro-organizador@example.test');
    expect(await roleOf(ownerId)).toBe('buyer');

    await asRole(db, 'authenticated', admin);
    await link('futuro-organizador', 'futuro-organizador@example.test', 'Futuro Organizador', 'Eventos de software.');

    expect(await roleOf(ownerId)).toBe('organizer');

    await asSuperuser(db);
    const row = await db.query<{ name: string; description: string; status: string }>(
      `select name, description, status from public.organizers where slug = 'futuro-organizador'`,
    );
    expect(row.rows).toEqual([{ name: 'Futuro Organizador', description: 'Eventos de software.', status: 'active' }]);
  });

  it('un admin no baja de rol', async () => {
    const admin = await createUser(db, 'admin');
    const otherAdmin = await createAccount('otro-admin@example.test');
    await asSuperuser(db);
    await db.query(`update public.profiles set role = 'admin' where id = $1`, [otherAdmin]);

    await asRole(db, 'authenticated', admin);
    await link('org-del-admin', 'otro-admin@example.test');

    expect(await roleOf(otherAdmin)).toBe('admin');

    await asSuperuser(db);
    const row = await db.query(`select 1 from public.organizers where slug = 'org-del-admin' and owner_user_id = $1`, [
      otherAdmin,
    ]);
    expect(row.rows).toHaveLength(1);
  });

  it('un organizador existente conserva su rol', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    await asSuperuser(db);
    await db.query(`update auth.users set email = 'ya-organizador@example.test' where id = $1`, [owner]);

    await asRole(db, 'authenticated', admin);
    await link('segunda-organizacion', 'ya-organizador@example.test');

    expect(await roleOf(owner)).toBe('organizer');
  });

  it('slug repetido o con formato inválido falla', async () => {
    const admin = await createUser(db, 'admin');
    const ownerId = await createAccount('dueno-slug@example.test');

    await asRole(db, 'authenticated', admin);
    await link('mi-organizacion', 'dueno-slug@example.test');

    await expect(link('mi-organizacion', 'dueno-slug@example.test')).rejects.toThrow(/ya está en uso/);

    for (const badSlug of ['Mayusculas', 'con espacios', '-guion-inicial', 'guion-final-', 'doble--guion', 'ñandú', '']) {
      await expect(link(badSlug, 'dueno-slug@example.test')).rejects.toThrow(/identificador de la URL no es válido/);
    }

    await asSuperuser(db);
    const count = await db.query<{ total: string }>(
      `select count(*)::text as total from public.organizers where owner_user_id = $1`,
      [ownerId],
    );
    expect(count.rows[0].total).toBe('1');
  });

  it('valida nombre y descripción y no cambia el rol si algo falla', async () => {
    const admin = await createUser(db, 'admin');
    const ownerId = await createAccount('dueno-validacion@example.test');

    await asRole(db, 'authenticated', admin);
    await expect(link('nombre-corto', 'dueno-validacion@example.test', 'ab')).rejects.toThrow(/entre 3 y 120/);
    await expect(
      link('descripcion-larga', 'dueno-validacion@example.test', 'Nombre válido', 'x'.repeat(501)),
    ).rejects.toThrow(/500 caracteres/);

    expect(await roleOf(ownerId)).toBe('buyer');
  });
});

describe('admin_list_organizers', () => {
  it('solo el administrador ve los organizadores con el correo del dueño', async () => {
    const admin = await createUser(db, 'admin');
    const organizer = await createUser(db, 'organizer');
    await createAccount('dueno-lista@example.test');

    await asRole(db, 'authenticated', admin);
    await link('lista-uno', 'dueno-lista@example.test', 'Lista Uno');

    const rows = await db.query<{ slug: string; owner_email: string | null }>(
      `select slug, owner_email from public.admin_list_organizers() where slug = 'lista-uno'`,
    );
    expect(rows.rows).toEqual([{ slug: 'lista-uno', owner_email: 'dueno-lista@example.test' }]);

    await asRole(db, 'authenticated', organizer);
    await expect(db.query(`select * from public.admin_list_organizers()`)).rejects.toThrow(/Solo el administrador/);

    await asRole(db, 'anon');
    await expect(db.query(`select * from public.admin_list_organizers()`)).rejects.toThrow(/permission denied/);
  });
});
