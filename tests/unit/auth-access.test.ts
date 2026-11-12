import { describe, expect, it } from 'vitest';

import {
  decideAccess,
  accountPanelLinksForRole,
  destinationAfterSignIn,
  isOptionalSessionPath,
  landingPathForRole,
  parseLoginInput,
  readSessionError,
  requiredRoleForPath,
  safeNextPath,
  signInUrl,
} from '../../src/lib/auth/access';
import { config as proxyConfig } from '../../src/proxy';
import { gateSession } from '../../src/lib/auth/session-gate';
import type { SessionTokens } from '../../src/lib/auth/cookies';

describe('zonas privadas', () => {
  it('asigna el rol mínimo de las zonas del comprador', () => {
    expect(requiredRoleForPath('/mis-boletos/')).toBe('buyer');
    expect(requiredRoleForPath('/mis-boletos')).toBe('buyer');
    expect(requiredRoleForPath('/mis-boletos/abc/')).toBe('buyer');
    expect(requiredRoleForPath('/cuenta/')).toBe('buyer');
    expect(requiredRoleForPath('/cuenta/datos/')).toBe('buyer');
    expect(requiredRoleForPath('/cuentas/')).toBeNull();
  });

  it('asigna un único rol a cada zona', () => {
    expect(requiredRoleForPath('/panel/')).toBe('organizer');
    expect(requiredRoleForPath('/panel')).toBe('organizer');
    expect(requiredRoleForPath('/panel/eventos/')).toBe('organizer');
    expect(requiredRoleForPath('/admin/')).toBe('admin');
    expect(requiredRoleForPath('/admin/eventos/')).toBe('admin');
  });

  it('no trata como privadas rutas que solo empiezan igual', () => {
    expect(requiredRoleForPath('/panelista/')).toBeNull();
    expect(requiredRoleForPath('/administracion/')).toBeNull();
    expect(requiredRoleForPath('/ingresar/')).toBeNull();
    expect(requiredRoleForPath('/')).toBeNull();
  });
});

describe('decisión de acceso', () => {
  it('ofrece en Mi cuenta solo los paneles permitidos para cada rol', () => {
    expect(accountPanelLinksForRole('buyer')).toEqual([]);
    expect(accountPanelLinksForRole('organizer')).toEqual([
      { href: '/panel/', label: 'Panel del organizador' },
    ]);
    expect(accountPanelLinksForRole('admin')).toEqual([
      { href: '/admin/', label: 'Panel de administración' },
      { href: '/panel/', label: 'Panel del organizador' },
    ]);
  });

  it('pide ingresar sin sesión, aunque el rol sea válido', () => {
    expect(decideAccess({ required: 'organizer', hasSession: false, role: 'organizer' })).toEqual({
      action: 'sign-in',
    });
  });

  it('deja pasar al rol que corresponde a la zona', () => {
    expect(decideAccess({ required: 'organizer', hasSession: true, role: 'organizer' })).toEqual({ action: 'allow' });
    expect(decideAccess({ required: 'admin', hasSession: true, role: 'admin' })).toEqual({ action: 'allow' });
  });

  it('envía a un organizador fuera de /admin/ a su panel', () => {
    expect(decideAccess({ required: 'admin', hasSession: true, role: 'organizer' })).toEqual({
      action: 'redirect',
      to: '/panel/',
    });
  });

  it('el administrador también entra a /panel/', () => {
    expect(decideAccess({ required: 'organizer', hasSession: true, role: 'admin' })).toEqual({ action: 'allow' });
  });

  it('comprador no entra a /panel/ ni /admin/', () => {
    expect(decideAccess({ required: 'organizer', hasSession: true, role: 'buyer' })).toEqual({
      action: 'redirect',
      to: '/mis-boletos/',
    });
    expect(decideAccess({ required: 'admin', hasSession: true, role: 'buyer' })).toEqual({
      action: 'redirect',
      to: '/mis-boletos/',
    });
  });

  it('comprador entra a /mis-boletos/', () => {
    expect(decideAccess({ required: 'buyer', hasSession: true, role: 'buyer' })).toEqual({ action: 'allow' });
  });

  it('organizador y administrador entran a /mis-boletos/ y /cuenta/', () => {
    expect(decideAccess({ required: 'buyer', hasSession: true, role: 'organizer' })).toEqual({ action: 'allow' });
    expect(decideAccess({ required: 'buyer', hasSession: true, role: 'admin' })).toEqual({ action: 'allow' });
  });

  it('no concede acceso sin perfil o con un rol desconocido', () => {
    expect(decideAccess({ required: 'organizer', hasSession: true, role: null })).toEqual({
      action: 'redirect',
      to: '/ingresar/?error=sin-rol',
    });
    expect(decideAccess({ required: 'admin', hasSession: true, role: 'comprador' })).toEqual({
      action: 'redirect',
      to: '/ingresar/?error=sin-rol',
    });
  });

  it('landingPathForRole por rol', () => {
    expect(landingPathForRole('buyer')).toBe('/mis-boletos/');
    expect(landingPathForRole('organizer')).toBe('/panel/');
    expect(landingPathForRole('admin')).toBe('/admin/');
  });
});

describe('destino tras ingresar', () => {
  it('respeta una ruta pública o de una zona que el rol puede ver', () => {
    expect(destinationAfterSignIn('buyer', '/checkout/')).toBe('/checkout/');
    expect(destinationAfterSignIn('buyer', '/cuenta/')).toBe('/cuenta/');
    expect(destinationAfterSignIn('admin', '/panel/')).toBe('/panel/');
  });

  it('usa la zona del rol si la ruta pedida le queda fuera o falta', () => {
    expect(destinationAfterSignIn('buyer', '/admin/')).toBe('/mis-boletos/');
    expect(destinationAfterSignIn('organizer', '/admin/')).toBe('/panel/');
    expect(destinationAfterSignIn('admin', null)).toBe('/admin/');
  });

  it('descarta destinos externos', () => {
    expect(destinationAfterSignIn('buyer', '//evil.com')).toBe('/mis-boletos/');
  });
});

describe('redirecciones internas', () => {
  const fallback = '/panel/';

  it('conserva rutas internas válidas', () => {
    expect(safeNextPath('/panel/', fallback)).toBe('/panel/');
    expect(safeNextPath('/admin/', fallback)).toBe('/admin/');
  });

  it.each([
    ['URL absoluta', 'https://evil.example/'],
    ['ruta de red', '//evil.example/'],
    ['barra invertida', '/\\evil.example'],
    ['salto de línea', '/panel/\r\nLocation: https://evil.example'],
    ['sin barra inicial', 'panel/'],
    ['no es texto', 42],
    ['demasiado largo', `/${'a'.repeat(250)}`],
  ])('rechaza %s', (_label, value) => {
    expect(safeNextPath(value, fallback)).toBe(fallback);
  });

  it('arma la URL de ingreso con parámetros codificados', () => {
    expect(signInUrl()).toBe('/ingresar/');
    expect(signInUrl({ next: '/admin/' })).toBe('/ingresar/?next=%2Fadmin%2F');
    expect(signInUrl({ error: 'sesion-expirada' })).toBe('/ingresar/?error=sesion-expirada');
  });

  it('solo acepta códigos de error conocidos', () => {
    expect(readSessionError('sin-rol')).toBe('sin-rol');
    expect(readSessionError('otro')).toBeNull();
    expect(readSessionError(['sin-rol'])).toBeNull();
  });
});

describe('validación del acceso', () => {
  it('normaliza el correo y no recorta la contraseña', () => {
    expect(parseLoginInput({ email: '  Organizador@Example.test ', password: ' clave ' })).toEqual({
      valid: true,
      email: 'organizador@example.test',
      password: ' clave ',
    });
  });

  it('marca cada campo inválido sin revelar cuál cuenta existe', () => {
    expect(parseLoginInput({ email: 'no-es-correo', password: '' })).toEqual({
      valid: false,
      errors: {
        email: 'Ingresa un correo electrónico válido.',
        password: 'Ingresa tu contraseña.',
      },
    });
  });

  it('rechaza entradas que no son texto o exceden el límite', () => {
    expect(parseLoginInput({ email: undefined, password: 'x' })).toMatchObject({
      valid: false,
      errors: { email: 'Ingresa un correo electrónico válido.' },
    });
    expect(parseLoginInput({ email: 'a@b.test', password: 'x'.repeat(257) })).toMatchObject({
      valid: false,
      errors: { password: 'Ingresa tu contraseña.' },
    });
  });
});

describe('comprobación optimista del proxy', () => {
  const tokens: SessionTokens = { accessToken: 'nuevo-acceso', refreshToken: 'nueva-renovacion', expiresIn: 3600 };
  const noRefresh = async () => {
    throw new Error('no debe renovar');
  };

  it('no toca rutas públicas', async () => {
    await expect(gateSession({ pathname: '/ingresar/' }, noRefresh)).resolves.toEqual({ action: 'next' });
  });

  it('deja pasar con token de acceso sin consultar la red', async () => {
    await expect(
      gateSession({ pathname: '/panel/', accessToken: 'acceso' }, noRefresh),
    ).resolves.toEqual({ action: 'next' });
  });

  it('manda a ingresar sin ninguna cookie y recuerda la ruta', async () => {
    await expect(gateSession({ pathname: '/admin/' }, noRefresh)).resolves.toEqual({
      action: 'redirect',
      to: '/ingresar/?next=%2Fadmin%2F',
      clearSession: false,
    });
  });

  it('renueva con la cookie de renovación cuando falta el acceso', async () => {
    const calls: string[] = [];
    const result = await gateSession({ pathname: '/panel/', refreshToken: 'renovacion' }, async (token) => {
      calls.push(token);
      return tokens;
    });

    expect(calls).toEqual(['renovacion']);
    expect(result).toEqual({ action: 'next', refreshed: tokens });
  });

  it('si la renovación falla, pide ingresar y limpia la sesión', async () => {
    await expect(
      gateSession({ pathname: '/panel/', refreshToken: 'caducada' }, async () => null),
    ).resolves.toEqual({
      action: 'redirect',
      to: '/ingresar/?next=%2Fpanel%2F&error=sesion-expirada',
      clearSession: true,
    });
  });

  describe('rutas de sesión opcional', () => {
    const optionalPaths = ['/checkout/', '/confirmacion/abc/token/', '/api/checkout/orders/'];

    it('reconoce checkout, confirmación y la API de órdenes sin exigir rol', () => {
      for (const path of optionalPaths) {
        expect(isOptionalSessionPath(path)).toBe(true);
        expect(requiredRoleForPath(path)).toBeNull();
      }

      expect(isOptionalSessionPath('/')).toBe(false);
      expect(isOptionalSessionPath('/eventos/')).toBe(false);
    });

    it('el proxy las incluye en su matcher', () => {
      expect(proxyConfig.matcher).toEqual(
        expect.arrayContaining(['/checkout/:path*', '/confirmacion/:path*', '/api/checkout/:path*']),
      );
    });

    it('renueva el token vencido para que el comprador con cuenta no pase por invitado', async () => {
      for (const pathname of optionalPaths) {
        const result = await gateSession({ pathname, refreshToken: 'renovacion' }, async () => tokens);

        expect(result).toEqual({ action: 'next', refreshed: tokens });
      }
    });

    it('con token de acceso o sin cookies no consulta la red', async () => {
      await expect(gateSession({ pathname: '/checkout/', accessToken: 'acceso' }, noRefresh)).resolves.toEqual({
        action: 'next',
      });
      await expect(gateSession({ pathname: '/checkout/' }, noRefresh)).resolves.toEqual({ action: 'next' });
    });

    it('si la renovación falla sigue como invitado: no redirige y limpia las cookies', async () => {
      await expect(
        gateSession({ pathname: '/confirmacion/abc/token/', refreshToken: 'caducada' }, async () => null),
      ).resolves.toEqual({ action: 'next', clearSession: true });
    });
  });
});
