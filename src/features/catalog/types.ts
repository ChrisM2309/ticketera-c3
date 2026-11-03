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
  location: { name: string } | null;
  organizer: { name: string } | null;
  ticketTypes: CatalogTicketType[];
};

export type CatalogCategory = {
  slug: string;
  name: string;
};
