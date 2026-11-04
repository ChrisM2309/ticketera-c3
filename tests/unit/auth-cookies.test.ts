import { describe, expect, it } from 'vitest';

import {
  accessCookieName,
  expiredSessionCookies,
  mergeCookieHeader,
  refreshCookieName,
  sessionCookies,
} from '../../src/lib/auth/cookies';

const tokens = { accessToken: 'token-acceso', refreshToken: 'token-renovacion', expiresIn: 3600.9 };

describe('cookies de sesión', () => {
  it('guarda ambos tokens solo en cookies httpOnly y de origen propio', () => {
    const cookies = sessionCookies(tokens, false);

    expect(cookies.map((cookie) => cookie.name)).toEqual([accessCookieName, refreshCookieName]);
    for (const cookie of cookies) {
      expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: false });
    }
  });

  it('caduca el acceso con su token y la renovación a los 30 días', () => {
    const [access, refresh] = sessionCookies(tokens, false);

    expect(access.options.maxAge).toBe(3600);
    expect(refresh.options.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it('marca las cookies como secure cuando el sitio se sirve en producción', () => {
    expect(sessionCookies(tokens, true).every((cookie) => cookie.options.secure)).toBe(true);
  });

  it('nunca deja un maxAge de cero por error al crear la sesión', () => {
    const [access] = sessionCookies({ ...tokens, expiresIn: 0 }, false);

    expect(access.options.maxAge).toBe(1);
  });

  it('borra ambas cookies con las mismas opciones de seguridad', () => {
    const expired = expiredSessionCookies(true);

    expect(expired.map((cookie) => cookie.name)).toEqual([accessCookieName, refreshCookieName]);
    for (const cookie of expired) {
      expect(cookie).toMatchObject({ value: '', options: { maxAge: 0, httpOnly: true, secure: true, path: '/' } });
    }
  });
});

describe('cabecera Cookie tras renovar', () => {
  it('sustituye los valores renovados y conserva el resto', () => {
    const header = mergeCookieHeader(
      [
        { name: accessCookieName, value: 'viejo' },
        { name: refreshCookieName, value: 'renovacion-vieja' },
        { name: 'otra', value: 'x' },
      ],
      sessionCookies(tokens, false),
    );

    expect(header).toBe(`${accessCookieName}=token-acceso; ${refreshCookieName}=token-renovacion; otra=x`);
  });

  it('añade las cookies nuevas cuando no existían', () => {
    expect(mergeCookieHeader([], [{ name: accessCookieName, value: 'nuevo' }])).toBe(`${accessCookieName}=nuevo`);
  });
});
