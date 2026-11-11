import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, seedSql } from './helpers';

const expectedTables = [
  'analytics_events',
  'blog_posts',
  'business_packages',
  'categories',
  'editorial_pages',
  'event_survey_responses',
  'events',
  'featured_placements',
  'notification_outbox',
  'order_items',
  'orders',
  'organizers',
  'package_followup_requests',
  'payment_webhook_events',
  'payments',
  'profiles',
  'seo_routes',
  'site_settings',
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

const newCatalogEventSlugs = [
  'cumbre-brujula-digital',
  'congreso-codigo-abierto',
  'reto-circuito-autonomo',
  'liga-algoritmia-pacifico',
  'cafe-nodo-mujeres-datos',
  'after-office-devops',
  'mapa-datos-decisiones',
  'laboratorio-prototipos-ia',
  'ruta-python-automatiza',
  'cohorte-cero-apps-web',
  'premios-prisma-visualizacion',
  'desafio-llave-abierta',
  'senales-de-nube',
  'ia-con-criterio',
  'plataformas-que-aprenden',
  'diseno-para-diez',
  'hackeo-verde-48h',
  'ciudad-abierta-hackathon',
  'python-al-parque',
  'marea-emprende',
  'cinco-minutos-ciberhigiene',
  'vida-secreta-api',
  'expo-futuro-local',
  'feria-tecno-creativa',
];

const catalogMigrationSql = readFileSync(
  join(import.meta.dirname, '..', '..', 'supabase', 'migrations', '20261118100000_demo_catalog_content.sql'),
  'utf8',
);

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

  it('publica 74 eventos DEMO: 36 gratuitos y 38 de pago, 41 presenciales y 33 virtuales', async () => {
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

    expect(events.rows[0]).toEqual({ total: 74, demo: 74, presencial: 41, virtual: 33, cities: 3 });
    expect(prices.rows[0]).toEqual({ gratuitos: 36, pago: 38 });
  });

  it('agrega exactamente dos eventos nuevos por cada categoría SEO', async () => {
    const result = await db.query<{ slug: string; total: number }>(
      `select tipo.slug, count(*)::int as total
       from public.events e
       join public.categories tipo on tipo.id = e.event_type_id
       where e.slug = any($1::text[])
       group by tipo.slug
       order by min(tipo.sort_order)`,
      [newCatalogEventSlugs],
    );

    expect(result.rows).toEqual(eventTypeSlugs.map((slug) => ({ slug, total: 2 })));
  });

  it('cubre fechas, fotos, ponentes y entradas en el catálogo nuevo', async () => {
    const result = await db.query<{ sin_foto: number; sin_ponentes: number; sin_entradas: number; pasados: number }>(
      `select
         count(*) filter (where image_path is null or image_path not like '/images/events/%')::int as sin_foto,
         count(*) filter (where jsonb_array_length(speakers) = 0)::int as sin_ponentes,
         count(*) filter (where not exists (select 1 from public.ticket_types t where t.event_id = e.id and t.is_active))::int as sin_entradas,
         count(*) filter (where coalesce(ends_at, starts_at) < now())::int as pasados
       from public.events e
       where e.slug = any($1::text[])`,
      [newCatalogEventSlugs],
    );

    expect(result.rows[0]).toEqual({ sin_foto: 0, sin_ponentes: 0, sin_entradas: 0, pasados: 9 });
  });

  it('publica los tres artículos SEO del demo', async () => {
    const result = await db.query<{ total: number; sin_keyword: number; cuerpo_corto: number }>(
      `select count(*)::int as total,
         count(*) filter (where keyword is null)::int as sin_keyword,
         count(*) filter (where char_length(body_md) < 200)::int as cuerpo_corto
       from public.blog_posts
       where slug = any($1::text[]) and status = 'published'`,
      [['beneficios-networking-eventos-tecnologicos', 'como-aprovechar-hackathon', 'elegir-evento-tecnologico']],
    );
    const slugs = await db.query<{ slug: string }>(
      `select slug from public.blog_posts where slug = any($1::text[]) and status = 'published' order by slug`,
      [['beneficios-networking-eventos-tecnologicos', 'como-aprovechar-hackathon', 'elegir-evento-tecnologico']],
    );

    expect(slugs.rows.map((row) => row.slug)).toEqual([
      'beneficios-networking-eventos-tecnologicos',
      'como-aprovechar-hackathon',
      'elegir-evento-tecnologico',
    ]);
    expect(result.rows[0]).toEqual({ total: 3, sin_keyword: 0, cuerpo_corto: 0 });
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

  it('volver a ejecutar la migración y el seed no duplica filas ni cambia el catálogo previo', async () => {
    await db.exec(catalogMigrationSql);
    await db.exec(seedSql);

    const result = await db.query<{
      categorias: number;
      eventos: number;
      entradas: number;
      organizadores: number;
      rutas: number;
      articulos: number;
    }>(
      `select
         (select count(*)::int from public.categories) as categorias,
         (select count(*)::int from public.events) as eventos,
         (select count(*)::int from public.ticket_types) as entradas,
         (select count(*)::int from public.organizers) as organizadores,
         (select count(*)::int from public.seo_routes) as rutas,
         (select count(*)::int from public.blog_posts) as articulos`,
    );

    expect(result.rows[0]).toEqual({ categorias: 29, eventos: 74, entradas: 88, organizadores: 9, rutas: 128, articulos: 3 });
    const oldEvents = await db.query<{ title: string }>(
      `select title from public.events where slug in ('congreso-demo-ia', 'hackathon-demo-en-linea', 'feria-demo-tecnologia') order by slug`,
    );
    expect(oldEvents.rows).toHaveLength(3);
  });
});
