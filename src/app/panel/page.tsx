import type { Metadata } from 'next';

import { formatUsd } from '@/features/catalog/format';
import { eventStatusLabel, formatEventStart } from '@/features/organizers/panel';
import { ticketsIssuedText } from '@/features/organizers/review';
import { requireRole } from '@/lib/auth/require-role';
import { organizerHomePath } from '@/lib/auth/access';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { statusIcon } from '@/features/catalog/icons';
import { cn } from '@/lib/utils';
import { ArchiveEventForm } from '@/components/organizers/archive-event-form';

export const metadata: Metadata = {
  title: 'Panel del organizador DEMO',
  robots: { index: false, follow: false },
};

/** Icono del estado de un evento; un estado desconocido usa el icono informativo. Siempre va junto al texto. */
function eventStatusIcon(status: string): IconName {
  return Object.hasOwn(statusIcon, status) ? statusIcon[status as keyof typeof statusIcon] : 'info';
}

export default async function PanelPage() {
  // El proxy solo mira cookies; esta comprobación valida la sesión y el rol en el servidor.
  const account = await requireRole('organizer', organizerHomePath);

  // RLS limita las filas: el organizador solo recibe sus organizadores, y solo sus eventos
  // y los publicados de esos organizadores.
  const organizersResult = await account.client
    .from('organizers')
    .select('id, name')
    .eq('owner_user_id', account.userId)
    .order('name');

  if (organizersResult.error) {
    throw new Error('No pudimos cargar tus organizadores.');
  }

  const organizers = organizersResult.data ?? [];
  const organizerIds = organizers.map((organizer) => organizer.id);

  const eventsResult =
    organizerIds.length > 0
      ? await account.client
          .from('events')
          .select('id, title, status, starts_at, organizer_id')
          .in('organizer_id', organizerIds)
          .order('starts_at')
      : null;

  if (eventsResult?.error) {
    throw new Error('No pudimos cargar tus eventos.');
  }

  const events = eventsResult?.data ?? [];

  // Boletos emitidos por evento: la función solo devuelve filas de eventos del propio organizador.
  const countsResult = organizerIds.length > 0 ? await account.client.rpc('organizer_event_ticket_counts') : null;

  if (countsResult?.error) {
    throw new Error('No pudimos cargar los registros de tus eventos.');
  }

  const ticketsByEvent = new Map<string, number>(
    ((countsResult?.data ?? []) as { event_id: string; tickets_issued: number | string }[]).map((row) => [
      row.event_id,
      Number(row.tickets_issued),
    ]),
  );

  const featuredResult = await account.client
    .from('featured_placements')
    .select('id, status, days, total_cents, starts_on, ends_on, event:events(title)')
    .order('created_at', { ascending: false });

  if (featuredResult.error) {
    throw new Error('No pudimos cargar tus destacados.');
  }

  const featured = (featuredResult.data ?? []) as unknown as {
    id: string;
    status: string;
    days: number;
    total_cents: number;
    starts_on: string;
    ends_on: string;
    event: { title: string } | null;
  }[];

  return (
    <section aria-labelledby="panel-title" className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="panel-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
            Panel del organizador
          </h1>
          <p className="font-texto text-base leading-7 text-texto-suave">
            Modo DEMO. Aquí ves tus organizadores y el estado de sus eventos.
          </p>
        </div>
        <Link href="/panel/eventos/nuevo/" className={cn(buttonVariants({ variant: 'compra' }), 'w-full sm:w-auto')}>
          <Icon name="calendarPlus" />
          Publicar evento
        </Link>
      </header>

      {organizers.length === 0 ? (
        <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
          Tu cuenta todavía no está asociada a un organizador. Pide a la administración que la vincule.
        </p>
      ) : (
        organizers.map((organizer) => {
          const organizerEvents = events.filter((event) => event.organizer_id === organizer.id);

          return (
            <section key={organizer.id} aria-labelledby={`organizador-${organizer.id}`} className="flex flex-col gap-4">
              <h2 id={`organizador-${organizer.id}`} className="font-titulo text-xl font-bold">
                {organizer.name}
              </h2>

              {organizerEvents.length === 0 ? (
                <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
                  Todavía no hay eventos para este organizador.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
                  {organizerEvents.map((event) => (
                  <li key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-texto text-base font-medium text-texto">{event.title}</span>
                      {event.status === 'published' ? (
                        <div className="flex flex-wrap gap-4">
                          <Link href={`/panel/eventos/${event.id}/checkin/`} className="font-texto text-sm font-semibold text-accion underline">
                            Check-in
                          </Link>
                          <Link href={`/panel/eventos/${event.id}/reporte/`} className="font-texto text-sm font-semibold text-accion underline">
                            Reporte
                          </Link>
                        </div>
                      ) : null}
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-texto text-sm text-texto-suave">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="calendar" size={16} />
                          {formatEventStart(event.starts_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-pill bg-superficie-sutil px-2.5 py-1 font-medium text-texto">
                          <Icon name={eventStatusIcon(event.status)} size={16} />
                          {eventStatusLabel(event.status)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="ticket" size={16} />
                          {ticketsIssuedText(ticketsByEvent.get(event.id) ?? 0)}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.status !== 'archived' ? (
                        <>
                          <Link href={`/panel/eventos/${event.id}/editar/`} className={buttonVariants({ variant: 'secundario' })}>
                            Editar
                          </Link>
                          <ArchiveEventForm eventId={event.id} title={event.title} />
                        </>
                      ) : <span className="font-texto text-sm text-texto-suave">Archivado</span>}
                      {event.status === 'published' ? (
                        <Link href={`/panel/destacar/${event.id}/`} className={buttonVariants({ variant: 'secundario' })}>
                          Destacar
                        </Link>
                      ) : null}
                    </div>
                  </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      <section aria-labelledby="featured-title" className="flex flex-col gap-4">
        <h2 id="featured-title" className="font-titulo text-xl font-bold">Mis destacados</h2>
        {featured.length === 0 ? (
          <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">Todavía no has solicitado destacados.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
            {featured.map((placement) => (
              <li key={placement.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-texto text-base font-medium text-texto">{placement.event?.title ?? 'Evento'}</span>
                <span className="font-texto text-sm text-texto-suave">{placement.status} · {placement.days} días · {placement.starts_on} – {placement.ends_on} · Total simulado {formatUsd(placement.total_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
