import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconTone } from '@/components/ui/icon';
import { eventDateParts, formatUsd } from '@/features/catalog/format';
import { statusIcon } from '@/features/catalog/icons';
import { orderStatusLabel, type AccountOrder, type OrderStatus } from '@/features/accounts/orders';
import { cn } from '@/lib/utils';

type OrdersListProps = Readonly<{ orders: readonly AccountOrder[] }>;

/** Tono del icono de estado: siempre acompaña al texto del estado, nunca va solo. */
const statusTone: Record<OrderStatus, IconTone> = {
  pending: 'suave',
  confirmed: 'exito',
  failed: 'error',
  cancelled: 'suave',
};

function formatDate(isoDate: string): string {
  const parts = eventDateParts(isoDate);
  const year = new Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', year: 'numeric' }).format(
    new Date(isoDate),
  );

  return `${parts.day} ${parts.month} ${year} · ${parts.time}`;
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg bg-superficie p-6 shadow-sm">
        <p className="flex items-center gap-3 font-titulo text-xl font-bold">
          <Icon name="ticket" size={24} tone="suave" />
          Aún no tienes compras
        </p>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Cuando compres entradas con tu cuenta, las verás aquí con sus boletos QR.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: 'primario' }), 'w-full sm:w-fit')}>
          <Icon name="search" />
          Ver eventos
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.orderId} className="flex flex-col gap-4 rounded-lg bg-superficie p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="font-titulo text-lg font-bold leading-snug">{order.eventTitle}</h2>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-superficie-sutil px-2.5 py-1 font-texto text-sm font-medium text-texto">
              <Icon name={statusIcon[order.status]} size={16} tone={statusTone[order.status]} />
              {orderStatusLabel[order.status]}
            </span>
          </div>

          <dl className="grid gap-3 font-texto text-sm sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-2 text-texto-suave">
                <Icon name="calendar" size={16} />
                Fecha del evento
              </dt>
              <dd>{formatDate(order.eventStartsAt)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-texto-suave">
                <Icon name="clock" size={16} />
                Comprada
              </dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-texto-suave">
                <Icon name="tag" size={16} />
                Total · Simulado
              </dt>
              <dd className="tabular-nums">{formatUsd(order.totalCents)}</dd>
            </div>
          </dl>

          {order.confirmationPath ? (
            <Link
              href={order.confirmationPath}
              className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-fit')}
            >
              <Icon name={order.status === 'confirmed' ? 'qr' : 'info'} />
              {order.status === 'confirmed' ? 'Ver boletos' : 'Ver detalle'}
              <span className="sr-only"> de {order.eventTitle}</span>
            </Link>
          ) : (
            <p className="font-texto text-sm text-texto-suave">
              No hay un enlace de boletos disponible para esta compra.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
