import { isOptionalSessionPath, requiredRoleForPath, signInUrl } from './access';
import type { SessionTokens } from './cookies';

/**
 * Comprobación optimista del proxy: solo mira cookies y, si hace falta, renueva el token.
 * No decide permisos ni jerarquía de roles (buyer < organizer < admin): la página vuelve a validar
 * la sesión y el rol en el servidor con requireRole.
 * En las rutas de sesión opcional (checkout y confirmación) solo renueva el token: nunca redirige.
 */

export type GateInput = {
  pathname: string;
  accessToken?: string;
  refreshToken?: string;
};

export type GateResult =
  | { action: 'next'; refreshed?: SessionTokens; clearSession?: boolean }
  | { action: 'redirect'; to: string; clearSession: boolean };

export async function gateSession(
  input: GateInput,
  refresh: (refreshToken: string) => Promise<SessionTokens | null>,
): Promise<GateResult> {
  if (!requiredRoleForPath(input.pathname)) {
    return isOptionalSessionPath(input.pathname) ? refreshOptionalSession(input, refresh) : { action: 'next' };
  }

  if (input.accessToken) {
    return { action: 'next' };
  }

  if (!input.refreshToken) {
    return { action: 'redirect', to: signInUrl({ next: input.pathname }), clearSession: false };
  }

  const tokens = await refresh(input.refreshToken);

  if (!tokens) {
    return {
      action: 'redirect',
      to: signInUrl({ next: input.pathname, error: 'sesion-expirada' }),
      clearSession: true,
    };
  }

  return { action: 'next', refreshed: tokens };
}

/**
 * Ruta de sesión opcional: con el acceso vencido y una renovación vigente, renueva y deja pasar; si la renovación
 * ya no sirve, limpia las cookies y deja pasar como invitado.
 */
async function refreshOptionalSession(
  input: GateInput,
  refresh: (refreshToken: string) => Promise<SessionTokens | null>,
): Promise<GateResult> {
  if (input.accessToken || !input.refreshToken) {
    return { action: 'next' };
  }

  const tokens = await refresh(input.refreshToken);

  return tokens ? { action: 'next', refreshed: tokens } : { action: 'next', clearSession: true };
}
