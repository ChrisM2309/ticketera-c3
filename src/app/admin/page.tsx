import type { Metadata } from 'next';

import { formatUsd } from '@/features/catalog/format';
import { signOutAction } from '@/features/auth/actions';
import { formatEventStart, pendingReviewText } from '@/features/organizers/panel';
import { orderStatusLabel, reviewResultMessage } from '@/features/organizers/review';
import { reviewEventAction } from '@/features/organizers/review-actions';
import { setFeaturedAction } from '@/features/organizers/featured-actions';
import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { statusIcon } from '@/features/catalog/icons';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Administración DEMO',
  robots: { index: false, follow: false },
};

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PendingEvent = {
  id: string;
  title: string;
  starts_at: string;
  mode: string;
  organizer: { name: string } | null;
};

type PublishedEvent = {
  id: string;
  title: string;
  starts_at: string;
  organizer: { name: string } | null;
};

type RecentOrder = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  event: { title: string } | null;
};

/** Icono del estado de una orden; un estado desconocido usa el icono informativo. Siempre va junto al texto. */
function orderStatusIcon(status: string): IconName {
  return Object.hasOwn(statusIcon, status) ? statusIcon[status as keyof typeof statusIcon] : 'info';
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // Solo el rol admin pasa; un organizador recibe redirección a /panel/.
  const account = await requireRole('admin', adminHomePath);
  const params = await searchParams;
  const message = reviewResultMessage({
    revision: firstParam(params.revision),
    error: firstParam(params.error),
  });
  const destacados = firstParam(params.destacados);
  const featuredMessage =
    destacados === 'ok'
      ? 'Destacados actualizados. La portada se actualiza en menos de un minuto.'
      : destacados === 'limite'
        ? 'Ya hay cuatro destacados. Quita uno antes de agregar otro.'
        : destacados === 'error'
          ? 'No pudimos actualizar los destacados. Intenta nuevamente.'
          : null;

  // RLS del administrador: ve todos los eventos y todas las órdenes.
  const pendingResult = await account.client
    .from('events')
    .select('id, title, starts_at, mode, organizer:organizers(name)')
    .eq('status', 'pending')
    .order('starts_at');

  if (pendingResult.error) {
    throw new Error('No pudimos cargar los eventos pendientes.');
  }

  const ordersResult = await account.client
    .from('orders')
    .select('id, status, total_cents, created_at, event:events(title)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (ordersResult.error) {
    throw new Error('No pudimos cargar las órdenes.');
  }

  // PostgREST devuelve la relación muchos-a-uno como objeto; el cliente sin tipos la infiere como lista.
  const pending = (pendingResult.data ?? []) as unknown as PendingEvent[];
  const orders = (ordersResult.data ?? []) as unknown as RecentOrder[];

  const publishedResult = await account.client
    .from('events')
    .select('id, title, starts_at, organizer:organizers(name)')
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(50);
  const featuredResult = await account.client.from('event_featured').select('event_id, position').order('position');

  if (publishedResult.error || featuredResult.error) {
    throw new Error('No pudimos cargar los destacados.');
  }

  const published = (publishedResult.data ?? []) as unknown as PublishedEvent[];
  const featuredPosition = new Map(
    ((featuredResult.data ?? []) as { event_id: string; position: number }[]).map((row) => [row.event_id, row.position]),
  );

  return (
    <section aria-labelledby="admin-title" className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="admin-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
            Administración
          </h1>
          <p className="font-texto text-base leading-7 text-texto-suave">Modo DEMO. Zona exclusiva del administrador.</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
            <Icon name="logOut" />
            Cerrar sesión
          </button>
        </form>
      </header>

      {message ? (
        <p role="status" className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto">
          {message}
        </p>
      ) : null}

      <section aria-labelledby="pending-title" className="flex flex-col gap-4">
        <h2 id="pending-title" className="font-titulo text-xl font-bold">
          Eventos por revisar
        </h2>
        <p className="font-texto text-base leading-7 text-texto-suave">{pendingReviewText(pending.length)}</p>

        {pending.length > 0 ? (
          <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
            {pending.map((event) => (
              <li key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-texto text-base font-medium text-texto">{event.title}</span>
                  <span className="font-texto text-sm text-texto-suave">
                    {event.organizer?.name ?? 'Sin organizador'} · {formatEventStart(event.starts_at)} ·{' '}
                    {event.mode === 'presencial' ? 'Presencial' : 'Virtual'}
                  </span>
                </div>
                <form action={reviewEventAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="eventId" value={event.id} />
                  <button type="submit" name="decision" value="approve" className={buttonVariants({ variant: 'compra' })}>
                    <Icon name="check" />
                    Aprobar
                  </button>
                  <button type="submit" name="decision" value="reject" className={buttonVariants({ variant: 'secundario' })}>
                    <Icon name="close" />
                    Rechazar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="featured-title" className="flex flex-col gap-4">
        <h2 id="featured-title" className="font-titulo text-xl font-bold">
          Destacados de la portada
        </h2>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Hasta cuatro eventos publicados. Si no hay ninguno marcado, la portada muestra los próximos.
        </p>
        {featuredMessage ? (
          <p role="status" className="rounded-lg bg-superficie p-4 font-texto text-sm leading-6 text-texto">
            {featuredMessage}
          </p>
        ) : null}
        {published.length === 0 ? (
          <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
            No hay eventos publicados y próximos.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
            {published.map((event) => {
              const posicion = featuredPosition.get(event.id);

              return (
                <li key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-texto text-base font-medium text-texto">{event.title}</span>
                    <span className="font-texto text-sm text-texto-suave">
                      {event.organizer?.name ?? 'Sin organizador'} · {formatEventStart(event.starts_at)}
                      {posicion ? ` · Destacado ${posicion}` : ''}
                    </span>
                  </div>
                  <form action={setFeaturedAction}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="featured" value={posicion ? 'false' : 'true'} />
                    <button type="submit" className={buttonVariants({ variant: posicion ? 'secundario' : 'compra' })}>
                      {posicion ? 'Quitar de destacados' : 'Destacar en portada'}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="orders-title" className="flex flex-col gap-4">
        <h2 id="orders-title" className="font-titulo text-xl font-bold">
          Órdenes recientes
        </h2>

        {orders.length === 0 ? (
          <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
            Todavía no hay órdenes.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-texto text-base font-medium text-texto">
                  {order.event?.title ?? 'Evento'} · Orden {order.id.slice(0, 8)}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-texto text-sm text-texto-suave">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-superficie-sutil px-2.5 py-1 font-medium text-texto">
                    <Icon name={orderStatusIcon(order.status)} size={16} />
                    {orderStatusLabel(order.status)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="tag" size={16} />
                    {formatUsd(order.total_cents)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="calendar" size={16} />
                    {formatEventStart(order.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
