export type EventMode = 'presencial' | 'virtual';

export type EventStatus = 'draft' | 'pending' | 'published' | 'archived' | 'rejected';

/** Ponente de un evento (events.speakers). El rol puede ser una cadena vacía. */
export type Speaker = { name: string; role: string };

export type CatalogTicketType = {
  priceCents: number;
  isActive: boolean;
};

export type CatalogEventTicket = CatalogTicketType & {
  id: string;
  name: string;
  quantityTotal: number;
  quantitySold: number;
  maxPerOrder: number;
};

export type CatalogEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  mode: EventMode;
  venue: string | null;
  imagePath: string | null;
  eventType: { slug: string; name: string };
  topic: { slug: string } | null;
  location: { slug: string; name: string } | null;
  organizer: { name: string } | null;
  speakers: Speaker[];
  ticketTypes: CatalogTicketType[];
};

export type CatalogEventDetail = Omit<CatalogEvent, 'ticketTypes' | 'topic'> & {
  description: string;
  agenda: string | null;
  endsAt: string | null;
  imagePath: string | null;
  status: EventStatus;
  topic: { slug: string; name: string } | null;
  ticketTypes: CatalogEventTicket[];
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
