'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatUsd } from '@/features/catalog/format';
import type { PaymentDecision } from '@/features/checkout/payment';
import { nextPaymentStep, type PaymentStep } from '@/features/checkout/payment-flow';
import { cn } from '@/lib/utils';

export type SimulatedPaymentSummaryLine = { label: string; amountCents: number };

type SimulatedPaymentPanelProps = Readonly<{
  amountCents: number;
  summary: readonly SimulatedPaymentSummaryLine[];
  onDecision: (decision: PaymentDecision) => Promise<{ ok: boolean; message?: string }>;
}>;

export const demoNotice = 'Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria.';

const stepTitle: Record<PaymentStep, string> = {
  review: 'Resumen',
  method: 'Resultado de la simulación',
  processing: 'Procesando pago de demostración…',
  result: 'Resultado registrado',
};

const decisionOptions: readonly { value: PaymentDecision; label: string; hint: string }[] = [
  { value: 'approved', label: 'Simular pago aprobado', hint: 'Se confirma la orden y se emiten los boletos.' },
  {
    value: 'rejected',
    label: 'Simular pago rechazado',
    hint: 'La orden queda fallida: no se emiten boletos ni se descuenta cupo.',
  },
];

const fallbackMessage = 'No pudimos confirmar la orden. Intentá nuevamente.';

/**
 * Pago simulado en pasos: resumen, elección del resultado, procesamiento y resultado. No hay campos de
 * tarjeta ni datos bancarios; el padre decide qué hace cada resultado en `onDecision`.
 */
export function SimulatedPaymentPanel({ amountCents, summary, onDecision }: SimulatedPaymentPanelProps) {
  const [step, setStep] = useState<PaymentStep>('review');
  const [decision, setDecision] = useState<PaymentDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  // La referencia evita un segundo envío antes de que el paso cambie a «procesando».
  const inFlight = useRef(false);
  const groupName = useId();
  const hintId = useId();

  // Al cambiar de paso, el foco pasa al título para que los lectores de pantalla anuncien el nuevo contenido.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    titleRef.current?.focus();
  }, [step]);

  async function submit() {
    if (inFlight.current) {
      return;
    }

    if (!decision) {
      setError('Elegí el resultado que quieres simular.');
      return;
    }

    inFlight.current = true;
    setError(null);
    setStep((current) => nextPaymentStep(current, 'submitted'));

    try {
      const outcome = await onDecision(decision);

      if (outcome.ok) {
        setStep((current) => nextPaymentStep(current, 'settled'));
      } else {
        setError(outcome.message ?? fallbackMessage);
        setStep('method');
      }
    } catch {
      setError(fallbackMessage);
      setStep('method');
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-start gap-2 rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-texto">
        <Icon name="info" size={20} tone="advertencia" />
        <span>{demoNotice}</span>
      </p>

      <h2 ref={titleRef} tabIndex={-1} className="font-titulo text-xl font-bold outline-none">
        {stepTitle[step]}
      </h2>

      {step === 'review' ? (
        <>
          <dl className="flex flex-col gap-2 font-texto text-sm">
            {summary.map((line) => (
              <div key={line.label} className="flex items-center justify-between gap-4">
                <dt className="text-texto-suave">{line.label}</dt>
                <dd className="font-semibold tabular-nums">{formatUsd(line.amountCents)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 border-t border-borde pt-3 text-base">
              <dt className="font-titulo font-bold">Total a pagar (simulado)</dt>
              <dd className="font-titulo font-bold tabular-nums">{formatUsd(amountCents)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => setStep((current) => nextPaymentStep(current, 'continue'))}
            className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
          >
            Continuar con el pago simulado
          </button>
        </>
      ) : null}

      {step === 'method' ? (
        <>
          {error ? (
            <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
              {error}
            </p>
          ) : null}
          <fieldset aria-describedby={hintId} className="flex flex-col gap-3">
            <legend className="mb-1 font-texto text-sm font-semibold">Elegí el resultado que quieres simular</legend>
            <p id={hintId} className="font-texto text-sm leading-6 text-texto-suave">
              Pago de demostración: no se piden datos de tarjeta.
            </p>
            {decisionOptions.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-borde-fuerte bg-superficie p-3 font-texto has-focus-visible:ring-2 has-focus-visible:ring-foco"
              >
                <input
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={decision === option.value}
                  onChange={() => {
                    setDecision(option.value);
                    setError(null);
                  }}
                  className="mt-1 size-5 shrink-0 accent-accion"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-base font-semibold">{option.label}</span>
                  <span className="text-sm leading-6 text-texto-suave">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep((current) => nextPaymentStep(current, 'back'));
              }}
              className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full')}
            >
              <Icon name="chevronLeft" />
              Volver al resumen
            </button>
            <button
              type="button"
              onClick={submit}
              className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
            >
              <Icon name="check" />
              Confirmar pago simulado
            </button>
          </div>
        </>
      ) : null}

      {step === 'processing' ? (
        <p role="status" className="flex items-center gap-3 font-texto text-base leading-7 text-texto-suave">
          <Icon name="clock" size={24} tone="suave" />
          Estamos registrando el resultado simulado. No cierres esta página.
        </p>
      ) : null}

      {step === 'result' ? (
        <p role="status" className="font-texto text-base leading-7 text-texto-suave">
          El resultado de la simulación quedó registrado.
        </p>
      ) : null}
    </div>
  );
}
