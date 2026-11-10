import { describe, expect, it } from 'vitest';

import type { CatalogEvent } from '../../src/features/catalog/types';
import {
  maxSearchLength,
  normalizeSearchText,
  parseSearchQuery,
  searchCatalogEvents,
} from '../../src/features/catalog/search';

function event(overrides: Partial<CatalogEvent> & Pick<CatalogEvent, 'id' | 'title'>): CatalogEvent {
  return {
    slug: overrides.id,
    startsAt: '2027-09-01T18:00:00Z',
    mode: 'virtual',
    venue: null,
    imagePath: null,
    eventType: { slug: 'congresos', name: 'Congresos' },
    topic: null,
    location: null,
    organizer: null,
    speakers: [],
    ticketTypes: [],
    ...overrides,
  };
}

const events = [
  event({ id: 'ia', title: 'Congreso de Inteligencia Artificial' }),
  event({
    id: 'cloud',
    title: 'Bootcamp de cloud',
    eventType: { slug: 'bootcamps', name: 'Bootcamps' },
    location: { slug: 'san-salvador', name: 'San Salvador' },
    mode: 'presencial',
    venue: 'Centro de convenciones',
    organizer: { name: 'Organizador DEMO' },
  }),
];

describe('normalizeSearchText', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(normalizeSearchText('  Inteligencia Artificial ')).toBe('inteligencia artificial');
    expect(normalizeSearchText('San Salvador')).toBe('san salvador');
    expect(normalizeSearchText('Ciudad Mártir')).toBe('ciudad martir');
  });
});

describe('parseSearchQuery', () => {
  it('colapsa espacios, recorta la longitud y toma el primer valor repetido', () => {
    expect(parseSearchQuery('  cloud   bootcamp ')).toBe('cloud bootcamp');
    expect(parseSearchQuery(['primero', 'segundo'])).toBe('primero');
    expect(parseSearchQuery(undefined)).toBe('');
    expect(parseSearchQuery('x'.repeat(200))).toHaveLength(maxSearchLength);
  });
});

describe('searchCatalogEvents', () => {
  it('devuelve todos los eventos cuando la búsqueda está vacía', () => {
    expect(searchCatalogEvents(events, '')).toEqual(events);
  });

  it('encuentra por título, tipo, ciudad, lugar u organizador, sin distinguir acentos', () => {
    expect(searchCatalogEvents(events, 'inteligencia').map((e) => e.id)).toEqual(['ia']);
    expect(searchCatalogEvents(events, 'SAN SALVADOR').map((e) => e.id)).toEqual(['cloud']);
    expect(searchCatalogEvents(events, 'convenciones').map((e) => e.id)).toEqual(['cloud']);
    expect(searchCatalogEvents(events, 'organizador').map((e) => e.id)).toEqual(['cloud']);
    expect(searchCatalogEvents(events, 'bootcamps').map((e) => e.id)).toEqual(['cloud']);
  });

  it('exige que cada palabra aparezca y devuelve vacío si no hay coincidencias', () => {
    expect(searchCatalogEvents(events, 'cloud san')).toHaveLength(1);
    expect(searchCatalogEvents(events, 'cloud inteligencia')).toEqual([]);
    expect(searchCatalogEvents(events, 'zzz')).toEqual([]);
  });
});
