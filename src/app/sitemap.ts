import type { MetadataRoute } from 'next';

import { getCatalogListing } from '@/features/catalog/queries';
import { eventPath } from '@/features/catalog/paths';
import { listPublishedPosts } from '@/features/content/queries';
import { listPublicOrganizerPaths } from '@/features/catalog/organizers';
import { getSiteSettings } from '@/features/settings/settings';
import { buildSitemapEntries, indexableCatalogPaths } from '@/lib/seo/indexing';
import { siteConfig } from '@/lib/site-config';

/** Se regenera cada minuto, igual que las páginas del catálogo. */
export const revalidate = 60;

/** Sitemap del catálogo indexable. En el sitio demo queda vacío (D-25). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  if (!settings.indexingEnabled) {
    return [];
  }

  const listing = await getCatalogListing();
  const blog = await listPublishedPosts(1, 1000);
  const now = new Date();
  const catalogPaths = listing.status === 'ok' ? indexableCatalogPaths(listing.taxonomy, listing.events, now) : [];
  const eventPaths = listing.status === 'ok'
    ? listing.events.filter((event) => new Date(event.startsAt) >= now).map((event) => ({
      path: eventPath({ slug: event.slug, eventTypeSlug: event.eventType.slug, topicSlug: event.topic?.slug ?? null }),
      updatedAt: new Date(event.startsAt),
    }))
    : [];

  const blogPaths = blog.posts.map((post) => ({ path: `/blog/${post.slug}/`, updatedAt: new Date(post.publishedAt) }));
  const organizerPaths = await listPublicOrganizerPaths(now);
  return buildSitemapEntries({ indexingEnabled: true, siteUrl: siteConfig.siteUrl, catalogPaths, eventPaths, organizerPaths, blogPaths, now });
}
