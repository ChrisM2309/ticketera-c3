import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { RegistrationInput } from '@/features/auth/validation';

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

export type SignUpResult =
  | { status: 'signed-in'; userId: string; tokens: SessionTokens }
  | { status: 'confirm-email' }
  | { status: 'error'; message: string };

const signUpFailedMessage =
  'No pudimos crear la cuenta con esos datos. Si ya tenés una, ingresá o recuperá tu contraseña.';
const signUpUnavailableMessage = 'El registro no está disponible en este momento. Intentá más tarde.';
const signUpRateLimitedMessage = 'Hubo demasiados intentos. Esperá unos minutos y volvé a intentar.';

/**
 * Crea la cuenta de comprador. El rol lo fija el disparador de la base de datos (`buyer`);
 * aquí no se envía rol ni se lee de metadatos. Con la confirmación de correo activada Auth no
 * devuelve sesión (`confirm-email`); desactivada, devuelve sesión y la cuenta queda iniciada.
 * Un correo ya registrado nunca se distingue de uno nuevo cuando la confirmación está activada.
 */
export async function signUpWithPassword(
  input: RegistrationInput,
  options: { emailRedirectTo?: string } = {},
): Promise<SignUpResult> {
  const config = readAuthConfig();

  if (!config) {
    return { status: 'error', message: signUpUnavailableMessage };
  }

  try {
    const { data, error } = await createAuthClient(config).auth.signUp({
      email: input.email,
      password: input.password,
      options: { emailRedirectTo: options.emailRedirectTo, data: { display_name: input.displayName } },
    });

    if (error) {
      if (error.status === 429) {
        return { status: 'error', message: signUpRateLimitedMessage };
      }

      const rejected = error.status !== undefined && error.status >= 400 && error.status < 500;

      return { status: 'error', message: rejected ? signUpFailedMessage : signUpUnavailableMessage };
    }

    if (!data.session || !data.user) {
      return { status: 'confirm-email' };
    }

    const tokens: SessionTokens = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };

    // El disparador deriva el nombre del correo; con sesión inmediata se corrige con el que escribió.
    // Es mejor esfuerzo: si falla, el comprador puede cambiarlo luego en su cuenta.
    try {
      await createAuthClient(config, tokens.accessToken)
        .from('profiles')
        .update({ display_name: input.displayName })
        .eq('id', data.user.id);
    } catch {
      // Sin efecto para el registro.
    }

    return { status: 'signed-in', userId: data.user.id, tokens };
  } catch {
    return { status: 'error', message: signUpUnavailableMessage };
  }
}

/**
 * Pide el correo de recuperación. No devuelve nada a propósito: ni un error de Auth ni un fallo de red
 * se muestran, para que la respuesta sea idéntica exista o no el correo.
 */
export async function requestPasswordReset(email: string, options: { redirectTo?: string } = {}): Promise<void> {
  const config = readAuthConfig();

  if (!config) {
    return;
  }

  try {
    await createAuthClient(config).auth.resetPasswordForEmail(email, { redirectTo: options.redirectTo });
  } catch {
    // Misma respuesta para el usuario.
  }
}

/**
 * Cambia la contraseña con el token de recuperación del enlace del correo. Se llama a la API REST de
 * Auth con ese token porque el cliente no guarda sesión (`persistSession: false`) y `updateUser` la exige.
 */
export async function updatePasswordWithRecovery(accessToken: string, password: string): Promise<{ ok: boolean }> {
  const config = readAuthConfig();

  if (!config || !accessToken) {
    return { ok: false };
  }

  try {
    const response = await fetch(`${config.url.replace(/\/+$/, '')}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
      cache: 'no-store',
    });

    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}
