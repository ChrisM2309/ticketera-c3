import { NextResponse, type NextRequest } from 'next/server';

import {
  accessCookieName,
  expiredSessionCookies,
  isSecureCookieContext,
  mergeCookieHeader,
  refreshCookieName,
  sessionCookies,
} from '@/lib/auth/cookies';
import { gateSession } from '@/lib/auth/session-gate';
import { readAuthConfig, refreshSessionTokens } from '@/lib/auth/supabase-auth';

/** Solo las zonas privadas pasan por el proxy; el resto del sitio no paga esta comprobación. */
export async function proxy(request: NextRequest) {
  const config = readAuthConfig();
  const secure = isSecureCookieContext();

  const result = await gateSession(
    {
      pathname: request.nextUrl.pathname,
      accessToken: request.cookies.get(accessCookieName)?.value,
      refreshToken: request.cookies.get(refreshCookieName)?.value,
    },
    (refreshToken) => (config ? refreshSessionTokens(config, refreshToken) : Promise.resolve(null)),
  );

  if (result.action === 'redirect') {
    const response = NextResponse.redirect(new URL(result.to, request.url));

    if (result.clearSession) {
      for (const cookie of expiredSessionCookies(secure)) {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      }
    }

    return response;
  }

  if (!result.refreshed) {
    return NextResponse.next();
  }

  const cookies = sessionCookies(result.refreshed, secure);
  const headers = new Headers(request.headers);
  headers.set('cookie', mergeCookieHeader(request.cookies.getAll(), cookies));

  const response = NextResponse.next({ request: { headers } });

  for (const cookie of cookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}

export const config = {
  matcher: ['/panel/:path*', '/admin/:path*'],
};
