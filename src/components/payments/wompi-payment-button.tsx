'use client';

import { useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatUsd } from '@/features/catalog/format';
import { cn } from '@/lib/utils';

type SummaryLine = { label: string; amountCents: number };

type WompiPaymentButtonProps = Readonly<{
  orderId: string;
  checkoutToken: string;
  amountCents: number;
  summary: readonly SummaryLine[];
}>;

/**
 * Pago con Wompi El Salvador en modo de prueba. El servidor crea el enlace y el navegador solo sigue la
 * URL que devuelve. No hay campos de tarjeta ni decisiones de pago en el navegador.
 */
export function WompiPaymentButton({ orderId, checkoutToken, amountCents, summary }: WompiPaymentButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startPayment() {
    if (pending) return;

    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/checkout/orders/${orderId}/pago/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checkoutToken }),
      });
      const body = (await response.json().catch(() => null)) as { redirectUrl?: unknown; error?: unknown } | null;

      if (response.ok && typeof body?.redirectUrl === 'string') {
        window.location.assign(body.redirectUrl);
        return;
      }

      // Un error no marca la compra como exitosa: la orden sigue pendiente y el comprador puede reintentar.
      setMessage(typeof body?.error === 'string' ? body.error : 'No pudimos iniciar el pago. Intentá nuevamente.');
    } catch {
      setMessage('No pudimos iniciar el pago. Revisá tu conexión e intentá nuevamente.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg bg-superficie p-6">
      <div className="flex flex-col gap-2 font-texto text-sm">
        {summary.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-4">
            <span className="text-texto-suave">{line.label}</span>
            <span>{formatUsd(line.amountCents)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 border-t border-borde pt-2 font-semibold">
          <span>Total</span>
          <span>{formatUsd(amountCents)}</span>
        </div>
      </div>

      <p className="font-texto text-sm leading-6 text-texto-suave">
        Vas a completar el pago en Wompi (prueba). No se realiza ningún cobro real.
      </p>

      {message ? (
        <p role="alert" className="font-texto text-sm text-error">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={startPayment}
        disabled={pending}
        className={cn(buttonVariants({ variant: 'compra' }), 'w-full')}
      >
        <Icon name="lock" />
        {pending ? 'Preparando el pago…' : 'Pagar con Wompi (prueba)'}
      </button>
    </div>
  );
}
