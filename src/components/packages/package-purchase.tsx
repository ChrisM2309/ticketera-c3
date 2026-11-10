'use client';

import { SimulatedPaymentPanel } from '@/components/payments/simulated-payment-panel';
import { purchaseBusinessPackageAction } from '@/features/packages/actions';

type PackagePurchaseProps = Readonly<{ amountCents: number }>;

export function PackagePurchase({ amountCents }: PackagePurchaseProps) {
  return (
    <SimulatedPaymentPanel
      amountCents={amountCents}
      summary={[{ label: 'Paquete anual para empresas', amountCents }]}
      onDecision={purchaseBusinessPackageAction}
    />
  );
}
