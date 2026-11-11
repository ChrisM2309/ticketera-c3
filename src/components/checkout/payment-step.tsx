'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { startOrderPayment, WompiPaymentButton } from '@/components/payments/wompi-payment-button';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { statusIcon } from '@/features/catalog/icons';
import { checkoutErrorView, type CheckoutErrorView } from '@/features/checkout/errors';
import { receiptStatusLabel } from '@/features/checkout/payment-flow';
import { siteConfig } from '@/lib/site-config';
import { trackEvent } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';

export type PendingOrder = {
  orderId: string;
  totalCents: number;
  checkoutToken: string;
  /** Ficha del evento para «Volver al evento» cuando la compra ya no es posible. */
  eventHref?: string;
};

export type CheckoutStep = 'datos' | 'pago' | 'boletos';

const stepOrder: readonly CheckoutStep[] = ['datos', 'pago', 'boletos'];

type CheckoutStepsProps = Readonly<{
  current: CheckoutStep;
  /** En una compra gratuita no hay pago: el segundo paso es la confirmación del registro. */
  free?: boolean;
}>;

/**
 * Pasos de la compra. Los completados llevan un check junto a su nombre; el paso actual se anuncia con
 * aria-current y los pendientes muestran su número. En `boletos` la orden ya está confirmada: todo queda completo.
 */
export function CheckoutSteps({ current, free = false }: CheckoutStepsProps) {
  const labels: Record<CheckoutStep, string> = {
    datos: 'Tus datos',
    pago: free ? 'Confirmación' : 'Pago',
    boletos: 'Boletos',
  };
  const currentIndex = stepOrder.indexOf(current);

  return (
    <ol aria-label="Pasos de la compra" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-texto text-sm">
      {stepOrder.map((step, index) => {
        const done = index < currentIndex || current === 'boletos';
        const active = step === current && !done;

        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className={cn('inline-flex items-center gap-2', active ? 'font-bold text-texto' : 'font-medium text-texto-suave')}
          >
            {done ? (
              <Icon name="check" size={24} tone="exito" />
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-6 items-center justify-center rounded-full border text-xs',
                  active ? 'border-accion text-accion' : 'border-borde-fuerte',
                )}
              >
                {index + 1}
              </span>
            )}
            {labels[step]}
            {done ? <span className="sr-only"> (completado)</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

type CheckoutErrorNoticeProps = Readonly<{
  view: CheckoutErrorView;
  eventHref?: string;
  onRetry?: () => void;
  retrying?: boolean;
}>;

/** Fallo de la compra en lenguaje claro, anunciado con role="alert" y con la acción que corresponde. */
export function CheckoutErrorNotice({ view, eventHref, onRetry, retrying = false }: CheckoutErrorNoticeProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-md bg-superficie-sutil p-4 font-texto">
      <p className="flex items-start gap-2 text-base font-semibold leading-6 text-error">
        <Icon name={statusIcon.failed} size={20} tone="error" />
        {view.title}
      </p>
      <p className="text-sm leading-6 text-texto-suave">{view.detail}</p>
      {view.action === 'retry' && onRetry ? (
        <button
          type="button"
          disabled={retrying}
          onClick={onRetry}
          className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full sm:w-auto')}
        >
          {retrying ? 'Reintentando…' : 'Reintentar'}
        </button>
      ) : null}
      {view.action === 'back-to-event' ? (
        <Link href={eventHref ?? '/'} className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full sm:w-auto')}>
          Volver al evento
        </Link>
      ) : null}
    </div>
  );
}

type PaymentView = { status: 'pending' } | { status: 'confirmed'; ticketCount: number } | { status: 'failed' };

type PaymentStepProps = {
  order: PendingOrder & { subtotalCents: number; feeCents: number };
};

type ConfirmOutcome = { ok: true; confirmed: boolean } | { ok: false; view: CheckoutErrorView };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readResult(value: unknown): PaymentView | null {
  if (!isRecord(value) || typeof value.status !== 'string') {
    return null;
  }

  if (value.status === 'failed') {
    return { status: 'failed' };
  }

  if (value.status === 'confirmed' && typeof value.ticketCount === 'number') {
    return { status: 'confirmed', ticketCount: value.ticketCount };
  }

  return null;
}

function readError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === 'string' ? value.error : null;
}

export function PaymentStep({ order }: PaymentStepProps) {
  const [view, setView] = useState<PaymentView>({ status: 'pending' });
  const [errorView, setErrorView] = useState<CheckoutErrorView | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // La referencia evita un segundo envío antes de que el botón se deshabilite.
  const inFlight = useRef(false);
  const isFree = order.totalCents === 0;

  /** Confirma una compra gratuita. Las compras con importe se confirman solo desde el webhook de Wompi. */
  async function requestConfirmation(): Promise<ConfirmOutcome> {
    try {
      const response = await fetch(`/api/checkout/orders/${order.orderId}/confirm/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checkoutToken: order.checkoutToken }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        return { ok: false, view: checkoutErrorView(readError(body), response.status) };
      }

      const result = readResult(body);

      if (!result) {
        return { ok: false, view: checkoutErrorView(null, response.status) };
      }

      setView(result);
      return { ok: true, confirmed: result.status === 'confirmed' };
    } catch {
      return { ok: false, view: checkoutErrorView(null, 0) };
    }
  }

  async function confirmFree() {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setIsConfirming(true);
    setErrorView(null);

    try {
      const outcome = await requestConfirmation();

      if (!outcome.ok) {
        setErrorView(outcome.view);
      } else if (outcome.confirmed) {
        trackEvent('purchase_confirmed', { path: window.location.pathname });
      }
    } finally {
      inFlight.current = false;
      setIsConfirming(false);
    }
  }

  /** «Reintentar» repite la confirmación gratuita (misma orden y clave): no duplica boletos. */
  async function retryConfirmation() {
    if (inFlight.current || !isFree) {
      return;
    }

    inFlight.current = true;
    setIsConfirming(true);
    setErrorView(null);

    try {
      const outcome = await requestConfirmation();

      if (!outcome.ok) {
        setErrorView(outcome.view);
      }
    } finally {
      inFlight.current = false;
      setIsConfirming(false);
    }
  }

  if (view.status === 'confirmed') {
    return (
      <section aria-labelledby="payment-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6 shadow-sm">
        <CheckoutSteps current="boletos" free={isFree} />
        <h1 id="payment-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name={statusIcon.confirmed} size={24} tone="exito" />
          Orden confirmada
        </h1>
        <p role="status" className="font-texto text-base leading-7 text-texto-suave">
          {view.ticketCount === 1
            ? 'Emitimos 1 boleto para esta orden.'
            : `Emitimos ${view.ticketCount} boletos para esta orden.`}
        </p>
        <p className="font-texto text-sm leading-6 text-texto-suave">Número de orden: {order.orderId}</p>
        {isFree ? null : (
          <p className="font-texto text-sm leading-6 text-texto-suave">
            Pago de demostración: {receiptStatusLabel('approved')}
          </p>
        )}
        <Link
          href={`/confirmacion/${order.orderId}/${order.checkoutToken}/`}
          className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
        >
          <Icon name="ticket" />
          Ver mis boletos
        </Link>
      </section>
    );
  }

  if (view.status === 'failed') {
    return (
      <section aria-labelledby="payment-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6 shadow-sm">
        <CheckoutSteps current="pago" free={isFree} />
        <h1 id="payment-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name={statusIcon.failed} size={24} tone="error" />
          Pago rechazado
        </h1>
        <p role="status" className="font-texto text-base leading-7 text-texto-suave">
          La orden quedó fallida. No se emitieron boletos ni se descontó cupo.
        </p>
        <p className="font-texto text-sm leading-6 text-texto-suave">
          Pago de demostración: {receiptStatusLabel('rejected')}
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full')}>
          Volver al inicio
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="payment-title" className="flex flex-col gap-5 rounded-lg bg-superficie p-6 shadow-sm">
      <CheckoutSteps current="pago" free={isFree} />
      <header className="flex flex-col gap-2">
        <h1 id="payment-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          {isFree ? 'Confirmá tu registro' : 'Pago de demostración'}
        </h1>
        {isFree ? (
          <p className="font-texto text-base leading-7 text-texto-suave">
            Este evento es gratuito. Confirmá tu registro para emitir tus boletos.
          </p>
        ) : null}
      </header>

      {isFree ? (
        <>
          {errorView ? (
            <CheckoutErrorNotice
              view={errorView}
              eventHref={order.eventHref}
              onRetry={retryConfirmation}
              retrying={isConfirming}
            />
          ) : null}
          <button
            type="button"
            disabled={isConfirming}
            onClick={confirmFree}
            className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
          >
            <Icon name="check" />
            {isConfirming ? 'Confirmando…' : 'Confirmar registro gratuito'}
          </button>
        </>
      ) : (
        <>
          {errorView ? (
            <CheckoutErrorNotice
              view={errorView}
              eventHref={order.eventHref}
              onRetry={retryConfirmation}
              retrying={isConfirming}
            />
          ) : null}
          <WompiPaymentButton
            start={() => startOrderPayment(order.orderId, order.checkoutToken)}
            amountCents={order.totalCents}
            summary={[
              { label: 'Subtotal', amountCents: order.subtotalCents },
              { label: `Comisión DEMO (${siteConfig.demoCommissionPercent} %)`, amountCents: order.feeCents },
            ]}
          />
        </>
      )}
    </section>
  );
}
