import { cookies } from 'next/headers';

import { accessCookieName, refreshCookieName } from '@/lib/auth/cookies';

export const runtime = 'nodejs';

/**
 * Indica a la cabecera si el navegador trae una sesión, para mostrar «Mis boletos» y «Mi cuenta».
 * La cabecera vive en el layout de todo el sitio: leer las cookies httpOnly allí volvería dinámicas
 * (y sin caché) las páginas públicas del catálogo, así que la pregunta se hace aquí, desde el navegador.
 *
 * Solo comprueba que existan las cookies; no valida el token ni devuelve datos de la cuenta. Es solo una
 * pista visual: /mis-boletos/ y /cuenta/ siempre validan la sesión y el rol en el servidor (requireRole).
 */
export async function GET() {
  const jar = await cookies();
  const signedIn = Boolean(jar.get(accessCookieName)?.value || jar.get(refreshCookieName)?.value);

  return Response.json({ signedIn }, { headers: { 'cache-control': 'no-store' } });
}
