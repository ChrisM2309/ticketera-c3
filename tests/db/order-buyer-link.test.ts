import { createHash, randomUUID } from 'node:crypto';

import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asRole, asSuperuser, createDatabase } from './helpers';

/**
 * Compra con sesión y reclamo de compras de invitado (CP-04): la orden creada con sesión queda ligada al
 * usuario y una orden de invitado solo se reclama con el token de la compra y el mismo correo de la cuenta.
 */

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

async function signUp(email: string): Promise<string> {
  const id = randomUUID();
  await asSuperuser(db);
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email]);
  return id;
}

async function createOrder(options: { email: string; token: string; buyerUserId?: string | null }): Promise<string> {
  await asSuperuser(db);
  const event = await db.query<{ id: string }>(`select id from public.events where slug = 'congreso-demo-ia'`);
  const ticket = await db.query<{ id: string }>(
    `select id from public.ticket_types where event_id = $1 and is_active order by price_cents limit 1`,
    [event.rows[0].id],
  );
  await asRole(db, 'service_role');
  const params: unknown[] = [
    event.rows[0].id,
    JSON.stringify([{ ticketTypeId: ticket.rows[0].id, quantity: 1 }]),
    'Comprador DEMO',
    options.email,
    sha256(options.token),
    5,
    randomUUID(),
    null,
  ];
  const sql =
    options.buyerUserId === undefined
      ? `select order_id from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6, $7, $8)`
      : `select order_id from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9)`;

  if (options.buyerUserId !== undefined) {
    params.push(options.buyerUserId);
  }

  const result = await db.query<{ order_id: string }>(sql, params);
  await asSuperuser(db);
  return result.rows[0].order_id;
}

async function ownerOf(orderId: string): Promise<string | null> {
  await asSuperuser(db);
  const result = await db.query<{ buyer_user_id: string | null }>(
    `select buyer_user_id from public.orders where id = $1`,
    [orderId],
  );
  return result.rows[0].buyer_user_id;
}

async function claim(userId: string | undefined, orderId: string, token: string): Promise<boolean> {
  await asRole(db, 'authenticated', userId);
  const result = await db.query<{ claimed: boolean }>(`select public.claim_order($1, $2) as claimed`, [
    orderId,
    sha256(token),
  ]);
  await asSuperuser(db);
  return result.rows[0].claimed;
}

describe('create_pending_order con sesión', () => {
  it('una orden creada con sesión queda ligada al usuario', async () => {
    const userId = await signUp('con-sesion@example.test');
    const orderId = await createOrder({ email: 'con-sesion@example.test', token: 'token-a', buyerUserId: userId });

    expect(await ownerOf(orderId)).toBe(userId);
  });

  it('una orden de invitado no tiene dueño', async () => {
    const orderId = await createOrder({ email: 'invitado@example.test', token: 'token-b' });

    expect(await ownerOf(orderId)).toBeNull();
  });

  it('un usuario inexistente no impide crear la orden', async () => {
    const orderId = await createOrder({ email: 'fantasma@example.test', token: 'token-c', buyerUserId: randomUUID() });

    expect(await ownerOf(orderId)).toBeNull();
  });

  it('la firma anterior ya no existe', async () => {
    const result = await db.query<{ args: string }>(
      `select pg_get_function_identity_arguments(p.oid) as args
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'create_pending_order'`,
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].args).toContain('p_buyer_user_id uuid');
  });

  it('solo service_role ejecuta create_pending_order', async () => {
    const result = await db.query<{ anon: boolean; authenticated: boolean; service: boolean }>(
      `select has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
              has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated,
              has_function_privilege('service_role', p.oid, 'EXECUTE') as service
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'create_pending_order'`,
    );

    expect(result.rows[0]).toEqual({ anon: false, authenticated: false, service: true });
  });
});

describe('claim_order', () => {
  it('claim_order asigna el dueño con token y correo correctos', async () => {
    const userId = await signUp('reclama@example.test');
    const orderId = await createOrder({ email: 'reclama@example.test', token: 'token-d' });

    expect(await claim(userId, orderId, 'token-d')).toBe(true);
    expect(await ownerOf(orderId)).toBe(userId);
  });

  it('el correo se compara sin distinguir mayúsculas', async () => {
    const userId = await signUp('Mayus.Cula@Example.test');
    const orderId = await createOrder({ email: 'mayus.cula@example.test', token: 'token-e' });

    expect(await claim(userId, orderId, 'token-e')).toBe(true);
    expect(await ownerOf(orderId)).toBe(userId);
  });

  it('claim_order falla con un correo distinto', async () => {
    const userId = await signUp('otra-persona@example.test');
    const orderId = await createOrder({ email: 'dueno-real@example.test', token: 'token-f' });

    expect(await claim(userId, orderId, 'token-f')).toBe(false);
    expect(await ownerOf(orderId)).toBeNull();
  });

  it('claim_order falla con un token incorrecto', async () => {
    const userId = await signUp('token-malo@example.test');
    const orderId = await createOrder({ email: 'token-malo@example.test', token: 'token-g' });

    expect(await claim(userId, orderId, 'otro-token')).toBe(false);
    expect(await ownerOf(orderId)).toBeNull();
  });

  it('claim_order falla si la orden ya tiene dueño', async () => {
    const dueno = await signUp('ya-dueno@example.test');
    const intruso = await signUp('intruso-igual@example.test');
    const orderId = await createOrder({ email: 'ya-dueno@example.test', token: 'token-h', buyerUserId: dueno });
    await db.query(`update public.orders set buyer_email = 'intruso-igual@example.test' where id = $1`, [orderId]);

    expect(await claim(intruso, orderId, 'token-h')).toBe(false);
    expect(await ownerOf(orderId)).toBe(dueno);
  });

  it('reclamar dos veces con el mismo usuario devuelve false la segunda vez', async () => {
    const userId = await signUp('repite@example.test');
    const orderId = await createOrder({ email: 'repite@example.test', token: 'token-i' });

    expect(await claim(userId, orderId, 'token-i')).toBe(true);
    expect(await claim(userId, orderId, 'token-i')).toBe(false);
    expect(await ownerOf(orderId)).toBe(userId);
  });

  it('una orden inexistente devuelve false', async () => {
    const userId = await signUp('nada@example.test');

    expect(await claim(userId, randomUUID(), 'token-j')).toBe(false);
  });

  it('sin usuario autenticado devuelve false', async () => {
    const orderId = await createOrder({ email: 'sin-uid@example.test', token: 'token-k' });

    expect(await claim(undefined, orderId, 'token-k')).toBe(false);
    expect(await ownerOf(orderId)).toBeNull();
  });

  it('anon no puede ejecutar claim_order', async () => {
    const orderId = await createOrder({ email: 'anon@example.test', token: 'token-l' });

    await asRole(db, 'anon');
    await expect(db.query(`select public.claim_order($1, $2)`, [orderId, sha256('token-l')])).rejects.toThrow(
      /permission denied/,
    );
    await asSuperuser(db);
  });
});
