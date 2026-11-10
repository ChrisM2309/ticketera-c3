import type { MetadataRoute } from 'next';

import { buildRobots } from '@/lib/seo/indexing';
import { getSiteSettings } from '@/features/settings/settings';
import { siteConfig } from '@/lib/site-config';

/**
 * Sin esta línea, Next prerenderiza robots.txt en el build y congela el valor del interruptor
 * de indexación (Search Console veía «bloqueada por robots.txt» aunque el ajuste estuviera activo).
 * Igual que el sitemap, se regenera cada minuto.
 */
export const revalidate = 60;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return buildRobots({ indexingEnabled: settings.indexingEnabled, siteUrl: siteConfig.siteUrl });
}
