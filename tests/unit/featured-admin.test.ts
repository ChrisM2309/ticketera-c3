import { describe, expect, it } from 'vitest';

import { parseFeaturedFilters } from '../../src/features/featured/admin';

describe('parseFeaturedFilters', () => {
  it('acepta solo valores de la lista', () => {
    expect(
      parseFeaturedFilters({ status: 'pending', source: 'paid', page: '2' }),
    ).toEqual({ status: 'pending', source: 'paid', page: 2 });

    expect(
      parseFeaturedFilters({ status: 'secreto', source: 'otro', page: 'no-es-pagina' }),
    ).toEqual({ status: 'all', source: 'all', page: 1 });
  });

  it('la página inválida cae a 1', () => {
    expect(parseFeaturedFilters({ page: '0' }).page).toBe(1);
    expect(parseFeaturedFilters({ page: '-2' }).page).toBe(1);
    expect(parseFeaturedFilters({ page: '2.5' }).page).toBe(1);
    expect(parseFeaturedFilters({ page: ['3', '4'] }).page).toBe(3);
  });
});
