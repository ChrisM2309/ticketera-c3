import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';

import { ShareButton } from '@/components/catalog/share-button';
import { AccountPrompt } from '@/components/checkout/account-prompt';
import { PrintButton } from '@/components/checkout/print-button';
import { SimulatedDelivery } from '@/components/checkout/simulated-delivery';
import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconTone } from '@/components/ui/icon';
import { statusIcon } from '@/features/catalog/icons';
import { eventDateParts, formatUsd, modeLabel } from '@/features/catalog/format';
import { receiptStatusLabel } from '@/features/checkout/payment-flow';
import { resolveOrderAccount } from '@/features/ticketing/claim';
import { loadOrderConfirmation, type OrderConfirmation } from '@/features/ticketing/confirmation';
import { buyerHomePath } from '@/lib/auth/access';
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

/** Fecha y hora de la confirmación en la zona de El Salvador. */
function formatPaidAt(isoDate: string): string {
  const parts = eventDateParts(isoDate);
  const year = new Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', year: 'numeric' }).format(
    new Date(isoDate),
  );

  return `${parts.day} ${parts.month} ${year} · ${parts.time}`;
}

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
  // Con sesión, la compra de invitado con el mismo correo se guarda en la cuenta.
  const account = await resolveOrderAccount(orderId, token);
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
        {confirmation.status === 'confirmed' ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap print:hidden">
            <a
              href={`/calendario/${confirmation.event.id}/`}
              className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-fit print:hidden')}
            >
              <Icon name="calendarPlus" />
              Agregar al calendario
            </a>
            {confirmation.event.url ? (
              <ShareButton
                title={confirmation.event.title}
                startsAt={confirmation.event.startsAt}
                eventUrl={confirmation.event.url}
              />
            ) : null}
          </div>
        ) : null}
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

      {tickets.length > 0 ? <SimulatedDelivery deliveries={confirmation.deliveries} /> : null}

      {confirmation.status !== 'pending' ? (
        <section aria-labelledby="receipt-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="receipt-title" className="font-titulo text-xl font-bold">
              Comprobante
            </h2>
            <div className="sm:w-56">
              <PrintButton label="Imprimir comprobante" />
            </div>
          </div>
          <p className="font-texto text-sm text-texto-suave">
            Comprobante simulado: no corresponde a un cobro real ni se pidieron datos de tarjeta.
          </p>
          <dl className="grid gap-3 font-texto text-sm sm:grid-cols-2">
            <div>
              <dt className={termClass}>Número de orden</dt>
              <dd className="break-all">{confirmation.receipt.orderNumber}</dd>
            </div>
            <div>
              <dt className={termClass}>Método</dt>
              <dd>{confirmation.receipt.methodLabel}</dd>
            </div>
            <div>
              <dt className={termClass}>Estado</dt>
              <dd className="flex items-center gap-2">
                <Icon name={statusIcon[confirmation.status]} size={16} tone={statusTone[confirmation.status]} />
                {receiptStatusLabel(confirmation.receipt.status)}
              </dd>
            </div>
            {confirmation.receipt.paymentId ? (
              <div>
                <dt className={termClass}>Referencia de pago</dt>
                <dd className="break-all">{confirmation.receipt.paymentId}</dd>
              </div>
            ) : null}
            {confirmation.receipt.paidAt ? (
              <div>
                <dt className={termClass}>Fecha de confirmación</dt>
                <dd>{formatPaidAt(confirmation.receipt.paidAt)}</dd>
              </div>
            ) : null}
            <div>
              <dt className={termClass}>Subtotal</dt>
              <dd className="tabular-nums">{formatUsd(confirmation.receipt.subtotalCents)}</dd>
            </div>
            <div>
              <dt className={termClass}>Comisión DEMO</dt>
              <dd className="tabular-nums">{formatUsd(confirmation.receipt.feeCents)}</dd>
            </div>
            <div>
              <dt className={termClass}>Total</dt>
              <dd className="font-semibold tabular-nums">{formatUsd(confirmation.receipt.totalCents)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {account.saved ? (
        <section
          aria-label="Compra guardada en tu cuenta"
          className="flex flex-col gap-3 rounded-lg bg-superficie-sutil p-4 print:hidden sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-2 font-titulo text-sm font-semibold">
            <Icon name="check" size={16} tone="exito" />
            Guardamos esta compra en tu cuenta
          </p>
          <Link href={buyerHomePath} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
            <Icon name="ticket" />
            Ver Mis boletos
          </Link>
        </section>
      ) : null}

      <AccountPrompt variant="confirmation" signedIn={account.signedIn} next={`/confirmacion/${orderId}/${token}/`} />

      <Link href="/" className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full print:hidden')}>
        Volver al inicio
      </Link>
    </div>
  );
}
