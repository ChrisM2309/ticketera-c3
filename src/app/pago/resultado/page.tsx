import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { PaymentResultLink } from '@/components/payments/payment-result-link';
import { expirePendingOrderIfOverdue } from '@/features/checkout/wompi/expiry';
import { readOptionalSession } from '@/lib/auth/optional-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Resultado del pago DEMO',
  robots: { index: false, follow: false },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Página a la que Wompi devuelve al comprador. Solo recibe el id de la orden (sin token ni secretos)
 * y muestra el estado que el servidor ya confirmó por webhook. Nunca muestra boletos ni QR.
 */
export default async function PaymentResultPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderParam = Array.isArray(params.orden) ? params.orden[0] : params.orden;
  const client = createServiceRoleClient();

  if (!orderParam || !uuidPattern.test(orderParam) || !client) {
    return <ResultShell title="No encontramos la orden" text="Revisa el enlace o vuelve al sitio." />;
  }

  const { data: order } = await client.from('orders').select('id, status, created_at').eq('id', orderParam).maybeSingle();

  if (!order) {
    return <ResultShell title="No encontramos la orden" text="Revisa el enlace o vuelve al sitio." />;
  }

  const expired = await expirePendingOrderIfOverdue(client, order as { id: string; status: string; created_at: string }, new Date());
  const status = expired ? 'cancelled' : (order.status as string);
  const session = await readOptionalSession();

  if (status === 'confirmed') {
    return (
      <ResultShell
        title="Pago aprobado (DEMO)"
        text="Tu compra quedó confirmada. Te enviamos los boletos por correo electrónico."
      >
        <PaymentResultLink orderId={order.id} signedIn={session !== null} />
      </ResultShell>
    );
  }

  if (status === 'pending') {
    return (
      <ResultShell
        title="Esperando la confirmación de Wompi (DEMO)"
        text="Si ya pagaste, la confirmación puede tardar unos minutos. Actualiza esta página para ver el estado."
      >
        <Link href={`/pago/resultado/?orden=${order.id}`} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
          Actualizar estado
        </Link>
      </ResultShell>
    );
  }

  return (
    <ResultShell
      title="El pago no se completó (DEMO)"
      text="No se emitieron boletos. Puedes volver al evento y hacer una compra nueva."
    >
      <Link href="/" className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
        Volver al sitio
      </Link>
    </ResultShell>
  );
}

function ResultShell({ title, text, children }: Readonly<{ title: string; text: string; children?: React.ReactNode }>) {
  return (
    <section aria-labelledby="payment-result-title" className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6">
      <h1 id="payment-result-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
        {title}
      </h1>
      <p className="font-texto text-base leading-7 text-texto-suave">{text}</p>
      {children ? <div className="flex flex-col gap-3 sm:flex-row">{children}</div> : null}
    </section>
  );
}
