import { describe, expect, it } from 'vitest';

import { buildRobots, indexableCatalogPaths, privatePaths, robotsMetadata } from '../../src/lib/seo/indexing';
import type { CatalogEvent, CatalogTaxonomy } from '../../src/features/catalog/types';

const now = new Date('2027-03-01T12:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const taxonomy: CatalogTaxonomy = {
  eventTypes: [
    { slug: 'congresos', name: 'Congresos' },
    { slug: 'hackathons', name: 'Hackathons' },
    { slug: 'ferias-tecnologicas', name: 'Ferias tecnológicas' },
  ],
  topics: [{ slug: 'cloud', name: 'Cloud' }],
  locations: [{ slug: 'san-salvador', name: 'San Salvador' }],
  routes: [
    { path: '/congresos/', kind: 'event_type', isIndexable: true },
    { path: '/hackathons/', kind: 'event_type', isIndexable: true },
    { path: '/ferias-tecnologicas/', kind: 'event_type', isIndexable: true },
    { path: '/cloud/', kind: 'topic', isIndexable: true },
    { path: '/san-salvador/', kind: 'location', isIndexable: true },
    { path: '/congresos/cloud/', kind: 'subtopic', isIndexable: true },
    { path: '/congresos/cloud/gratis/', kind: 'modality', isIndexable: false },
  ],
};

function event(id: string, overrides: Partial<CatalogEvent> = {}): CatalogEvent {
  return {
    id,
    slug: id,
    title: id,
    startsAt: new Date(now.getTime() + 2 * DAY_MS).toISOString(),
    mode: 'presencial',
    venue: 'Sede',
    imagePath: null,
    eventType: { slug: 'congresos', name: 'Congresos' },
    topic: { slug: 'cloud' },
    location: { slug: 'san-salvador', name: 'San Salvador' },
    organizer: null,
    speakers: [],
    ticketTypes: [{ priceCents: 0, isActive: true }],
    ...overrides,
  };
}

// e1: congreso gratuito de cloud en San Salvador. e2: hackathon en línea sin tema.
const events = [
  event('e1'),
  event('e2', {
    eventType: { slug: 'hackathons', name: 'Hackathons' },
    topic: null,
    mode: 'virtual',
    location: null,
    venue: null,
    ticketTypes: [{ priceCents: 1000, isActive: true }],
  }),
];

describe('rutas indexables del catálogo', () => {
  it('incluye solo rutas indexables con eventos próximos', () => {
    expect(indexableCatalogPaths(taxonomy, events, now)).toEqual([
      '/congresos/',
      '/hackathons/',
      '/cloud/',
      '/san-salvador/',
      '/congresos/cloud/',
    ]);
  });

  it('excluye tipos vacíos, subtemas sin eventos y modalidades aunque tengan eventos', () => {
    const paths = indexableCatalogPaths(taxonomy, [event('solo-cloud')], now);

    expect(paths).not.toContain('/ferias-tecnologicas/');
    expect(paths).not.toContain('/hackathons/');
    expect(paths).not.toContain('/congresos/cloud/gratis/');
    expect(paths).toContain('/congresos/cloud/');
  });

  it('no incluye eventos que ya terminaron (el listado solo trae próximos)', () => {
    expect(indexableCatalogPaths(taxonomy, [], now)).toEqual([]);
  });
});

describe('reglas de robots', () => {
  it('apagado bloquea todo y no anuncia sitemap', () => {
    expect(buildRobots({ indexingEnabled: false, siteUrl: 'https://demo.ticketera.c3.com.sv' })).toEqual({
      rules: { userAgent: '*', disallow: '/' },
    });
  });

  it('encendido permite todo salvo rutas privadas y anuncia el sitemap', () => {
    expect(buildRobots({ indexingEnabled: true, siteUrl: 'https://ticketera.example' })).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: privatePaths },
      sitemap: 'https://ticketera.example/sitemap.xml',
    });
    expect(privatePaths).toEqual(expect.arrayContaining(['/calendario/', '/carrito/', '/checkout/', '/mis-boletos/']));
  });

  it('robotsMetadata solo indexa con interruptor y página indexable', () => {
    expect(robotsMetadata({ indexingEnabled: false, pageIndexable: true })).toEqual({ index: false, follow: false });
    expect(robotsMetadata({ indexingEnabled: true, pageIndexable: false })).toEqual({ index: false, follow: false });
    expect(robotsMetadata({ indexingEnabled: true, pageIndexable: true })).toEqual({ index: true, follow: true });
  });

  it('privatePaths incluye registro, recuperar y cuenta', () => {
    expect(privatePaths).toEqual(expect.arrayContaining(['/registro/', '/recuperar/', '/cuenta/']));
  });

  it('privatePaths no lista rutas inexistentes', () => {
    expect(privatePaths).not.toContain('/publicar/');
    expect(privatePaths).toContain('/mis-boletos/');
  });
});
