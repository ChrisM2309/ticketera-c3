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
  signInPath,
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
  requestPasswordReset,
  signInWithPassword,
  signOutSession,
  signUpWithPassword,
  updatePasswordWithRecovery,
} from '@/lib/auth/supabase-auth';
import { siteConfig } from '@/lib/site-config';

import {
  buyerLandingPath,
  recoverNewPasswordPath,
  resetRequestedMessage,
  validateNewPassword,
  validateRegistration,
  type RegistrationErrors,
} from './validation';

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

export type RegisterState = {
  message?: string;
  /** `confirm-email`: la cuenta se creó y falta confirmar el correo; se muestra un aviso, no un error. */
  notice?: 'confirm-email';
  email?: string;
  displayName?: string;
  fieldErrors?: RegistrationErrors;
};

export async function registerAction(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const rawEmail = formData.get('email');
  const rawName = formData.get('displayName');
  const email = typeof rawEmail === 'string' ? rawEmail.slice(0, 254) : '';
  const displayName = typeof rawName === 'string' ? rawName.slice(0, 80) : '';
  const parsed = validateRegistration({
    email: rawEmail,
    password: formData.get('password'),
    displayName: rawName,
    // La casilla enviada llega como «on»; cualquier otra cosa cuenta como no aceptada.
    acceptsPrivacy: formData.get('acceptsPrivacy') === 'on',
  });

  if (!parsed.valid) {
    return { email, displayName, fieldErrors: parsed.errors };
  }

  const result = await signUpWithPassword(parsed.data, {
    emailRedirectTo: new URL(signInPath, siteConfig.siteUrl).toString(),
  });

  if (result.status === 'error') {
    return { email, displayName, message: result.message };
  }

  if (result.status === 'confirm-email') {
    return { notice: 'confirm-email', email: parsed.data.email };
  }

  const jar = await cookies();

  for (const cookie of sessionCookies(result.tokens, isSecureCookieContext())) {
    jar.set(cookie.name, cookie.value, cookie.options);
  }

  redirect(safeNextPath(formData.get('next'), buyerLandingPath));
}

export type RequestResetState = {
  message?: string;
  email?: string;
  fieldError?: string;
  sent?: boolean;
};

export async function requestResetAction(_previous: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.slice(0, 254) : '';
  // Solo se valida el formato: la respuesta no depende de que el correo exista.
  const parsed = parseLoginInput({ email: rawEmail, password: 'x' });

  if (!parsed.valid) {
    return { email, fieldError: parsed.errors.email ?? 'Ingresá un correo electrónico válido.' };
  }

  await requestPasswordReset(parsed.email, {
    redirectTo: new URL(recoverNewPasswordPath, siteConfig.siteUrl).toString(),
  });

  return { email, sent: true, message: resetRequestedMessage };
}

export type NewPasswordState = {
  message?: string;
  fieldError?: string;
  done?: boolean;
};

const expiredLinkMessage = 'El enlace venció o ya se usó. Pedí uno nuevo desde «Recuperar contraseña».';

export async function setNewPasswordAction(_previous: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const rawToken = formData.get('accessToken');
  const accessToken = typeof rawToken === 'string' && rawToken.length <= 4096 ? rawToken : '';
  const parsed = validateNewPassword({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.valid) {
    return { fieldError: parsed.error };
  }

  if (!accessToken) {
    return { message: expiredLinkMessage };
  }

  const result = await updatePasswordWithRecovery(accessToken, parsed.data.password);

  if (!result.ok) {
    return { message: expiredLinkMessage };
  }

  return { done: true };
}
