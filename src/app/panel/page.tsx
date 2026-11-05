import type { Metadata } from 'next';

import { signOutAction } from '@/features/auth/actions';
import { eventStatusLabel, formatEventStart } from '@/features/organizers/panel';
import { ticketsIssuedText } from '@/features/organizers/review';
import { requireRole } from '@/lib/auth/require-role';
import { organizerHomePath } from '@/lib/auth/access';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Panel del organizador DEMO',
  robots: { index: false, follow: false },
};

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

  return (
    <section aria-labelledby="panel-title" className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="panel-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
            Panel del organizador
          </h1>
          <p className="font-texto text-base leading-7 text-texto-suave">
            Modo DEMO. Aquí ves tus organizadores y el estado de sus eventos.
          </p>
          <Link href="/panel/eventos/nuevo/" className={cn(buttonVariants({ variant: 'compra' }), 'w-full sm:w-auto')}>
            Publicar evento
          </Link>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
            Cerrar sesión
          </button>
        </form>
      </header>

      {organizers.length === 0 ? (
        <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
          Tu cuenta todavía no está asociada a un organizador. Pedí a la administración que la vincule.
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
                    <li key={event.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-texto text-base font-medium text-texto">{event.title}</span>
                      <span className="font-texto text-sm text-texto-suave">
                        {formatEventStart(event.starts_at)} · {eventStatusLabel(event.status)} ·{' '}
                        {ticketsIssuedText(ticketsByEvent.get(event.id) ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </section>
  );
}
