import { randomBytes, randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';

const root = join(import.meta.dirname, '..', '..');
const migrationsDir = join(root, 'supabase', 'migrations');

export const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => join(migrationsDir, file));

export const seedSql = readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8');

/**
 * Lo mínimo de Supabase que las migraciones necesitan: roles, esquema auth,
 * tabla auth.users y auth.uid() leyendo el claim `sub` como lo hace Supabase.
 */
const supabaseShimSql = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique);
  create function auth.uid() returns uuid
    language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  -- Supabase concede EXECUTE a anon y authenticated sobre las funciones nuevas de public por defecto.
  -- Sin esto, PGlite no detecta grants que dependen de esos privilegios por defecto.
  alter default privileges in schema public grant execute on functions to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`;

export async function createDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(supabaseShimSql);
  for (const file of migrationFiles) {
    await db.exec(readFileSync(file, 'utf8'));
  }
  await db.exec(seedSql);
  return db;
}

/** Cambia el rol de la sesión y el usuario que auth.uid() devolverá. */
export async function asRole(
  db: PGlite,
  role: 'anon' | 'authenticated' | 'service_role',
  userId?: string,
): Promise<void> {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub', '${userId ?? ''}', false); set role ${role};`,
  );
}

export async function asSuperuser(db: PGlite): Promise<void> {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
}

/** Crea un usuario de Auth con su perfil. Solo para pruebas (corre como superusuario). */
export async function createUser(db: PGlite, role: 'organizer' | 'admin' = 'organizer') {
  const id = randomUUID();
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${id}@example.test`]);
  await db.query('insert into public.profiles (id, role, display_name) values ($1, $2, $3)', [
    id,
    role,
    'Fixture',
  ]);
  return id;
}

export async function createOrganizer(
  db: PGlite,
  ownerId: string | null,
  slug: string,
  status: 'active' | 'inactive' = 'active',
): Promise<string> {
  const result = await db.query<{ id: string }>(
    `insert into public.organizers (owner_user_id, name, slug, status)
     values ($1, 'Fixture organizador', $2, $3) returning id`,
    [ownerId, slug, status],
  );
  return result.rows[0].id;
}

export async function createEvent(
  db: PGlite,
  organizerId: string,
  options: { slug: string; status?: string; mode?: 'presencial' | 'virtual' },
): Promise<string> {
  const mode = options.mode ?? 'virtual';
  const location =
    mode === 'presencial'
      ? `(select id from public.categories where kind = 'location' and slug = 'san-salvador')`
      : 'null';
  const result = await db.query<{ id: string }>(
    `insert into public.events (
       organizer_id, event_type_id, location_id, slug, title, description, mode, venue,
       starts_at, status
     ) values (
       $1,
       (select id from public.categories where kind = 'event_type' and slug = 'congresos'),
       ${location},
       $2, 'Evento de prueba', 'Descripción de prueba', $3,
       case when $3 = 'presencial' then 'Sede de prueba' else null end,
       '2027-09-01 18:00:00+00', $4
     ) returning id`,
    [organizerId, options.slug, mode, options.status ?? 'draft'],
  );
  return result.rows[0].id;
}

/** Crea una orden completa (orden, línea, pago y boleto) para probar lectura restringida. */
export async function createOrderFixture(db: PGlite, eventId: string): Promise<string> {
  const order = await db.query<{ id: string }>(
    `insert into public.orders (
       public_token_hash, event_id, buyer_name, buyer_email,
       subtotal_cents, fee_cents, total_cents
     ) values ($1, $2, 'Comprador prueba', 'comprador@example.test', 0, 0, 0)
     returning id`,
    [randomBytes(32).toString('hex'), eventId],
  );
  const orderId = order.rows[0].id;
  const ticketType = await db.query<{ id: string }>(
    `select id from public.ticket_types where event_id = $1 limit 1`,
    [eventId],
  );
  const item = await db.query<{ id: string }>(
    `insert into public.order_items (order_id, ticket_type_id, unit_price_cents, quantity, line_total_cents)
     values ($1, $2, 0, 1, 0) returning id`,
    [orderId, ticketType.rows[0].id],
  );
  await db.query(
    `insert into public.payments (order_id, status, amount_cents, idempotency_key)
     values ($1, 'demo_approved', 0, $2)`,
    [orderId, randomUUID()],
  );
  await db.query(
    `insert into public.tickets (order_id, order_item_id, ticket_type_id, qr_token_hash)
     values ($1, $2, $3, $4)`,
    [orderId, item.rows[0].id, ticketType.rows[0].id, randomBytes(32).toString('hex')],
  );
  return orderId;
}
