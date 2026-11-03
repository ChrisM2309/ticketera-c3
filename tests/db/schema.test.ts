import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, seedSql } from './helpers';

const expectedTables = [
  'categories',
  'events',
  'order_items',
  'orders',
  'organizers',
  'payments',
  'profiles',
  'ticket_types',
  'tickets',
];

const eventTypeSlugs = [
  'congresos',
  'competencias',
  'networking',
  'workshops',
  'bootcamps',
  'concursos',
  'webinars',
  'conferencias',
  'hackathons',
  'meetups',
  'charlas',
  'ferias-tecnologicas',
];

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('migraciones y seed', () => {
  it('aplica las migraciones desde cero y activa RLS en todas las tablas', async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );

    expect(result.rows.map((row) => row.relname).sort()).toEqual(expectedTables);
    expect(result.rows.every((row) => row.relrowsecurity)).toBe(true);
  });

  it('crea los 12 tipos de evento en el orden del Excel', async () => {
    const result = await db.query<{ slug: string }>(
      `select slug from public.categories where kind = 'event_type' order by sort_order`,
    );

    expect(result.rows.map((row) => row.slug)).toEqual(eventTypeSlugs);
  });

  it('crea 4 temas y 3 ciudades', async () => {
    const result = await db.query<{ kind: string; total: number }>(
      `select kind, count(*)::int as total from public.categories
       where kind in ('topic', 'location') group by kind order by kind`,
    );

    expect(result.rows).toEqual([
      { kind: 'location', total: 3 },
      { kind: 'topic', total: 4 },
    ]);
  });

  it('publica 10 eventos DEMO: 5 gratuitos y 5 de pago, 6 presenciales y 4 virtuales', async () => {
    const events = await db.query<{
      total: number;
      demo: number;
      presencial: number;
      virtual: number;
      cities: number;
    }>(
      `select
         count(*)::int as total,
         count(*) filter (where is_demo and status = 'published')::int as demo,
         count(*) filter (where mode = 'presencial')::int as presencial,
         count(*) filter (where mode = 'virtual')::int as virtual,
         count(distinct location_id)::int as cities
       from public.events`,
    );
    const prices = await db.query<{ gratuitos: number; pago: number }>(
      `select
         count(*) filter (where min_price = 0)::int as gratuitos,
         count(*) filter (where min_price > 0)::int as pago
       from (
         select e.id, min(t.price_cents) as min_price
         from public.events e
         join public.ticket_types t on t.event_id = e.id
         group by e.id
       ) priced`,
    );

    expect(events.rows[0]).toEqual({ total: 10, demo: 10, presencial: 6, virtual: 4, cities: 3 });
    expect(prices.rows[0]).toEqual({ gratuitos: 5, pago: 5 });
  });

  it('da al menos un tipo de entrada a cada evento del seed', async () => {
    const result = await db.query<{ sin_entradas: number }>(
      `select count(*)::int as sin_entradas
       from public.events e
       where not exists (select 1 from public.ticket_types t where t.event_id = e.id and t.is_active)`,
    );

    expect(result.rows[0].sin_entradas).toBe(0);
  });

  it('no crea cuentas de Auth ni organizadores con propietario', async () => {
    const result = await db.query<{ cuentas: number; con_propietario: number }>(
      `select
         (select count(*)::int from auth.users) as cuentas,
         (select count(*)::int from public.organizers where owner_user_id is not null) as con_propietario`,
    );

    expect(result.rows[0]).toEqual({ cuentas: 0, con_propietario: 0 });
  });

  it('volver a ejecutar el seed no duplica filas', async () => {
    await db.exec(seedSql);

    const result = await db.query<{ categorias: number; eventos: number; entradas: number; organizadores: number }>(
      `select
         (select count(*)::int from public.categories) as categorias,
         (select count(*)::int from public.events) as eventos,
         (select count(*)::int from public.ticket_types) as entradas,
         (select count(*)::int from public.organizers) as organizadores`,
    );

    expect(result.rows[0]).toEqual({ categorias: 19, eventos: 10, entradas: 13, organizadores: 2 });
  });
});
