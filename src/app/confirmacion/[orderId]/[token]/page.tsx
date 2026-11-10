import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';

import { PrintButton } from '@/components/checkout/print-button';
import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconTone } from '@/components/ui/icon';
import { statusIcon } from '@/features/catalog/icons';
import { eventDateParts, formatUsd, modeLabel } from '@/features/catalog/format';
import { loadOrderConfirmation, type OrderConfirmation } from '@/features/ticketing/confirmation';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Confirmación de compra DEMO',
  robots: { index: false, follow: false },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

type ConfirmationPageProps = {
  params: Promise<{ orderId: string; token: string }>;
};

const statusTitle: Record<OrderConfirmation['status'], string> = {
  confirmed: 'Tu compra está confirmada',
  failed: 'El pago no se completó',
  pending: 'Tu orden está pendiente',
};

const statusMessage: Record<OrderConfirmation['status'], string> = {
  confirmed: 'Guarda este enlace. Desde aquí puedes volver a ver y descargar tus boletos.',
  failed: 'La orden quedó fallida. No se emitieron boletos ni se descontó cupo.',
  pending: 'La orden aún no tiene boletos. Vuelve a intentar desde el checkout.',
};

/** Tono del icono de estado: siempre acompaña al título con el texto del estado. */
const statusTone: Record<OrderConfirmation['status'], IconTone> = {
  confirmed: 'exito',
  failed: 'error',
  pending: 'suave',
};

const termClass = 'flex items-center gap-2 text-texto-suave';

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId, token } = await params;

  if (!uuidPattern.test(orderId) || !tokenPattern.test(token)) {
    notFound();
  }

  const result = await loadOrderConfirmation(orderId, token);

  if (result.status === 'not_found') {
    notFound();
  }

  if (result.status === 'unavailable') {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 pt-10 md:px-6 md:pt-14">
        <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">No pudimos cargar tu compra</h1>
        <p className="font-texto text-base leading-7 text-texto-suave">Intenta nuevamente en unos minutos.</p>
      </div>
    );
  }

  const { confirmation } = result;
  const date = eventDateParts(confirmation.event.startsAt);
  const tickets = await Promise.all(
    confirmation.tickets.map(async (ticket, index) => ({
      ...ticket,
      number: index + 1,
      qrImage: await QRCode.toDataURL(ticket.qrToken, { margin: 1, width: 240, errorCorrectionLevel: 'M' }),
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <header className="flex flex-col gap-3">
        <p className="font-texto text-sm text-texto-suave">Compra DEMO: no se cobró dinero ni se pidieron datos de tarjeta.</p>
        <h1 className="flex items-center gap-3 font-titulo text-4xl font-bold leading-tight tracking-tight">
          <Icon name={statusIcon[confirmation.status]} size={24} tone={statusTone[confirmation.status]} />
          {statusTitle[confirmation.status]}
        </h1>
        <p className="max-w-2xl font-texto text-base leading-7 text-texto-suave">{statusMessage[confirmation.status]}</p>
      </header>

      <section aria-labelledby="order-summary" className="flex flex-col gap-4 rounded-lg bg-superficie p-6 shadow-sm">
        <h2 id="order-summary" className="font-titulo text-xl font-bold">
          {confirmation.event.title}
        </h2>
        <dl className="grid gap-3 font-texto text-sm sm:grid-cols-2">
          <div>
            <dt className={termClass}>
              <Icon name="calendar" size={16} />
              Fecha y hora
            </dt>
            <dd>
              {date.day} {date.month} · {date.time}
            </dd>
          </div>
          <div>
            <dt className={termClass}>
              <Icon name={confirmation.event.mode === 'virtual' ? 'monitor' : 'mapPin'} size={16} />
              Modalidad
            </dt>
            <dd>
              {modeLabel(confirmation.event.mode)}
              {confirmation.event.venue ? ` · ${confirmation.event.venue}` : ''}
            </dd>
          </div>
          <div>
            <dt className={termClass}>
              <Icon name="ticket" size={16} />
              Número de orden
            </dt>
            <dd className="break-all">{confirmation.orderId}</dd>
          </div>
          <div>
            <dt className={termClass}>
              <Icon name="tag" size={16} />
              Total DEMO
            </dt>
            <dd>{formatUsd(confirmation.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {tickets.length > 0 ? (
        <section aria-labelledby="tickets-title" className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="tickets-title" className="font-titulo text-xl font-bold">
              Tus boletos
            </h2>
            <div className="sm:w-56">
              <PrintButton />
            </div>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <li key={ticket.ticketId} className="flex flex-col gap-4 rounded-lg bg-superficie p-5 shadow-sm">
                <p className="flex items-center gap-2 font-titulo text-sm font-semibold">
                  <Icon name="qr" size={16} />
                  Boleto {ticket.number} · {ticket.typeName}
                </p>
                <Image
                  src={ticket.qrImage}
                  alt={`Código QR del boleto ${ticket.number}`}
                  width={240}
                  height={240}
                  unoptimized
                  className="mx-auto h-auto w-full max-w-60"
                />
                <a
                  href={`/confirmacion/${confirmation.orderId}/${token}/qr/${ticket.ticketId}/`}
                  className={cn(buttonVariants({ variant: 'secundario' }), 'w-full print:hidden')}
                >
                  <Icon name="download" />
                  Descargar QR
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link href="/" className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full print:hidden')}>
        Volver al inicio
      </Link>
    </div>
  );
}
