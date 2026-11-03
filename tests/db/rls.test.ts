import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  asRole,
  asSuperuser,
  createDatabase,
  createEvent,
  createOrderFixture,
  createOrganizer,
  createUser,
} from './helpers';

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

async function eventIdBySlug(slug: string): Promise<string> {
  const result = await db.query<{ id: string }>(`select id from public.events where slug = $1`, [slug]);
  return result.rows[0].id;
}

describe('acceso público (anon)', () => {
  it('ve exactamente los 50 eventos publicados del seed', async () => {
    await asRole(db, 'anon');
    const result = await db.query<{ total: number; publicados: number }>(
      `select count(*)::int as total,
              count(*) filter (where status = 'published')::int as publicados
       from public.events`,
    );
    await asSuperuser(db);

    expect(result.rows[0]).toEqual({ total: 50, publicados: 50 });
  });

  it('lee el árbol SEO pero no puede modificarlo', async () => {
    await asRole(db, 'anon');
    const lectura = await db.query<{ n: number }>(`select count(*)::int as n from public.seo_routes`);
    await expect(
      db.query(`insert into public.seo_routes (path, kind, sort_order) values ('/falsa/', 'topic', 999)`),
    ).rejects.toThrow();
    await asSuperuser(db);

    expect(lectura.rows[0].n).toBe(128);
  });

  it('no ve eventos en borrador ni sus tipos de entrada', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'org-borrador');
    const draftId = await createEvent(db, organizer, { slug: 'borrador-privado', status: 'draft' });
    await db.query(
      `insert into public.ticket_types (event_id, name, price_cents, quantity_total)
       values ($1, 'General', 100, 10)`,
      [draftId],
    );

    await asRole(db, 'anon');
    const eventos = await db.query<{ n: number }>(
      `select count(*)::int as n from public.events where slug = 'borrador-privado'`,
    );
    const entradas = await db.query<{ n: number }>(
      `select count(*)::int as n from public.ticket_types where event_id = $1`,
      [draftId],
    );
    await asSuperuser(db);

    expect(eventos.rows[0].n).toBe(0);
    expect(entradas.rows[0].n).toBe(0);
  });

  it('no puede crear, editar ni borrar eventos', async () => {
    await asRole(db, 'anon');

    await expect(
      db.query(
        `insert into public.events (organizer_id, event_type_id, slug, title, description, mode, starts_at)
         values ((select id from public.organizers limit 1),
                 (select id from public.categories where kind = 'event_type' limit 1),
                 'intento-anon', 'Intento', 'Intento', 'virtual', '2027-09-01 18:00:00+00')`,
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query(`update public.events set title = 'Cambio anónimo'`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(db.query(`delete from public.events`)).rejects.toThrow(/permission denied/);

    await asSuperuser(db);
  });

  it('no lee órdenes, pagos, boletos ni perfiles', async () => {
    await asSuperuser(db);
    await createOrderFixture(db, await eventIdBySlug('congreso-demo-ia'));

    await asRole(db, 'anon');
    for (const table of ['orders', 'order_items', 'payments', 'tickets', 'profiles']) {
      await expect(db.query(`select count(*) from public.${table}`)).rejects.toThrow(
        /permission denied/,
      );
    }
    await asSuperuser(db);
  });

  it('ve organizadores activos, pero nunca el propietario ni los inactivos', async () => {
    await asSuperuser(db);
    await createOrganizer(db, null, 'org-inactivo', 'inactive');

    await asRole(db, 'anon');
    const visibles = await db.query<{ slug: string }>(`select slug from public.organizers`);
    await expect(db.query(`select owner_user_id from public.organizers`)).rejects.toThrow(
      /permission denied/,
    );
    await asSuperuser(db);

    const slugs = visibles.rows.map((row) => row.slug);
    expect(slugs).toContain('organizador-demo-uno');
    expect(slugs).not.toContain('org-inactivo');
  });
});

describe('propietarios de un evento (authenticated)', () => {
  it('ve sus borradores y no los de otro organizador', async () => {
    await asSuperuser(db);
    const ownerA = await createUser(db);
    const orgA = await createOrganizer(db, ownerA, 'org-a');
    await createEvent(db, orgA, { slug: 'evento-a-borrador' });
    const ownerB = await createUser(db);
    const orgB = await createOrganizer(db, ownerB, 'org-b');
    await createEvent(db, orgB, { slug: 'evento-b-borrador' });

    await asRole(db, 'authenticated', ownerA);
    const visibles = await db.query<{ slug: string }>(
      `select slug from public.events where slug in ('evento-a-borrador', 'evento-b-borrador')`,
    );
    await asSuperuser(db);

    expect(visibles.rows.map((row) => row.slug)).toEqual(['evento-a-borrador']);
  });

  it('puede crear un borrador propio, pero no publicarlo directamente', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'org-c');

    const insertEvent = (status: string) =>
      db.query(
        `insert into public.events (organizer_id, event_type_id, slug, title, description, mode, starts_at, status)
         values ($1, (select id from public.categories where kind = 'event_type' and slug = 'congresos'),
                 $2, 'Nuevo evento', 'Descripción', 'virtual', '2027-09-01 18:00:00+00', '${status}')`,
        [organizer, `evento-${status}-${status === 'draft' ? 'ok' : 'bloqueado'}`],
      );

    await asRole(db, 'authenticated', owner);
    await expect(insertEvent('draft')).resolves.toBeDefined();
    await expect(insertEvent('published')).rejects.toThrow(/row-level security/);
    await asSuperuser(db);
  });

  it('no puede cambiar un evento publicado de otro organizador', async () => {
    await asSuperuser(db);
    const intruso = await createUser(db);

    await asRole(db, 'authenticated', intruso);
    const result = await db.query(
      `update public.events set title = 'Cambio ajeno' where slug = 'congreso-demo-ia'`,
    );
    await asSuperuser(db);

    const titulo = await db.query<{ title: string }>(
      `select title from public.events where slug = 'congreso-demo-ia'`,
    );
    expect(result.affectedRows).toBe(0);
    expect(titulo.rows[0].title).toBe('Congreso demo de IA');
  });

  it('no ve órdenes aunque sean de sus propios eventos', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'org-d');
    const eventId = await createEvent(db, organizer, { slug: 'evento-d-con-venta' });
    await db.query(
      `insert into public.ticket_types (event_id, name, price_cents, quantity_total)
       values ($1, 'General', 0, 10)`,
      [eventId],
    );
    await createOrderFixture(db, eventId);

    await asRole(db, 'authenticated', owner);
    const ordenes = await db.query<{ n: number }>(`select count(*)::int as n from public.orders`);
    await asSuperuser(db);

    expect(ordenes.rows[0].n).toBe(0);
  });

  it('no puede cambiar su propio rol a administrador', async () => {
    await asSuperuser(db);
    const usuario = await createUser(db);

    await asRole(db, 'authenticated', usuario);
    await expect(db.query(`update public.profiles set role = 'admin' where id = $1`, [usuario])).rejects.toThrow(
      /permission denied/,
    );
    await asSuperuser(db);
  });
});

describe('administrador', () => {
  it('ve borradores ajenos y puede publicar un evento', async () => {
    await asSuperuser(db);
    const admin = await createUser(db, 'admin');
    const eventId = await eventIdBySlug('evento-d-con-venta');

    await asRole(db, 'authenticated', admin);
    const visible = await db.query<{ n: number }>(
      `select count(*)::int as n from public.events where slug = 'evento-d-con-venta'`,
    );
    const actualizado = await db.query(`update public.events set status = 'published' where id = $1`, [
      eventId,
    ]);
    await asSuperuser(db);

    expect(visible.rows[0].n).toBe(1);
    expect(actualizado.affectedRows).toBe(1);
  });

  it('lee órdenes, pagos y boletos; un organizador no', async () => {
    await asSuperuser(db);
    const admin = (
      await db.query<{ id: string }>(`select id from public.profiles where role = 'admin' limit 1`)
    ).rows[0].id;

    await asRole(db, 'authenticated', admin);
    const conteos = await db.query<{ ordenes: number; pagos: number; boletos: number }>(
      `select
         (select count(*)::int from public.orders) as ordenes,
         (select count(*)::int from public.payments) as pagos,
         (select count(*)::int from public.tickets) as boletos`,
    );
    await asSuperuser(db);

    expect(conteos.rows[0].ordenes).toBeGreaterThan(0);
    expect(conteos.rows[0].pagos).toBeGreaterThan(0);
    expect(conteos.rows[0].boletos).toBeGreaterThan(0);
  });
});

describe('restricciones de datos', () => {
  it('rechaza más entradas vendidas que el cupo', async () => {
    await asSuperuser(db);
    await expect(
      db.query(
        `update public.ticket_types set quantity_sold = quantity_total + 1
         where id = (select id from public.ticket_types limit 1)`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('rechaza precios negativos', async () => {
    await expect(
      db.query(
        `insert into public.ticket_types (event_id, name, price_cents, quantity_total)
         values ((select id from public.events limit 1), 'Negativo', -1, 1)`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('rechaza slugs reservados para las páginas de modalidad', async () => {
    await expect(
      db.query(
        `insert into public.events (organizer_id, event_type_id, slug, title, description, mode, starts_at)
         values ((select id from public.organizers limit 1),
                 (select id from public.categories where kind = 'event_type' limit 1),
                 'virtual', 'Título', 'Descripción', 'virtual', '2027-09-01 18:00:00+00')`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('rechaza usar una ciudad como tipo de evento', async () => {
    await expect(
      db.query(
        `insert into public.events (organizer_id, event_type_id, slug, title, description, mode, starts_at)
         values ((select id from public.organizers limit 1),
                 (select id from public.categories where kind = 'location' limit 1),
                 'ciudad-como-tipo', 'Título', 'Descripción', 'virtual', '2027-09-01 18:00:00+00')`,
      ),
    ).rejects.toThrow(/foreign key constraint/);
  });

  it('exige ciudad en eventos presenciales', async () => {
    await expect(
      db.query(
        `insert into public.events (organizer_id, event_type_id, slug, title, description, mode, starts_at)
         values ((select id from public.organizers limit 1),
                 (select id from public.categories where kind = 'event_type' limit 1),
                 'presencial-sin-ciudad', 'Título', 'Descripción', 'presencial', '2027-09-01 18:00:00+00')`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('exige fecha de confirmación solo en órdenes confirmadas', async () => {
    await expect(
      db.query(
        `insert into public.orders (public_token_hash, event_id, buyer_name, buyer_email, status,
                                    subtotal_cents, fee_cents, total_cents)
         values (repeat('a', 64), (select id from public.events limit 1), 'Prueba', 'prueba@example.test',
                 'confirmed', 0, 0, 0)`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('exige que el total sume subtotal y comisión', async () => {
    await expect(
      db.query(
        `insert into public.orders (public_token_hash, event_id, buyer_name, buyer_email,
                                    subtotal_cents, fee_cents, total_cents)
         values (repeat('b', 64), (select id from public.events limit 1), 'Prueba', 'prueba@example.test',
                 1000, 50, 1000)`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('exige que la línea de orden coincida con precio por cantidad', async () => {
    const orderId = await createOrderFixture(db, await eventIdBySlug('congreso-demo-ia'));
    await expect(
      db.query(
        `insert into public.order_items (order_id, ticket_type_id, unit_price_cents, quantity, line_total_cents)
         values ($1, (select id from public.ticket_types where name = 'Premium' limit 1), 100, 2, 150)`,
        [orderId],
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('no permite dos pagos con la misma clave de idempotencia', async () => {
    const orderId = await createOrderFixture(db, await eventIdBySlug('charla-demo-ia'));
    const clave = 'clave-idempotente-001';
    await db.query(
      `insert into public.payments (order_id, status, amount_cents, idempotency_key)
       values ($1, 'demo_approved', 0, $2)`,
      [orderId, clave],
    );

    await expect(
      db.query(
        `insert into public.payments (order_id, status, amount_cents, idempotency_key)
         values ($1, 'demo_approved', 0, $2)`,
        [orderId, clave],
      ),
    ).rejects.toThrow(/duplicate key/);
  });

  it('no guarda datos de tarjeta en ninguna columna', async () => {
    const result = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public'
         and column_name ~* '(card|tarjeta|cvv|cvc|expir|pan$)'`,
    );

    expect(result.rows).toEqual([]);
  });
});
