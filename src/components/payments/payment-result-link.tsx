'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paymentResultTicketsHref } from '@/features/checkout/result-link';
import { CHECKOUT_SESSION_STORAGE_KEY } from '@/features/checkout/order';
import { cn } from '@/lib/utils';

type PaymentResultLinkProps = Readonly<{ orderId: string; signedIn: boolean }>;

export function PaymentResultLink({ orderId, signedIn }: PaymentResultLinkProps) {
  const storedSession = useSyncExternalStore(
    () => () => undefined,
    () => window.sessionStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY),
    () => null,
  );
  const href = paymentResultTicketsHref(orderId, storedSession, signedIn);

  const canOpenOrder = href.startsWith(`/confirmacion/${orderId}/`);

  return (
    <Link href={href} className={cn(buttonVariants({ variant: 'compra' }), 'w-full min-w-0 whitespace-normal px-3 text-sm normal-case tracking-normal sm:w-auto')}>
      <Icon name="ticket" className="shrink-0" />
      {canOpenOrder || signedIn ? 'Ver mis boletos' : 'Ingresar para ver mis boletos'}
    </Link>
  );
}
