import { cache } from 'react';

import { createPublicClient } from '@/lib/supabase/public';
import { getHomeFeaturedIds } from '@/features/featured/queries';

import type { CartEvent } from '../checkout/cart';
import { chooseHomeEvents } from './home';
import type {
  CatalogCategory,
  CatalogEvent,
  CatalogEventDetail,
  CatalogRoute,
  CatalogRouteKind,
  CatalogTaxonomy,
  EventMode,
  EventStatus,
  Speaker,
} from './types';

type RouteRow = { path: string; kind: CatalogRouteKind; is_indexable: boolean };

/** Forma que devuelve PostgREST con las relaciones de events (hints por nombre de FK). */
type EventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  mode: EventMode;
  venue: string | null;
  image_path: string | null;
  event_type: { slug: string; name: string } | null;
  topic: { slug: string } | null;
  location: { slug: string; name: string } | null;
  organizer: { name: string } | null;
  speakers: Speaker[] | null;
  ticket_types: { price_cents: number; is_active: boolean }[];
};

type EventDetailRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  agenda: string | null;
  starts_at: string;
  ends_at: string | null;
  event_type_id: string;
  mode: EventMode;
  venue: string | null;
  image_path: string | null;
  status: EventStatus;
  event_type: { slug: string; name: string } | null;
  topic: { slug: string; name: string } | null;
  location: { slug: string; name: string } | null;
  organizer: { name: string } | null;
  speakers: Speaker[] | null;
  ticket_types: {
    id: string;
    name: string;
    price_cents: number;
    quantity_total: number;
    quantity_sold: number;
    max_per_order: number;
    is_active: boolean;
  }[];
};

type CartEventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  mode: EventMode;
  venue: string | null;
  event_type: { slug: string; name: string } | null;
  topic: { slug: string; name: string } | null;
  ticket_types: {
    id: string;
    name: string;
    price_cents: number;
    quantity_total: number;
    quantity_sold: number;
    max_per_order: number;
    is_active: boolean;
  }[];
};

const eventSelect = `
  id, slug, title, starts_at, mode, venue, image_path,
  event_type:categories!events_event_type_fk(slug, name),
  topic:categories!events_topic_fk(slug),
  location:categories!events_location_fk(slug, name),
  organizer:organizers(name),
  speakers,
  ticket_types(price_cents, is_active)
`;

const eventDetailSelect = `
  id, slug, title, description, agenda, starts_at, ends_at, event_type_id, mode, venue, image_path, status,
  event_type:categories!events_event_type_fk(slug, name),
  topic:categories!events_topic_fk(slug, name),
  location:categories!events_location_fk(slug, name),
  organizer:organizers(name),
  speakers,
  ticket_types(id, name, price_cents, quantity_total, quantity_sold, max_per_order, is_active)
`;

const cartEventSelect = `
  id, slug, title, starts_at, mode, venue,
  event_type:categories!events_event_type_fk(slug, name),
  topic:categories!events_topic_fk(slug, name),
  ticket_types(id, name, price_cents, quantity_total, quantity_sold, max_per_order, is_active)
`;

/** Límite de eventos que lee el catálogo. El filtrado se hace en memoria (D-22). */
export const CATALOG_EVENT_LIMIT = 200;

export type HomeCatalog =
  | {
      status: 'ok';
      featured: CatalogEvent[];
      upcoming: CatalogEvent[];
      free: CatalogEvent[];
      categories: CatalogCategory[];
    }
  | { status: 'unavailable' };

export type CatalogListing =
  | { status: 'ok'; events: CatalogEvent[]; taxonomy: CatalogTaxonomy; truncated: boolean }
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
    imagePath: row.image_path,
    eventType: row.event_type,
    topic: row.topic,
    location: row.location,
    organizer: row.organizer,
    speakers: row.speakers ?? [],
    ticketTypes: row.ticket_types.map((ticket) => ({
      priceCents: ticket.price_cents,
      isActive: ticket.is_active,
    })),
  };
}

function mapEventDetail(row: EventDetailRow): CatalogEventDetail | null {
  if (!row.event_type) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    agenda: row.agenda,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    mode: row.mode,
    venue: row.venue,
    imagePath: row.image_path,
    status: row.status,
    eventType: row.event_type,
    topic: row.topic,
    location: row.location,
    organizer: row.organizer,
    speakers: row.speakers ?? [],
    ticketTypes: row.ticket_types.map((ticket) => ({
      id: ticket.id,
      name: ticket.name,
      priceCents: ticket.price_cents,
      quantityTotal: ticket.quantity_total,
      quantitySold: ticket.quantity_sold,
      maxPerOrder: ticket.max_per_order,
      isActive: ticket.is_active,
    })),
  };
}

function mapCartEvent(row: CartEventRow): CartEvent | null {
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
    ticketTypes: row.ticket_types.map((ticket) => ({
      id: ticket.id,
      name: ticket.name,
      priceCents: ticket.price_cents,
      quantityTotal: ticket.quantity_total,
      quantitySold: ticket.quantity_sold,
      maxPerOrder: ticket.max_per_order,
      isActive: ticket.is_active,
    })),
  };
}

/** Datos del Home: destacados marcados por el administrador, próximos, gratuitos y las 12 categorías. */
export async function getHomeCatalog(now: Date = new Date()): Promise<HomeCatalog> {
  const client = createPublicClient();

  if (!client) {
    return { status: 'unavailable' };
  }

  const [eventsResult, featuredIds, categoriesResult] = await Promise.all([
    client
      .from('events')
      .select(eventSelect)
      .eq('status', 'published')
      .gte('starts_at', now.toISOString())
      .order('starts_at', { ascending: true })
      .limit(30),
    getHomeFeaturedIds(),
    client
      .from('categories')
      .select('id, slug, name')
      .eq('kind', 'event_type')
      .order('sort_order', { ascending: true }),
  ]);

  if (eventsResult.error || categoriesResult.error) {
    return { status: 'unavailable' };
  }

  const upcomingAll = ((eventsResult.data ?? []) as unknown as EventRow[])
    .map(mapEvent)
    .filter((event): event is CatalogEvent => event !== null);

  // Los destacados pueden caer fuera de los próximos 30; se piden aparte, solo si están publicados.
  // Si la tabla de destacados aún no existe en el proyecto, la portada sigue con los próximos eventos.
  let featuredEvents: CatalogEvent[] = [];

  if (featuredIds.length > 0) {
    const featuredRows = await client.from('events').select(eventSelect).eq('status', 'published').in('id', featuredIds);

    if (featuredRows.error) {
      return { status: 'unavailable' };
    }

    const byId = new Map(
      ((featuredRows.data ?? []) as unknown as EventRow[])
        .map(mapEvent)
        .filter((event): event is CatalogEvent => event !== null)
        .map((event) => [event.id, event]),
    );
    featuredEvents = featuredIds.map((id) => byId.get(id)).filter((event): event is CatalogEvent => event !== undefined);
  }

  const selection = chooseHomeEvents({ featured: featuredEvents, upcoming: upcomingAll });

  return {
    status: 'ok',
    featured: selection.featured,
    upcoming: selection.upcoming,
    free: selection.free,
    categories: (categoriesResult.data ?? []) as CatalogCategory[],
  };
}

/**
 * Eventos publicados y próximos, con la taxonomía de tipos, temas y ciudades.
 * `cache` de React evita repetir la consulta entre generateMetadata y la página.
 */
export const getCatalogListing = cache(async (): Promise<CatalogListing> => {
  const client = createPublicClient();

  if (!client) {
    return { status: 'unavailable' };
  }

  const [eventsResult, categoriesResult, routesResult] = await Promise.all([
    client
      .from('events')
      .select(eventSelect)
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(CATALOG_EVENT_LIMIT),
    client
      .from('categories')
      .select('id, slug, name, kind')
      .in('kind', ['event_type', 'topic', 'location'])
      .order('sort_order', { ascending: true }),
    client
      .from('seo_routes')
      .select('path, kind, is_indexable')
      .order('sort_order', { ascending: true }),
  ]);

  if (eventsResult.error || categoriesResult.error || routesResult.error) {
    return { status: 'unavailable' };
  }

  const categories = (categoriesResult.data ?? []) as (CatalogCategory & { kind: string })[];
  const byKind = (kind: string): CatalogCategory[] =>
    categories
      .filter((category) => category.kind === kind)
      .map(({ id, slug, name }) => ({ id, slug, name }));
  const routes: CatalogRoute[] = ((routesResult.data ?? []) as RouteRow[]).map((row) => ({
    path: row.path,
    kind: row.kind,
    isIndexable: row.is_indexable,
  }));

  const rows = (eventsResult.data ?? []) as unknown as EventRow[];
  const events = rows
    .map(mapEvent)
    .filter((event): event is CatalogEvent => event !== null);

  return {
    status: 'ok',
    events,
    truncated: rows.length >= CATALOG_EVENT_LIMIT,
    taxonomy: {
      eventTypes: byKind('event_type'),
      topics: byKind('topic'),
      locations: byKind('location'),
      routes,
    },
  };
});

export type EventDetailResult =
  | { status: 'ok'; event: CatalogEventDetail; related: CatalogEvent[] }
  | { status: 'not_found' }
  | { status: 'unavailable' };

export type CartEventResult =
  | { status: 'ok'; event: CartEvent }
  | { status: 'not_found' }
  | { status: 'unavailable' };

/** Lee los datos frescos que necesita el carrito; T09 volverá a validarlos al crear la orden. */
export const getCartEvent = cache(async (eventId: string): Promise<CartEventResult> => {
  const client = createPublicClient();

  if (!client) {
    return { status: 'unavailable' };
  }

  const result = await client
    .from('events')
    .select(cartEventSelect)
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle();

  if (result.error) {
    return { status: 'unavailable' };
  }

  if (!result.data) {
    return { status: 'not_found' };
  }

  const event = mapCartEvent(result.data as unknown as CartEventRow);

  return event ? { status: 'ok', event } : { status: 'not_found' };
});

/** Lee una ficha publicada, incluyendo eventos pasados para mostrar su estado final. */
export const getEventDetail = cache(async (slug: string): Promise<EventDetailResult> => {
  const client = createPublicClient();

  if (!client) {
    return { status: 'unavailable' };
  }

  const eventResult = await client
    .from('events')
    .select(eventDetailSelect)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (eventResult.error) {
    return { status: 'unavailable' };
  }

  if (!eventResult.data) {
    return { status: 'not_found' };
  }

  const eventRow = eventResult.data as unknown as EventDetailRow;
  const event = mapEventDetail(eventRow);

  if (!event) {
    return { status: 'not_found' };
  }

  const relatedResult = await client
    .from('events')
    .select(eventSelect)
    .eq('status', 'published')
    .eq('event_type_id', eventRow.event_type_id)
    .neq('id', event.id)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(3);

  const related = relatedResult.error
    ? []
    : ((relatedResult.data ?? []) as unknown as EventRow[])
        .map(mapEvent)
        .filter((item): item is CatalogEvent => item !== null);

  return { status: 'ok', event, related };
});
