/**
 * Ruta pública de una ficha de evento (SEO_ROUTES.md, sección 4):
 * /[categoria]/[tema]/[evento]/. Sin tema, la ruta usa solo categoría y evento.
 */
export function eventPath(event: {
  slug: string;
  eventTypeSlug: string;
  topicSlug: string | null;
}): string {
  if (event.topicSlug) {
    return `/${event.eventTypeSlug}/${event.topicSlug}/${event.slug}/`;
  }

  return `/${event.eventTypeSlug}/${event.slug}/`;
}

/** Verifica que una URL de catch-all sea exactamente la ruta canónica de una ficha. */
export function eventPathMatches(
  segments: readonly string[],
  event: Pick<CatalogEventForPath, 'slug' | 'eventType' | 'topic'>,
): boolean {
  const expectedSegments = eventPath({
    slug: event.slug,
    eventTypeSlug: event.eventType.slug,
    topicSlug: event.topic?.slug ?? null,
  })
    .split('/')
    .filter(Boolean);

  return expectedSegments.length === segments.length && expectedSegments.every((segment, index) => segment === segments[index]);
}

type CatalogEventForPath = {
  slug: string;
  eventType: { slug: string };
  topic: { slug: string } | null;
};
