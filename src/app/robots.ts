import type { MetadataRoute } from 'next';

import { buildRobots } from '@/lib/seo/indexing';
import { siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  return buildRobots({ isDemo: siteConfig.isDemo, siteUrl: siteConfig.siteUrl });
}
