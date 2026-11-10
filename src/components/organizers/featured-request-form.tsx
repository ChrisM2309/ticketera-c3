'use client';

import { useMemo, useState } from 'react';

import { SimulatedPaymentPanel } from '@/components/payments/simulated-payment-panel';
import { formatUsd } from '@/features/catalog/format';
import { provisionalFeaturedTotal } from '@/features/featured/pricing';
import type { FeaturedRequestActionResult } from '@/features/featured/request-actions';

type Props = {
  eventId: string;
  eventTitle: string;
  dailyRateCents: number | null;
  minDate: string;
  action: (formData: FormData) => Promise<FeaturedRequestActionResult>;
};

export function FeaturedRequestForm({ eventId, eventTitle, dailyRateCents, minDate, action }: Props) {
  const [startsOn, setStartsOn] = useState(minDate);
  const [days, setDays] = useState(1);
  const total = useMemo(
    () => (dailyRateCents === null ? 0 : provisionalFeaturedTotal({ days, dailyRateCents })),
    [days, dailyRateCents],
  );

  if (dailyRateCents === null) {
    return <p className="rounded-lg bg-superficie-sutil p-4 font-texto text-base text-texto">Tarifa por definir. El envío está deshabilitado.</p>;
  }

  async function submit(decision: 'approved' | 'rejected') {
    const formData = new FormData();
    formData.set('eventId', eventId);
    formData.set('startsOn', startsOn);
    formData.set('days', String(days));
    formData.set('decision', decision);
    return action(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-texto text-sm">Fecha de inicio
          <input aria-label="Fecha de inicio" type="date" min={minDate} value={startsOn} onChange={(event) => setStartsOn(event.target.value)} className="rounded-md border border-borde bg-fondo px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 font-texto text-sm">Días (1–30)
          <input aria-label="Días" type="number" min={1} max={30} value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-md border border-borde bg-fondo px-3 py-2" />
        </label>
      </div>
      <p className="font-texto text-base text-texto">Total provisional: <strong>{formatUsd(total)}</strong>. La tarifa es {formatUsd(dailyRateCents)} por día.</p>
      <SimulatedPaymentPanel
        amountCents={total}
        summary={[{ label: `Destacado: ${eventTitle}`, amountCents: total }]}
        onDecision={submit}
      />
    </div>
  );
}
