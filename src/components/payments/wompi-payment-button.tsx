'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatUsd } from '@/features/catalog/format';
import { cn } from '@/lib/utils';

type SummaryLine = { label: string; amountCents: number };

export type PaymentStart = { ok: true; redirectUrl: string } | { ok: false; message: string };

type WompiPaymentButtonProps = Readonly<{
  amountCents: number;
  summary: readonly SummaryLine[];
  /** Crea el enlace de pago en el servidor y devuelve la URL de Wompi. */
  start: () => Promise<PaymentStart>;
  /** Inicia automáticamente después de crear la orden; se usa en el checkout de entradas. */
  autoStart?: boolean;
}>;

/** Inicio del pago de una orden de entradas (usado por el checkout). */
export async function startOrderPayment(orderId: string, checkoutToken: string): Promise<PaymentStart> {
  try {
    const response = await fetch(`/api/checkout/orders/${orderId}/pago/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ checkoutToken }),
    });
    const body = (await response.json().catch(() => null)) as { redirectUrl?: unknown; error?: unknown } | null;

    if (response.ok && typeof body?.redirectUrl === 'string') return { ok: true, redirectUrl: body.redirectUrl };
    return { ok: false, message: typeof body?.error === 'string' ? body.error : 'No pudimos iniciar el pago. Intenta nuevamente.' };
  } catch {
    return { ok: false, message: 'No pudimos iniciar el pago. Revisa tu conexión e intenta nuevamente.' };
  }
}

/**
 * Botón de pago con Wompi El Salvador en modo de prueba. El servidor crea el enlace y el navegador solo sigue la
 * URL que devuelve. No hay campos de tarjeta ni decisiones de pago en el navegador.
 */
export function WompiPaymentButton({ amountCents, summary, start, autoStart = false }: WompiPaymentButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);
  const autoStartAttempted = useRef(false);

  const startPayment = useCallback(async () => {
    if (started.current) return;

    started.current = true;
    setPending(true);
    setMessage(null);

    try {
      const result = await start();

      if (result.ok) {
        window.location.assign(result.redirectUrl);
        return;
      }

      // Un error no marca la compra como exitosa: queda en espera y se puede reintentar.
      setMessage(result.message);
      started.current = false;
    } finally {
      if (!started.current) setPending(false);
    }
  }, [start]);

  useEffect(() => {
    if (autoStart && !autoStartAttempted.current) {
      autoStartAttempted.current = true;
      void startPayment();
    }
  }, [autoStart, startPayment]);

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
        aria-label={`Pagar ${formatUsd(amountCents)} con Wompi en modo de prueba`}
        className={cn(buttonVariants({ variant: 'compra' }), 'w-full min-w-0 whitespace-normal px-3 text-sm normal-case tracking-normal')}
      >
        <Icon name="lock" className="shrink-0" />
        {pending ? 'Preparando pago…' : `Pagar ${formatUsd(amountCents)}`}
      </button>
    </div>
  );
}
