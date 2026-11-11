import { describe, expect, it } from 'vitest';

import {
  filterCatalogEvents,
  filterCatalogEventsByFilters,
  filtersForScope,
  noCatalogFilters,
  parseCatalogFilters,
} from '../../src/features/catalog/filters';
import { resolveCatalogRoute } from '../../src/features/catalog/routes';
import type { CatalogEvent, CatalogTaxonomy } from '../../src/features/catalog/types';

const now = new Date('2027-03-01T12:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const taxonomy: CatalogTaxonomy = {
  eventTypes: [
    { slug: 'congresos', name: 'Congresos' },
    { slug: 'hackathons', name: 'Hackathons' },
  ],
  topics: [
    { slug: 'cloud', name: 'Cloud' },
    { slug: 'python', name: 'Python' },
  ],
  locations: [
    { slug: 'san-salvador', name: 'San Salvador' },
    { slug: 'san-miguel', name: 'San Miguel' },
  ],
  routes: [
    { path: '/congresos/', kind: 'event_type', isIndexable: true },
    { path: '/hackathons/', kind: 'event_type', isIndexable: true },
    { path: '/cloud/', kind: 'topic', isIndexable: true },
    { path: '/python/', kind: 'topic', isIndexable: true },
    { path: '/san-salvador/', kind: 'location', isIndexable: true },
    { path: '/san-miguel/', kind: 'location', isIndexable: true },
    { path: '/congresos/cloud/', kind: 'subtopic', isIndexable: true },
    { path: '/congresos/cloud/presencial/', kind: 'modality', isIndexable: false },
    { path: '/congresos/cloud/gratis/', kind: 'modality', isIndexable: false },
    { path: '/congresos/cloud/virtual/', kind: 'modality', isIndexable: false },
    { path: '/hackathons/python/', kind: 'subtopic', isIndexable: true },
  ],
};

const congreso = { slug: 'congresos', name: 'Congresos' };
const hackathon = { slug: 'hackathons', name: 'Hackathons' };
const sanSalvador = { slug: 'san-salvador', name: 'San Salvador' };
const sanMiguel = { slug: 'san-miguel', name: 'San Miguel' };

function event(id: string, overrides: Partial<CatalogEvent> = {}): CatalogEvent {
  return {
    id,
    slug: id,
    title: id,
    startsAt: new Date(now.getTime() + 2 * DAY_MS).toISOString(),
    mode: 'presencial',
    venue: 'Sede',
    imagePath: null,
    eventType: congreso,
    topic: { slug: 'cloud' },
    location: sanSalvador,
    organizer: null,
    speakers: [],
    ticketTypes: [{ priceCents: 0, isActive: true }],
    ...overrides,
  };
}

// a: gratis, presencial, San Salvador, en 2 días.
// b: de pago, en línea, sin tema, en 20 días.
// c: hackathon de pago en San Miguel, en 2 días.
// d: sin entradas activas, San Salvador, en 2 días.
const events: CatalogEvent[] = [
  event('a'),
  event('b', {
    mode: 'virtual',
    location: null,
    topic: null,
    startsAt: new Date(now.getTime() + 20 * DAY_MS).toISOString(),
    ticketTypes: [{ priceCents: 1500, isActive: true }],
  }),
  event('c', {
    eventType: hackathon,
    location: sanMiguel,
    topic: { slug: 'python' },
    ticketTypes: [
      { priceCents: 0, isActive: false },
      { priceCents: 5000, isActive: true },
    ],
  }),
  event('d', { ticketTypes: [{ priceCents: 0, isActive: false }] }),
];

function ids(scopePath: string, filters = noCatalogFilters): string[] {
  const scope = resolveCatalogRoute(scopePath.split('/').filter(Boolean), taxonomy);

  if (!scope) {
    throw new Error(`Ruta sin alcance: ${scopePath}`);
  }

  return filterCatalogEvents(events, scope, filters, now).map((item) => item.id);
}

describe('lectura de filtros desde la URL', () => {
  it('ignora valores que no están en la lista y ciudades desconocidas', () => {
    expect(
      parseCatalogFilters(
        { ciudad: 'zzz', modalidad: 'hibrido', precio: 'gratis', fecha: 'anio' },
        ['san-salvador'],
      ),
    ).toEqual({ ciudad: null, modalidad: null, precio: 'gratis', fecha: null });
  });

  it('usa el primer valor cuando el parámetro se repite', () => {
    expect(parseCatalogFilters({ ciudad: ['san-salvador', 'san-miguel'] }, ['san-salvador', 'san-miguel']).ciudad).toBe(
      'san-salvador',
    );
  });

  it('acepta el atajo de este fin de semana', () => {
    expect(parseCatalogFilters({ fecha: 'fin-de-semana' }, ['san-salvador']).fecha).toBe('fin-de-semana');
  });

  it('no aplica ciudad cuando la ruta ya es una ciudad', () => {
    const scope = resolveCatalogRoute(['san-miguel'], taxonomy);

    expect(scope && filtersForScope({ ...noCatalogFilters, ciudad: 'san-salvador' }, scope).ciudad).toBeNull();
  });
});

describe('filtrado del catálogo', () => {
  it('muestra solo los eventos del tipo, tema o ciudad de la ruta', () => {
    expect(ids('/congresos/')).toEqual(['a', 'b', 'd']);
    expect(ids('/cloud/')).toEqual(['a', 'd']);
    expect(ids('/san-salvador/')).toEqual(['a', 'd']);
    expect(ids('/congresos/cloud/')).toEqual(['a', 'd']);
  });

  it('filtra por precio: gratis solo incluye eventos gratuitos', () => {
    expect(ids('/congresos/', { ...noCatalogFilters, precio: 'gratis' })).toEqual(['a']);
  });

  it('filtra por precio: de pago excluye eventos sin entradas activas', () => {
    expect(ids('/congresos/', { ...noCatalogFilters, precio: 'pago' })).toEqual(['b']);
  });

  it('filtra por modalidad', () => {
    expect(ids('/congresos/', { ...noCatalogFilters, modalidad: 'virtual' })).toEqual(['b']);
  });

  it('filtra por ciudad y deja fuera los eventos en línea', () => {
    expect(ids('/congresos/', { ...noCatalogFilters, ciudad: 'san-salvador' })).toEqual(['a', 'd']);
  });

  it('filtra por fecha en ventana de 7 o 30 días', () => {
    expect(ids('/cloud/', { ...noCatalogFilters, fecha: 'semana' })).toEqual(['a', 'd']);
    expect(ids('/congresos/', { ...noCatalogFilters, fecha: 'semana' })).toEqual(['a', 'd']);
    expect(ids('/congresos/', { ...noCatalogFilters, fecha: 'mes' })).toEqual(['a', 'b', 'd']);
  });

  it('combina filtros', () => {
    expect(
      ids('/congresos/', { ...noCatalogFilters, precio: 'gratis', ciudad: 'san-salvador', fecha: 'semana' }),
    ).toEqual(['a']);
  });

  it('filtra un catálogo global sin exigir una ruta SEO', () => {
    expect(filterCatalogEventsByFilters(events, { ...noCatalogFilters, modalidad: 'virtual' }, now).map((item) => item.id)).toEqual(['b']);
  });

  it('limita este fin de semana al sábado y domingo próximos en El Salvador', () => {
    const viernes = new Date('2027-03-05T18:00:00Z');
    const weekendEvents = [
      event('sabado', { startsAt: '2027-03-06T16:00:00Z' }),
      event('domingo', { startsAt: '2027-03-07T16:00:00Z' }),
      event('lunes', { startsAt: '2027-03-08T16:00:00Z' }),
      event('pasado', { startsAt: '2027-03-05T16:00:00Z' }),
    ];

    expect(
      filterCatalogEventsByFilters(
        weekendEvents,
        { ...noCatalogFilters, fecha: 'fin-de-semana' },
        viernes,
      ).map((item) => item.id),
    ).toEqual(['sabado', 'domingo']);
  });
});

describe('rutas de modalidad y precio del árbol', () => {
  it('filtra por modalidad dentro de tipo y tema', () => {
    expect(ids('/congresos/cloud/presencial/')).toEqual(['a', 'd']);
    expect(ids('/congresos/cloud/virtual/')).toEqual([]);
  });

  it('filtra por precio gratuito con la ruta /gratis/', () => {
    expect(ids('/congresos/cloud/gratis/')).toEqual(['a']);
  });
});
