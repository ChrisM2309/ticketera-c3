import type { Metadata } from 'next';

import { CheckoutPage, type CheckoutAccount } from '@/components/checkout/checkout-page';
import { readOptionalSession } from '@/lib/auth/optional-session';

export const metadata: Metadata = {
  title: 'Checkout DEMO',
  robots: { index: false, follow: false },
};

/** Nombre y correo de la cuenta con sesión, para precargar el formulario. Sin sesión (o sin correo) es invitado. */
async function loadCheckoutAccount(): Promise<CheckoutAccount | null> {
  const session = await readOptionalSession();

  if (!session?.email) {
    return null;
  }

  // Mejor esfuerzo: sin nombre en el perfil el comprador lo escribe.
  let name = '';

  try {
    const { data } = await session.client.from('profiles').select('display_name').eq('id', session.userId).maybeSingle();
    name = typeof data?.display_name === 'string' ? data.display_name : '';
  } catch {
    // Se queda el nombre vacío.
  }

  return { name, email: session.email };
}

export default async function CheckoutRoute() {
  // Leer las cookies hace dinámica esta ruta: es correcto, el checkout es privado y no se indexa.
  return <CheckoutPage account={await loadCheckoutAccount()} />;
}
