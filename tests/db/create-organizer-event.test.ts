import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createOrganizer, createUser } from './helpers';

let db: PGlite;

const ticketTypes = JSON.stringify([
  { name: 'General', price_cents: 1000, quantity_total: 50, max_per_order: 4 },
  { name: 'Premium', price_cents: 2500, quantity_total: 10, max_per_order: 2 },
]);

async function categoryId(kind: string, slug: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ id: string }>(
    `select id from public.categories where kind = $1 and slug = $2`,
    [kind, slug],
  );

  return result.rows[0].id;
}

async function createEventAs(
  userId: string,
  organizerId: string,
  options: { slug: string; tickets?: string; speakers?: string },
) {
  // Los ids se leen antes de cambiar de rol: categoryId() corre como superusuario.
  const eventTypeId = await categoryId('event_type', 'congresos');
  const topicId = await categoryId('topic', 'inteligencia-artificial');
  const locationId = await categoryId('location', 'san-salvador');

  await asRole(db, 'authenticated', userId);

  const baseArgs = [organizerId, options.slug, eventTypeId, topicId, locationId, options.tickets ?? ticketTypes];

  // Sin ponentes se usa la llamada de 14 argumentos (p_speakers toma su valor por defecto).
  if (options.speakers === undefined) {
    return db.query<{ id: string }>(
      `select public.create_organizer_event(
         $1, $2, 'Evento de prueba', 'Descripción suficiente para la prueba.', null,
         'presencial', 'Sede de prueba', null, '2027-09-01T18:00:00Z'::timestamptz, null,
         $3, $4, $5, $6::jsonb
       ) as id`,
      baseArgs,
    );
  }

  return db.query<{ id: string }>(
    `select public.create_organizer_event(
       $1, $2, 'Evento de prueba', 'Descripción suficiente para la prueba.', null,
       'presencial', 'Sede de prueba', null, '2027-09-01T18:00:00Z'::timestamptz, null,
       $3, $4, $5, $6::jsonb, $7::jsonb
     ) as id`,
    [...baseArgs, options.speakers],
  );
}

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('create_organizer_event', () => {
  it('el propietario crea un evento pendiente con sus entradas', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-propio');

    const result = await createEventAs(owner, organizerId, { slug: 'evento-propio-a1' });
    const eventId = result.rows[0].id;

    await asRole(db, 'authenticated', owner);
    const event = await db.query<{ status: string }>(`select status from public.events where id = $1`, [eventId]);
    const tickets = await db.query<{ name: string; price_cents: number; quantity_sold: number; is_active: boolean }>(
      `select name, price_cents, quantity_sold, is_active from public.ticket_types where event_id = $1 order by name`,
      [eventId],
    );

    expect(event.rows).toEqual([{ status: 'pending' }]);
    expect(tickets.rows).toEqual([
      { name: 'General', price_cents: 1000, quantity_sold: 0, is_active: true },
      { name: 'Premium', price_cents: 2500, quantity_sold: 0, is_active: true },
    ]);
  });

  it('guarda los ponentes recibidos en p_speakers', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-con-ponentes');
    const speakers = [
      { name: 'Ponente DEMO 1', role: 'Rol de ejemplo (DEMO)' },
      { name: 'Ponente DEMO 2', role: '' },
    ];

    const created = await createEventAs(owner, organizerId, {
      slug: 'evento-con-ponentes-g7',
      speakers: JSON.stringify(speakers),
    });

    await asRole(db, 'authenticated', owner);
    const event = await db.query<{ speakers: unknown }>(`select speakers from public.events where id = $1`, [
      created.rows[0].id,
    ]);
    expect(event.rows[0].speakers).toEqual(speakers);
  });

  it('sin p_speakers el evento queda con la lista de ponentes vacía', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-sin-ponentes');

    const created = await createEventAs(owner, organizerId, { slug: 'evento-sin-ponentes-h8' });

    await asRole(db, 'authenticated', owner);
    const event = await db.query<{ speakers: unknown }>(`select speakers from public.events where id = $1`, [
      created.rows[0].id,
    ]);
    expect(event.rows[0].speakers).toEqual([]);
  });

  it('un evento recién creado no es visible en el catálogo público', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-oculto');
    await createEventAs(owner, organizerId, { slug: 'evento-oculto-b2' });

    await asRole(db, 'anon');
    const publicRows = await db.query(`select id from public.events where slug = 'evento-oculto-b2'`);
    const publicTickets = await db.query(
      `select t.id from public.ticket_types t join public.events e on e.id = t.event_id where e.slug = 'evento-oculto-b2'`,
    );

    expect(publicRows.rows).toHaveLength(0);
    expect(publicTickets.rows).toHaveLength(0);
  });

  it('otro organizador no puede crear eventos en una organización ajena', async () => {
    const owner = await createUser(db, 'organizer');
    const intruder = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-ajeno');

    await expect(createEventAs(intruder, organizerId, { slug: 'evento-intruso-c3' })).rejects.toThrow(
      /row-level security/,
    );

    await asSuperuser(db);
    const count = await db.query<{ total: number }>(
      `select count(*)::int as total from public.events where slug = 'evento-intruso-c3'`,
    );
    expect(count.rows[0].total).toBe(0);
  });

  it('un usuario sin organización no puede crear eventos', async () => {
    const stranger = await createUser(db, 'organizer');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-sin-dueno-acceso');

    await expect(createEventAs(stranger, organizerId, { slug: 'evento-extrano-d4' })).rejects.toThrow(
      /row-level security/,
    );
  });

  it('rechaza un evento sin tipos de entrada y no deja filas', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-sin-entradas');

    await expect(createEventAs(owner, organizerId, { slug: 'evento-sin-entradas-e5', tickets: '[]' })).rejects.toThrow(
      /al menos un tipo de entrada/,
    );

    await asSuperuser(db);
    const count = await db.query<{ total: number }>(
      `select count(*)::int as total from public.events where slug = 'evento-sin-entradas-e5'`,
    );
    expect(count.rows[0].total).toBe(0);
  });

  it('el organizador no puede publicar directamente con un UPDATE sobre su evento', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-no-publica');
    const created = await createEventAs(owner, organizerId, { slug: 'evento-no-publica-f6' });

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`update public.events set status = 'published' where id = $1`, [created.rows[0].id]),
    ).rejects.toThrow(/row-level security/);
  });
});
