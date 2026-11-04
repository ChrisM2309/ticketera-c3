import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { SessionTokens } from './cookies';

/**
 * Llamadas a Supabase Auth y a `profiles` desde el servidor. Solo usan la clave anon;
 * el usuario se identifica con su propio token, así RLS limita lo que puede leer.
 * Nunca se usa `service_role` aquí.
 */

export type AuthConfig = { url: string; anonKey: string };

export function readAuthConfig(): AuthConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && anonKey ? { url, anonKey } : null;
}

export function createAuthClient(config: AuthConfig, accessToken?: string): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

export type PasswordSignInResult =
  | { ok: true; userId: string; tokens: SessionTokens }
  | { ok: false; reason: 'invalid' | 'unavailable' };

export async function signInWithPassword(config: AuthConfig, email: string, password: string): Promise<PasswordSignInResult> {
  try {
    const { data, error } = await createAuthClient(config).auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      // Auth responde 400 para credenciales incorrectas; otros fallos son de disponibilidad.
      const invalid = error?.status === 400 || error?.status === 401 || error?.status === 422;

      return { ok: false, reason: invalid || !error ? 'invalid' : 'unavailable' };
    }

    return {
      ok: true,
      userId: data.user.id,
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function refreshSessionTokens(config: AuthConfig, refreshToken: string): Promise<SessionTokens | null> {
  try {
    const { data, error } = await createAuthClient(config).auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  } catch {
    return null;
  }
}

/** Valida el token contra Supabase Auth (no basta con leer la cookie). */
export async function userIdFromAccessToken(config: AuthConfig, accessToken: string): Promise<string | null> {
  try {
    const { data, error } = await createAuthClient(config).auth.getUser(accessToken);

    return error || !data.user ? null : data.user.id;
  } catch {
    return null;
  }
}

/**
 * Rol del usuario leído con su propia sesión: RLS solo devuelve su fila (o la de cualquiera si es admin).
 * Devuelve null si no hay perfil. Lanza error si la consulta falla, para no confundirlo con "sin rol".
 */
export async function readRole(config: AuthConfig, accessToken: string, userId: string): Promise<string | null> {
  const { data, error } = await createAuthClient(config, accessToken)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error('No se pudo leer el rol del usuario.');
  }

  return typeof data?.role === 'string' ? data.role : null;
}

/** Cierre de sesión best effort: si Auth no responde, las cookies igualmente se borran. */
export async function signOutSession(config: AuthConfig, tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  try {
    const client = createAuthClient(config);

    await client.auth.setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
    await client.auth.signOut();
  } catch {
    // Sin efecto para el usuario: la cookie se borra de todos modos.
  }
}
