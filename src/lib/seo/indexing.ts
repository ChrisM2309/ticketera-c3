import type { MetadataRoute } from 'next';

import { filterCatalogEvents, noCatalogFilters } from '../../features/catalog/filters';
import { resolveCatalogRoute } from '../../features/catalog/routes';
import type { CatalogEvent, CatalogTaxonomy } from '../../features/catalog/types';

/**
 * Rutas privadas o transaccionales: no se rastrean (SEO_ROUTES.md, sección 5).
 * Solo se listan rutas que existen; `/mis-boletos/` y `/cuenta/` las crea la Fase 3.
 */
export const privatePaths = [
  '/admin/',
  '/api/',
  '/buscar/',
  '/calendario/',
  '/carrito/',
  '/checkout/',
  '/confirmacion/',
  '/cuenta/',
  '/ingresar/',
  '/mis-boletos/',
  '/panel/',
  '/recuperar/',
  '/registro/',
];

/**
 * Rutas del catálogo que pueden indexarse: están en el árbol, están marcadas como indexables
 * y tienen al menos un evento próximo publicado. Las vacías y las de modalidad quedan fuera (D-24, D-25).
 */
export function indexableCatalogPaths(
  taxonomy: CatalogTaxonomy,
  events: readonly CatalogEvent[],
  now: Date,
): string[] {
  return taxonomy.routes
    .filter((route) => route.isIndexable)
    .filter((route) => {
      const scope = resolveCatalogRoute(route.path.split('/').filter(Boolean), taxonomy);

      return scope !== null && filterCatalogEvents(events, scope, noCatalogFilters, now).length > 0;
    })
    .map((route) => route.path);
}

/** El interruptor de administración gobierna el rastreo; la etiqueta DEMO no cambia esta política. */
export function buildRobots(options: { indexingEnabled: boolean; siteUrl: string }): MetadataRoute.Robots {
  if (!options.indexingEnabled) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/', disallow: privatePaths },
    sitemap: new URL('/sitemap.xml', options.siteUrl).toString(),
  };
}

export function robotsMetadata(options: { indexingEnabled: boolean; pageIndexable: boolean }): { index: boolean; follow: boolean } {
  const index = options.indexingEnabled && options.pageIndexable;
  return { index, follow: index };
}
