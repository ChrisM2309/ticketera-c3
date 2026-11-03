import { createPublicClient } from '@/lib/supabase/public';

import { isFree } from './format';
import type { CatalogCategory, CatalogEvent, EventMode } from './types';

/** Forma que devuelve PostgREST con las relaciones de events (hints por nombre de FK). */
type EventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  mode: EventMode;
  venue: string | null;
  event_type: { slug: string; name: string } | null;
  topic: { slug: string } | null;
  location: { name: string } | null;
  organizer: { name: string } | null;
  ticket_types: { price_cents: number; is_active: boolean }[];
};

const eventSelect = `
  id, slug, title, starts_at, mode, venue,
  event_type:categories!events_event_type_fk(slug, name),
  topic:categories!events_topic_fk(slug),
  location:categories!events_location_fk(name),
  organizer:organizers(name),
  ticket_types(price_cents, is_active)
`;

export type HomeCatalog =
  | {
      status: 'ok';
      featured: CatalogEvent | null;
      upcoming: CatalogEvent[];
      free: CatalogEvent[];
      categories: CatalogCategory[];
    }
  | { status: 'unavailable' };

function mapEvent(row: EventRow): CatalogEvent | null {
  if (!row.event_type) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    startsAt: row.starts_at,
    mode: row.mode,
    venue: row.venue,
    eventType: row.event_type,
    topic: row.topic,
    location: row.location,
    organizer: row.organizer,
    ticketTypes: row.ticket_types.map((ticket) => ({
      priceCents: ticket.price_cents,
      isActive: ticket.is_active,
    })),
  };
}

/** Datos del Home: solo eventos publicados y próximos, y las 12 categorías en orden del Excel. */
export async function getHomeCatalog(now: Date = new Date()): Promise<HomeCatalog> {
  const client = createPublicClient();

  if (!client) {
    return { status: 'unavailable' };
  }

  const [eventsResult, categoriesResult] = await Promise.all([
    client
      .from('events')
      .select(eventSelect)
      .eq('status', 'published')
      .gte('starts_at', now.toISOString())
      .order('starts_at', { ascending: true })
      .limit(30),
    client
      .from('categories')
      .select('slug, name')
      .eq('kind', 'event_type')
      .order('sort_order', { ascending: true }),
  ]);

  if (eventsResult.error || categoriesResult.error) {
    return { status: 'unavailable' };
  }

  const events = ((eventsResult.data ?? []) as unknown as EventRow[])
    .map(mapEvent)
    .filter((event): event is CatalogEvent => event !== null);

  return {
    status: 'ok',
    featured: events[0] ?? null,
    upcoming: events.slice(1, 7),
    free: events.filter((event) => isFree(event.ticketTypes)).slice(0, 3),
    categories: (categoriesResult.data ?? []) as CatalogCategory[],
  };
}
