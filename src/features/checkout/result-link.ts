const checkoutTokenPattern = /^[A-Za-z0-9_-]{43}$/;

/** El token solo se lee del sessionStorage del mismo navegador; nunca vuelve desde Wompi en la URL. */
export function paymentResultTicketsHref(orderId: string, storedSession: string | null, signedIn: boolean): string {
  try {
    const session: unknown = JSON.parse(storedSession ?? 'null');
    if (
      typeof session === 'object' && session !== null &&
      'orderId' in session && session.orderId === orderId &&
      'checkoutToken' in session && typeof session.checkoutToken === 'string' &&
      checkoutTokenPattern.test(session.checkoutToken)
    ) {
      return `/confirmacion/${orderId}/${session.checkoutToken}/`;
    }
  } catch {
    // Sin sesión de checkout local, usa el acceso normal a Mis boletos.
  }

  return signedIn ? '/mis-boletos/' : '/ingresar/?next=%2Fmis-boletos%2F';
}
