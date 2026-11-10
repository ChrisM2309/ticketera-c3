import 'server-only';

import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

import { accessCookieName } from './cookies';
import { createAuthClient, readAuthConfig, userFromAccessToken } from './supabase-auth';

export type OptionalSession = {
  userId: string;
  email: string | null;
  /** Cliente con el token del usuario: sus consultas pasan por RLS. */
  client: SupabaseClient;
};

/**
 * Sesión opcional para páginas públicas (checkout y confirmación): devuelve la cuenta si las cookies traen un
 * token válido y `null` en cualquier otro caso. Nunca redirige ni lanza: comprar como invitado sigue siendo
 * posible. El id de usuario sale solo de la cookie httpOnly validada contra Auth, jamás del cuerpo de una petición.
 */
export async function readOptionalSession(): Promise<OptionalSession | null> {
  try {
    const config = readAuthConfig();
    const accessToken = (await cookies()).get(accessCookieName)?.value;

    if (!config || !accessToken) {
      return null;
    }

    const user = await userFromAccessToken(config, accessToken);

    return user ? { userId: user.id, email: user.email, client: createAuthClient(config, accessToken) } : null;
  } catch {
    return null;
  }
}
