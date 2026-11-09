import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, seedSql } from './helpers';

const expectedTables = [
  'categories',
  'event_featured',
  'events',
  'order_items',
  'orders',
  'organizers',
  'payments',
  'profiles',
  'seo_routes',
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

  it('crea 14 temas y 3 ciudades', async () => {
    const result = await db.query<{ kind: string; total: number }>(
      `select kind, count(*)::int as total from public.categories
       where kind in ('topic', 'location') group by kind order by kind`,
    );

    expect(result.rows).toEqual([
      { kind: 'location', total: 3 },
      { kind: 'topic', total: 14 },
    ]);
  });

  it('registra las 128 rutas del árbol del Excel, sin organizadores y con modalidad sin indexar', async () => {
    const result = await db.query<{ kind: string; total: number; sin_indexar: number }>(
      `select kind, count(*)::int as total, count(*) filter (where not is_indexable)::int as sin_indexar
       from public.seo_routes group by kind order by kind`,
    );
    const organizadores = await db.query<{ total: number }>(
      `select count(*)::int as total from public.seo_routes where path in ('/claude/', '/copa/')`,
    );

    expect(result.rows).toEqual([
      { kind: 'event_type', total: 12, sin_indexar: 0 },
      { kind: 'location', total: 3, sin_indexar: 0 },
      { kind: 'modality', total: 76, sin_indexar: 76 },
      { kind: 'subtopic', total: 33, sin_indexar: 0 },
      { kind: 'topic', total: 4, sin_indexar: 0 },
    ]);
    expect(organizadores.rows[0].total).toBe(0);
  });

  it('cada evento con tema tiene su subtema en el árbol del Excel', async () => {
    const result = await db.query<{ sin_ruta: number }>(
      `select count(*)::int as sin_ruta
       from public.events e
       join public.categories tipo on tipo.id = e.event_type_id
       join public.categories tema on tema.id = e.topic_id
       where not exists (
         select 1 from public.seo_routes r
         where r.path = '/' || tipo.slug || '/' || tema.slug || '/' and r.kind = 'subtopic'
       )`,
    );

    expect(result.rows[0].sin_ruta).toBe(0);
  });

  it('publica 50 eventos DEMO: 24 gratuitos y 26 de pago, 29 presenciales y 21 virtuales', async () => {
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

    expect(events.rows[0]).toEqual({ total: 50, demo: 50, presencial: 29, virtual: 21, cities: 3 });
    expect(prices.rows[0]).toEqual({ gratuitos: 24, pago: 26 });
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

    const result = await db.query<{
      categorias: number;
      eventos: number;
      entradas: number;
      organizadores: number;
      rutas: number;
    }>(
      `select
         (select count(*)::int from public.categories) as categorias,
         (select count(*)::int from public.events) as eventos,
         (select count(*)::int from public.ticket_types) as entradas,
         (select count(*)::int from public.organizers) as organizadores,
         (select count(*)::int from public.seo_routes) as rutas`,
    );

    expect(result.rows[0]).toEqual({ categorias: 29, eventos: 50, entradas: 56, organizadores: 4, rutas: 128 });
  });
});
