import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

let db: PGlite;

function speakers(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    name: `Ponente DEMO ${index + 1}`,
    role: 'Rol de ejemplo (DEMO)',
  }));
}

async function setSpeakers(eventId: string, value: unknown) {
  await asSuperuser(db);

  return db.query(`update public.events set speakers = $1::jsonb where id = $2`, [JSON.stringify(value), eventId]);
}

async function newEvent(slug: string, status: string): Promise<string> {
  await asSuperuser(db);
  const owner = await createUser(db, 'organizer');
  const organizerId = await createOrganizer(db, owner, `org-${slug}`);

  return createEvent(db, organizerId, { slug, status });
}

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('events.speakers', () => {
  it('un evento nuevo empieza con una lista de ponentes vacía', async () => {
    const eventId = await newEvent('evento-sin-ponentes', 'draft');

    await asSuperuser(db);
    const result = await db.query<{ speakers: unknown }>(`select speakers from public.events where id = $1`, [eventId]);

    expect(result.rows[0].speakers).toEqual([]);
  });

  it('acepta hasta 8 ponentes válidos', async () => {
    const eventId = await newEvent('evento-ocho-ponentes', 'draft');

    await setSpeakers(eventId, speakers(8));

    await asSuperuser(db);
    const result = await db.query<{ total: number }>(
      `select jsonb_array_length(speakers) as total from public.events where id = $1`,
      [eventId],
    );
    expect(result.rows[0].total).toBe(8);
  });

  it('acepta un ponente sin rol y los límites exactos de nombre y rol', async () => {
    const eventId = await newEvent('evento-limites-ponentes', 'draft');

    await setSpeakers(eventId, [
      { name: 'a', role: '' },
      { name: 'n'.repeat(80), role: 'r'.repeat(120) },
    ]);
  });

  it('rechaza 9 ponentes', async () => {
    const eventId = await newEvent('evento-nueve-ponentes', 'draft');

    await expect(setSpeakers(eventId, speakers(9))).rejects.toThrow(/events_speakers_check/);
  });

  it('rechaza un ponente sin nombre', async () => {
    const eventId = await newEvent('evento-ponente-sin-nombre', 'draft');

    await expect(setSpeakers(eventId, [{ name: '', role: 'Rol de ejemplo (DEMO)' }])).rejects.toThrow(
      /events_speakers_check/,
    );
    await expect(setSpeakers(eventId, [{ role: 'Rol de ejemplo (DEMO)' }])).rejects.toThrow(/events_speakers_check/);
  });

  it('rechaza nombres o roles demasiado largos y valores que no son texto', async () => {
    const eventId = await newEvent('evento-ponente-invalido', 'draft');

    await expect(setSpeakers(eventId, [{ name: 'n'.repeat(81), role: '' }])).rejects.toThrow(/events_speakers_check/);
    await expect(setSpeakers(eventId, [{ name: 'Ponente DEMO 1', role: 'r'.repeat(121) }])).rejects.toThrow(
      /events_speakers_check/,
    );
    await expect(setSpeakers(eventId, [{ name: 5, role: '' }])).rejects.toThrow(/events_speakers_check/);
    await expect(setSpeakers(eventId, { name: 'Ponente DEMO 1', role: '' })).rejects.toThrow(/events_speakers_check/);
  });

  it('anon lee los ponentes de un evento publicado y no los de uno pendiente', async () => {
    const publishedId = await newEvent('evento-publicado-ponentes', 'published');
    const pendingId = await newEvent('evento-pendiente-ponentes', 'pending');
    await setSpeakers(publishedId, speakers(2));
    await setSpeakers(pendingId, speakers(2));

    await asRole(db, 'anon');
    const published = await db.query<{ speakers: { name: string; role: string }[] }>(
      `select speakers from public.events where id = $1`,
      [publishedId],
    );
    const pending = await db.query(`select speakers from public.events where id = $1`, [pendingId]);

    expect(published.rows[0].speakers).toEqual(speakers(2));
    expect(pending.rows).toHaveLength(0);
  });
});

describe('seed de ponentes', () => {
  it('cinco eventos DEMO publicados traen ponentes ficticios y anon los lee', async () => {
    await asRole(db, 'anon');
    const result = await db.query<{ slug: string; speakers: { name: string; role: string }[] }>(
      `select slug, speakers
       from public.events
       where slug = any($1::text[])
       order by slug`,
      [['bootcamp-demo-cloud', 'conferencia-demo-programacion', 'congreso-demo-ciberseguridad', 'congreso-demo-ia', 'hackathon-demo-en-linea']],
    );

    expect(result.rows).toHaveLength(5);
    for (const row of result.rows) {
      expect(row.speakers.every((speaker) => /^Ponente DEMO [0-9]+$/.test(speaker.name))).toBe(true);
      expect(row.speakers.every((speaker) => speaker.role === 'Rol de ejemplo (DEMO)')).toBe(true);
    }
  });
});

describe('create_organizer_event con ponentes', () => {
  const tickets = JSON.stringify([{ name: 'General', price_cents: 1000, quantity_total: 50, max_per_order: 4 }]);

  async function categoryIds() {
    await asSuperuser(db);
    const result = await db.query<{ event_type: string; topic: string; location: string }>(
      `select
         (select id from public.categories where kind = 'event_type' and slug = 'congresos') as event_type,
         (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial') as topic,
         (select id from public.categories where kind = 'location' and slug = 'san-salvador') as location`,
    );

    return result.rows[0];
  }

  it('guarda los ponentes que envía el organizador', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-con-ponentes');
    const category = await categoryIds();

    await asRole(db, 'authenticated', owner);
    const created = await db.query<{ id: string }>(
      `select public.create_organizer_event(
         $1, 'evento-con-ponentes-a1', 'Evento de prueba', 'Descripción suficiente para la prueba.', null,
         'presencial', 'Sede de prueba', null, '2027-09-01T18:00:00Z'::timestamptz, null,
         $2, $3, $4, $5::jsonb, $6::jsonb
       ) as id`,
      [organizerId, category.event_type, category.topic, category.location, tickets, JSON.stringify(speakers(3))],
    );

    const stored = await db.query<{ speakers: unknown }>(`select speakers from public.events where id = $1`, [
      created.rows[0].id,
    ]);
    expect(stored.rows[0].speakers).toEqual(speakers(3));
  });

  it('rechaza más de 8 ponentes y no deja filas', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-ponentes-excedidos');
    const category = await categoryIds();

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(
        `select public.create_organizer_event(
           $1, 'evento-nueve-ponentes-b2', 'Evento de prueba', 'Descripción suficiente para la prueba.', null,
           'presencial', 'Sede de prueba', null, '2027-09-01T18:00:00Z'::timestamptz, null,
           $2, $3, $4, $5::jsonb, $6::jsonb
         )`,
        [organizerId, category.event_type, category.topic, category.location, tickets, JSON.stringify(speakers(9))],
      ),
    ).rejects.toThrow(/events_speakers_check/);

    await asSuperuser(db);
    const count = await db.query<{ total: number }>(
      `select count(*)::int as total from public.events where slug = 'evento-nueve-ponentes-b2'`,
    );
    expect(count.rows[0].total).toBe(0);
  });

  it('la llamada de catorce argumentos sigue funcionando y deja la lista vacía', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-sin-ponentes');
    const category = await categoryIds();

    await asRole(db, 'authenticated', owner);
    const created = await db.query<{ id: string }>(
      `select public.create_organizer_event(
         $1, 'evento-sin-ponentes-c3', 'Evento de prueba', 'Descripción suficiente para la prueba.', null,
         'presencial', 'Sede de prueba', null, '2027-09-01T18:00:00Z'::timestamptz, null,
         $2, $3, $4, $5::jsonb
       ) as id`,
      [organizerId, category.event_type, category.topic, category.location, tickets],
    );

    const stored = await db.query<{ speakers: unknown }>(`select speakers from public.events where id = $1`, [
      created.rows[0].id,
    ]);
    expect(stored.rows[0].speakers).toEqual([]);
  });

  it('solo existe una versión de la función y anon no puede ejecutarla', async () => {
    await asSuperuser(db);
    const functions = await db.query<{ args: string }>(
      `select pg_get_function_identity_arguments(p.oid) as args
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'create_organizer_event'`,
    );
    expect(functions.rows).toHaveLength(1);
    expect(functions.rows[0].args).toMatch(/p_speakers jsonb/);

    const grants = await db.query<{ anon: boolean; authenticated: boolean }>(
      `select has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as authenticated
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'create_organizer_event'`,
    );
    expect(grants.rows[0]).toEqual({ anon: false, authenticated: true });
  });
});
