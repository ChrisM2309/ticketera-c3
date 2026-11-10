'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { statusIcon } from '@/features/catalog/icons';
import { cn } from '@/lib/utils';

export type PendingOrder = {
  orderId: string;
  totalCents: number;
  checkoutToken: string;
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

type PaymentView = { status: 'pending' } | { status: 'confirmed'; ticketCount: number } | { status: 'failed' };

type PaymentStepProps = {
  order: PendingOrder;
};

const fallbackError = 'No pudimos confirmar la orden. Intentá nuevamente.';

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
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // La referencia evita un segundo envío antes de que el botón se deshabilite.
  const inFlight = useRef(false);
  const isFree = order.totalCents === 0;

  async function confirm(decision: 'approved' | 'rejected' | null) {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch(`/api/checkout/orders/${order.orderId}/confirm/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checkoutToken: order.checkoutToken, decision }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readError(body) ?? fallbackError);
        return;
      }

      const result = readResult(body);

      if (!result) {
        setError(fallbackError);
        return;
      }

      setView(result);
    } catch {
      setError('No pudimos confirmar la orden. Revisá tu conexión e intentá nuevamente.');
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
          {isFree ? 'Confirmá tu registro' : 'Elegí el resultado del pago'}
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          {isFree
            ? 'Este evento es gratuito. Confirmá tu registro para emitir tus boletos.'
            : 'Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria. Elegí el resultado que quieres simular.'}
        </p>
      </header>

      {error ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {error}
        </p>
      ) : null}

      {isFree ? (
        <button
          type="button"
          disabled={isConfirming}
          onClick={() => confirm(null)}
          className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
        >
          <Icon name="check" />
          {isConfirming ? 'Confirmando…' : 'Confirmar registro gratuito'}
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isConfirming}
            onClick={() => confirm('approved')}
            className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
          >
            <Icon name="check" />
            {isConfirming ? 'Confirmando…' : 'Simular pago aprobado'}
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={() => confirm('rejected')}
            className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full')}
          >
            <Icon name="close" />
            Simular pago rechazado
          </button>
        </div>
      )}
    </section>
  );
}
