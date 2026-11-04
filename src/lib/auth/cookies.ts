/**
 * Cookies de sesión. Los tokens viven solo en cookies httpOnly: el navegador
 * no los lee con JavaScript y el cliente de la aplicación nunca los recibe.
 */

export const accessCookieName = 'ticketera_sesion';
export const refreshCookieName = 'ticketera_renovacion';

/** La renovación dura lo que una sesión de organizador típica; el acceso caduca con su token. */
const refreshMaxAgeSeconds = 60 * 60 * 24 * 30;

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
};

export type SessionCookie = {
  name: string;
  value: string;
  options: SessionCookieOptions;
};

export function cookieOptions(maxAge: number, secure: boolean): SessionCookieOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge };
}

export function sessionCookies(tokens: SessionTokens, secure: boolean): SessionCookie[] {
  const accessMaxAge = Math.max(1, Math.floor(tokens.expiresIn));

  return [
    { name: accessCookieName, value: tokens.accessToken, options: cookieOptions(accessMaxAge, secure) },
    { name: refreshCookieName, value: tokens.refreshToken, options: cookieOptions(refreshMaxAgeSeconds, secure) },
  ];
}

/** Borra ambas cookies con las mismas opciones que las creó (maxAge 0). */
export function expiredSessionCookies(secure: boolean): SessionCookie[] {
  return [accessCookieName, refreshCookieName].map((name) => ({
    name,
    value: '',
    options: cookieOptions(0, secure),
  }));
}

/** En producción las cookies solo viajan por HTTPS; en desarrollo local (http) siguen funcionando. */
export function isSecureCookieContext(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Cabecera `Cookie` para la petición que llega a la página tras una renovación en el proxy:
 * así la página ve el token nuevo en esa misma petición, no solo en la siguiente.
 */
export function mergeCookieHeader(
  existing: readonly { name: string; value: string }[],
  updates: readonly { name: string; value: string }[],
): string {
  const values = new Map(existing.map((cookie) => [cookie.name, cookie.value]));

  for (const update of updates) {
    values.set(update.name, update.value);
  }

  return [...values].map(([name, value]) => `${name}=${value}`).join('; ');
}
