'use client';

import { SimulatedPaymentPanel } from '@/components/payments/simulated-payment-panel';
import { purchaseBusinessPackageAction } from '@/features/packages/actions';
import { trackEvent } from '@/lib/analytics/track';

type PackagePurchaseProps = Readonly<{ amountCents: number }>;

export function PackagePurchase({ amountCents }: PackagePurchaseProps) {
  async function onDecision(decision: Parameters<typeof purchaseBusinessPackageAction>[0]) {
    const result = await purchaseBusinessPackageAction(decision);
    if (result.ok && result.analyticsEvent) trackEvent(result.analyticsEvent, { path: '/para-empresas/' });
    return result;
  }

  return (
    <SimulatedPaymentPanel
      amountCents={amountCents}
      summary={[{ label: 'Paquete anual para empresas', amountCents }]}
      onDecision={onDecision}
    />
  );
}
