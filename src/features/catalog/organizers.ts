import { createPublicClient } from '@/lib/supabase/public';

import type { CatalogEvent } from './types';

export const reservedRootSlugs = [
  'admin', 'api', 'blog', 'buscar', 'calendario', 'carrito', 'checkout', 'confirmacion', 'cuenta',
  'ingresar', 'mis-boletos', 'panel', 'para-empresas', 'privacidad', 'recuperar', 'registro', 'terminos',
] as const;

type OrganizerEventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  mode: 'presencial' | 'virtual';
  venue: string | null;
  image_path: string | null;
  event_type: { slug: string; name: string } | null;
  topic: { slug: string } | null;
  location: { slug: string; name: string } | null;
  speakers: CatalogEvent['speakers'] | null;
  ticket_types: { price_cents: number; is_active: boolean }[];
};

export type OrganizerPageData = {
  slug: string;
  name: string;
  description: string;
  events: CatalogEvent[];
};

export function isOrganizerSlugAllowed(slug: string, taxonomySlugs: readonly string[]): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    && !reservedRootSlugs.includes(slug as (typeof reservedRootSlugs)[number])
    && !taxonomySlugs.includes(slug);
}

function mapEvent(row: OrganizerEventRow, organizerName: string): CatalogEvent | null {
  if (!row.event_type) return null;

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
    organizer: { name: organizerName },
    speakers: row.speakers ?? [],
    ticketTypes: row.ticket_types.map((ticket) => ({ priceCents: ticket.price_cents, isActive: ticket.is_active })),
  };
}

const eventSelect = `
  id, slug, title, starts_at, mode, venue, image_path,
  event_type:categories!events_event_type_fk(slug, name),
  topic:categories!events_topic_fk(slug),
  location:categories!events_location_fk(slug, name),
  speakers, ticket_types(price_cents, is_active)
`;

export async function getOrganizerPage(slug: string): Promise<OrganizerPageData | null> {
  const client = createPublicClient();
  if (!client) return null;

  const organizerResult = await client.from('organizers').select('id, name, description').eq('slug', slug).eq('status', 'active').maybeSingle();
  if (organizerResult.error || !organizerResult.data) return null;
  const organizer = organizerResult.data;

  const eventsResult = await client
    .from('events')
    .select(eventSelect)
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  const events = eventsResult.error
    ? []
    : ((eventsResult.data ?? []) as unknown as OrganizerEventRow[])
      .map((event) => mapEvent(event, organizer.name))
      .filter((event): event is CatalogEvent => event !== null);

  return {
    slug,
    name: organizer.name,
    description: organizer.description ?? 'Organizador DEMO de eventos tecnológicos.',
    events,
  };
}

export async function listPublicOrganizerPaths(now = new Date()): Promise<string[]> {
  const client = createPublicClient();
  if (!client) return [];

  const result = await client
    .from('organizers')
    .select('slug, events!inner(starts_at, status)')
    .eq('status', 'active')
    .eq('events.status', 'published')
    .gte('events.starts_at', now.toISOString());

  if (result.error) return [];
  return [...new Set((result.data ?? []).map((organizer) => `/${organizer.slug}/`))];
}
