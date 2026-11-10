import type { Metadata } from 'next';
import Link from 'next/link';

import { OrdersList } from '@/components/accounts/orders-list';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { listMyOrders } from '@/features/accounts/orders';
import { accountPath, buyerHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Mis boletos DEMO',
  robots: { index: false, follow: false },
};

export default async function MyTicketsPage() {
  // El proxy solo mira cookies; esta comprobación valida la sesión y el rol en el servidor.
  const account = await requireRole('buyer', buyerHomePath);
  const orders = await listMyOrders(account.client);

  return (
    <section aria-labelledby="mis-boletos-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="mis-boletos-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
            <Icon name="ticket" size={24} />
            Mis boletos
          </h1>
          <p className="font-texto text-base leading-7 text-texto-suave">
            Modo DEMO: tus compras con pago de demostración, sin cobros reales.
          </p>
        </div>
        <Link href={accountPath} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
          <Icon name="user" />
          Mi cuenta
        </Link>
      </header>

      <OrdersList orders={orders} />
    </section>
  );
}
