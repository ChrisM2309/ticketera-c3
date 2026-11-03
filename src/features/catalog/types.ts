export type EventMode = 'presencial' | 'virtual';

export type CatalogTicketType = {
  priceCents: number;
  isActive: boolean;
};

export type CatalogEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  mode: EventMode;
  venue: string | null;
  eventType: { slug: string; name: string };
  topic: { slug: string } | null;
  location: { slug: string; name: string } | null;
  organizer: { name: string } | null;
  ticketTypes: CatalogTicketType[];
};

export type CatalogCategory = {
  slug: string;
  name: string;
};

export type CatalogRouteKind = 'event_type' | 'topic' | 'location' | 'subtopic' | 'modality';

/** Ruta del árbol del Excel, tabla seo_routes (SEO_ROUTES.md y D-24). */
export type CatalogRoute = {
  path: string;
  kind: CatalogRouteKind;
  isIndexable: boolean;
};

/** Taxonomía pública que usan las rutas y los filtros (SEO_ROUTES.md, secciones 1 a 3). */
export type CatalogTaxonomy = {
  eventTypes: CatalogCategory[];
  topics: CatalogCategory[];
  locations: CatalogCategory[];
  routes: CatalogRoute[];
};
