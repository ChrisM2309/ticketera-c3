'use client';

import { WompiPaymentButton } from '@/components/payments/wompi-payment-button';
import { startPackagePaymentAction } from '@/features/packages/actions';

type PackagePurchaseProps = Readonly<{ amountCents: number }>;

export function PackagePurchase({ amountCents }: PackagePurchaseProps) {
  return (
    <WompiPaymentButton
      start={startPackagePaymentAction}
      amountCents={amountCents}
      summary={[{ label: 'Paquete anual para empresas', amountCents }]}
    />
  );
}
