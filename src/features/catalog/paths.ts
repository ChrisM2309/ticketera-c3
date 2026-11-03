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
