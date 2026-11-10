import { requiredRoleForPath, signInUrl } from './access';
import type { SessionTokens } from './cookies';

/**
 * Comprobación optimista del proxy: solo mira cookies y, si hace falta, renueva el token.
 * No decide permisos ni jerarquía de roles (buyer < organizer < admin): la página vuelve a validar
 * la sesión y el rol en el servidor con requireRole.
 */

export type GateInput = {
  pathname: string;
  accessToken?: string;
  refreshToken?: string;
};

export type GateResult =
  | { action: 'next'; refreshed?: SessionTokens }
  | { action: 'redirect'; to: string; clearSession: boolean };

export async function gateSession(
  input: GateInput,
  refresh: (refreshToken: string) => Promise<SessionTokens | null>,
): Promise<GateResult> {
  if (!requiredRoleForPath(input.pathname)) {
    return { action: 'next' };
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
