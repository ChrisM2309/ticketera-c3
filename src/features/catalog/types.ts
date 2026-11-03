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

/** Taxonomía pública que usan las rutas y los filtros (SEO_ROUTES.md, secciones 1 y 2). */
export type CatalogTaxonomy = {
  eventTypes: CatalogCategory[];
  topics: CatalogCategory[];
  locations: CatalogCategory[];
};
