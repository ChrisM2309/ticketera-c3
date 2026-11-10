import type { MetadataRoute } from 'next';

import { buildRobots } from '@/lib/seo/indexing';
import { getSiteSettings } from '@/features/settings/settings';
import { siteConfig } from '@/lib/site-config';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return buildRobots({ indexingEnabled: settings.indexingEnabled, siteUrl: siteConfig.siteUrl });
}
