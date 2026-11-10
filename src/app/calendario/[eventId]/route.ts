import { eventPath } from '@/features/catalog/paths';
import { buildEventIcs } from '@/features/ticketing/calendar';
import { createPublicClient } from '@/lib/supabase/public';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ eventId: string }> };

type CalendarEventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  mode: 'presencial' | 'virtual';
  venue: string | null;
  event_type: { slug: string } | null;
  topic: { slug: string } | null;
  location: { name: string } | null;
};

function plain(status: number, body: string) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/**
 * GET /calendario/[eventId]/: descarga el .ics de un evento publicado.
 * Los Route Handlers GET no se cachean por defecto en esta versión de Next; la respuesta es pública
 * (datos que ya muestra la ficha), así que el CDN la guarda poco tiempo y el navegador siempre revalida.
 * Los 404 no se cachean para que un evento recién publicado aparezca de inmediato.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { eventId } = await params;

  if (!uuidPattern.test(eventId)) {
    return plain(404, 'No encontrado.');
  }

  const client = createPublicClient();

  if (!client) {
    return plain(503, 'Servicio no disponible.');
  }

  const result = await client
    .from('events')
    .select(
      `id, slug, title, starts_at, ends_at, mode, venue,
       event_type:categories!events_event_type_fk(slug),
       topic:categories!events_topic_fk(slug),
       location:categories!events_location_fk(name)`,
    )
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle();

  if (result.error) {
    return plain(503, 'Servicio no disponible.');
  }

  const row = result.data as unknown as CalendarEventRow | null;

  if (!row || !row.event_type) {
    return plain(404, 'No encontrado.');
  }

  const startsAt = new Date(row.starts_at);
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;

  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    return plain(404, 'No encontrado.');
  }

  const place =
    row.mode === 'virtual'
      ? 'En línea'
      : [row.venue, row.location?.name].filter((part): part is string => Boolean(part)).join(', ') || null;

  const ics = buildEventIcs({
    id: row.id,
    title: row.title,
    startsAt,
    endsAt,
    location: place,
    url: new URL(
      eventPath({ slug: row.slug, eventTypeSlug: row.event_type.slug, topicSlug: row.topic?.slug ?? null }),
      siteConfig.siteUrl,
    ).toString(),
  });

  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="evento.ics"',
      'cache-control': 'public, max-age=0, s-maxage=300, must-revalidate',
    },
  });
}
