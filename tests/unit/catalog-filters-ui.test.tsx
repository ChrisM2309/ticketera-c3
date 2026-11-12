import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { CatalogFilters } from '../../src/components/catalog/catalog-filters';
import { noCatalogFilters } from '../../src/features/catalog/filters';

describe('filtros de catálogo', () => {
  test('se muestran plegados al inicio y mantienen los controles GET accesibles', () => {
    const html = renderToStaticMarkup(createElement(CatalogFilters, {
      filters: noCatalogFilters,
      locations: [],
      topics: [],
      showCiudad: true,
      clearHref: '/buscar/',
    }));

    expect(html).toContain('<details');
    expect(html).not.toContain('<details open=""');
    expect(html).toContain('aria-label="Filtrar eventos"');
    expect(html).toContain('name="tema"');
  });

  test('se abren cuando hay filtros activos', () => {
    const html = renderToStaticMarkup(createElement(CatalogFilters, {
      filters: { ...noCatalogFilters, precio: 'gratis' },
      locations: [],
      topics: [],
      showCiudad: true,
      clearHref: '/buscar/',
    }));

    expect(html).toMatch(/<details open=""/);
    expect(html).toContain('Filtros aplicados');
  });
});
