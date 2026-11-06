import { describe, expect, it } from 'vitest';

import { chooseHomeEvents, maxFeaturedEvents } from '../../src/features/catalog/home';
import type { CatalogEvent } from '../../src/features/catalog/types';

function event(id: string, free = false): CatalogEvent {
  return {
    id,
    slug: id,
    title: id,
    startsAt: '2027-09-01T18:00:00Z',
    mode: 'virtual',
    venue: null,
    imagePath: null,
    eventType: { slug: 'congresos', name: 'Congresos' },
    topic: null,
    location: null,
    organizer: null,
    ticketTypes: [{ priceCents: free ? 0 : 1000, isActive: true }],
  };
}

const upcoming = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id, index) => event(id, index % 2 === 0));

describe('chooseHomeEvents', () => {
  it('usa los destacados marcados por el administrador, en su orden', () => {
    const selection = chooseHomeEvents({ featured: [event('z'), event('y')], upcoming });

    expect(selection.featured.map((item) => item.id)).toEqual(['z', 'y']);
  });

  it('sin destacados, la portada usa los próximos eventos', () => {
    const selection = chooseHomeEvents({ featured: [], upcoming });

    expect(selection.featured.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('nunca muestra más de cuatro destacados', () => {
    const selection = chooseHomeEvents({ featured: ['1', '2', '3', '4', '5'].map((id) => event(id)), upcoming });

    expect(maxFeaturedEvents).toBe(4);
    expect(selection.featured).toHaveLength(4);
  });

  it('los próximos excluyen los destacados', () => {
    const selection = chooseHomeEvents({ featured: [upcoming[0], upcoming[1]], upcoming });

    expect(selection.upcoming.map((item) => item.id)).not.toContain('a');
    expect(selection.upcoming.map((item) => item.id)).not.toContain('b');
  });

  it('los gratuitos no repiten eventos que ya aparecen arriba', () => {
    const selection = chooseHomeEvents({ featured: [], upcoming });
    const shown = new Set([...selection.featured, ...selection.upcoming].map((item) => item.id));

    for (const item of selection.free) {
      expect(shown.has(item.id)).toBe(false);
      expect(item.ticketTypes.every((ticket) => ticket.priceCents === 0)).toBe(true);
    }
  });
});
