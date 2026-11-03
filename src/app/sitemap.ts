import type { MetadataRoute } from 'next';

import { getCatalogListing } from '@/features/catalog/queries';
import { indexableCatalogPaths } from '@/lib/seo/indexing';
import { siteConfig } from '@/lib/site-config';

/** Se regenera cada minuto, igual que las páginas del catálogo. */
export const revalidate = 60;

/** Sitemap del catálogo indexable. En el sitio demo queda vacío (D-25). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (siteConfig.isDemo) {
    return [];
  }

  const listing = await getCatalogListing();
  const paths =
    listing.status === 'ok'
      ? ['/', ...indexableCatalogPaths(listing.taxonomy, listing.events, new Date())]
      : ['/'];

  return paths.map((path) => ({ url: new URL(path, siteConfig.siteUrl).toString() }));
}
