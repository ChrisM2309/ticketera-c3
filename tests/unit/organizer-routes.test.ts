import { describe, expect, it } from 'vitest';

import { isOrganizerSlugAllowed, reservedRootSlugs } from '@/features/catalog/organizers';

describe('rutas de organizadores', () => {
  it('permite copa y reserva blog', () => {
    expect(isOrganizerSlugAllowed('copa', ['congresos', 'cloud'])).toBe(true);
    expect(isOrganizerSlugAllowed('blog', ['congresos', 'cloud'])).toBe(false);
    expect(reservedRootSlugs).toContain('admin');
  });

  it('no permite slugs de categorías', () => {
    expect(isOrganizerSlugAllowed('congresos', ['congresos', 'cloud'])).toBe(false);
  });

  it('la taxonomía se puede evaluar antes que el organizador', () => {
    expect(isOrganizerSlugAllowed('copa', ['copa'])).toBe(false);
  });
});
