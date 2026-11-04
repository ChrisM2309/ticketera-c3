'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  type AppRole,
  homePathFor,
  isAppRole,
  parseLoginInput,
  requiredRoleForPath,
  safeNextPath,
  sessionErrorMessages,
  signInUrl,
  type LoginFieldErrors,
} from '@/lib/auth/access';
import {
  accessCookieName,
  expiredSessionCookies,
  isSecureCookieContext,
  refreshCookieName,
  sessionCookies,
} from '@/lib/auth/cookies';
import {
  readAuthConfig,
  readRole,
  signInWithPassword,
  signOutSession,
} from '@/lib/auth/supabase-auth';

export type SignInState = {
  message?: string;
  email?: string;
  fieldErrors?: LoginFieldErrors;
};

const unavailableMessage = 'El acceso no está disponible en este momento. Intentá más tarde.';
const invalidCredentialsMessage = 'Correo o contraseña incorrectos.';

/** Destino tras ingresar: la ruta pedida si el rol puede verla; si no, la zona de su rol. */
function destinationFor(role: AppRole, requestedPath: string): string {
  return requiredRoleForPath(requestedPath) === role ? requestedPath : homePathFor(role);
}

export async function signInAction(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.slice(0, 254) : '';
  const parsed = parseLoginInput({ email: rawEmail, password: formData.get('password') });

  if (!parsed.valid) {
    return { email, fieldErrors: parsed.errors };
  }

  const config = readAuthConfig();

  if (!config) {
    return { email, message: unavailableMessage };
  }

  const result = await signInWithPassword(config, parsed.email, parsed.password);

  if (!result.ok) {
    return {
      email,
      message: result.reason === 'invalid' ? invalidCredentialsMessage : unavailableMessage,
    };
  }

  let role: string | null;

  try {
    role = await readRole(config, result.tokens.accessToken, result.userId);
  } catch {
    await signOutSession(config, result.tokens);
    return { email, message: 'No pudimos comprobar tu cuenta. Intentá nuevamente.' };
  }

  if (!isAppRole(role)) {
    // Sin perfil con rol no se crea sesión en el navegador.
    await signOutSession(config, result.tokens);
    return { email, message: sessionErrorMessages['sin-rol'] };
  }

  const jar = await cookies();

  for (const cookie of sessionCookies(result.tokens, isSecureCookieContext())) {
    jar.set(cookie.name, cookie.value, cookie.options);
  }

  const requested = safeNextPath(formData.get('next'), '');

  redirect(destinationFor(role, requested));
}

export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  const accessToken = jar.get(accessCookieName)?.value;
  const refreshToken = jar.get(refreshCookieName)?.value;
  const config = readAuthConfig();

  if (config && accessToken && refreshToken) {
    await signOutSession(config, { accessToken, refreshToken });
  }

  for (const cookie of expiredSessionCookies(isSecureCookieContext())) {
    jar.set(cookie.name, cookie.value, cookie.options);
  }

  redirect(signInUrl());
}
