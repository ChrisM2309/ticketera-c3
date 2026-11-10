/**
 * Reglas puras de acceso: qué rol entra a cada zona privada y a dónde se redirige.
 * No importa nada de Next ni de Supabase, para poder probarlas en `tests/unit`.
 */

import { safeNextPath } from './next-path';

export { safeNextPath };

/** De menor a mayor privilegio: cada rol entra a las zonas del rol anterior. */
export const appRoles = ['buyer', 'organizer', 'admin'] as const;

export type AppRole = (typeof appRoles)[number];

export const signInPath = '/ingresar/';
export const buyerHomePath = '/mis-boletos/';
export const accountPath = '/cuenta/';
export const organizerHomePath = '/panel/';
export const adminHomePath = '/admin/';

export const sessionErrorCodes = ['sesion-expirada', 'sin-rol'] as const;

export type SessionErrorCode = (typeof sessionErrorCodes)[number];

/**
 * Cada zona privada declara el rol mínimo que la abre. La jerarquía es comprador < organizador < administrador:
 * organizador y administrador también entran a /mis-boletos/ y /cuenta/, el administrador también a /panel/,
 * y solo el administrador entra a /admin/.
 */
const zoneRoles: readonly { prefix: string; role: AppRole }[] = [
  { prefix: buyerHomePath, role: 'buyer' },
  { prefix: accountPath, role: 'buyer' },
  { prefix: organizerHomePath, role: 'organizer' },
  { prefix: adminHomePath, role: 'admin' },
];

export function requiredRoleForPath(pathname: string): AppRole | null {
  const zone = zoneRoles.find(
    ({ prefix }) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );

  return zone ? zone.role : null;
}

/**
 * Rutas públicas que leen la sesión de forma opcional (checkout, confirmación y la API de órdenes): no exigen
 * ingresar, pero el proxy renueva el token vencido para que un comprador con cuenta no se trate como invitado.
 */
const optionalSessionPrefixes = ['/checkout/', '/confirmacion/', '/api/checkout/'] as const;

export function isOptionalSessionPath(pathname: string): boolean {
  return optionalSessionPrefixes.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (appRoles as readonly string[]).includes(value);
}

/** Zona por defecto de cada rol tras ingresar. */
export function landingPathForRole(role: AppRole): string {
  if (role === 'admin') {
    return adminHomePath;
  }

  return role === 'organizer' ? organizerHomePath : buyerHomePath;
}

/** `true` si `role` alcanza el rol mínimo `required` de una zona. */
export function roleSatisfies(role: AppRole, required: AppRole): boolean {
  return appRoles.indexOf(role) >= appRoles.indexOf(required);
}

/** Destino tras ingresar: la ruta pedida si es interna y el rol puede verla; si no, la zona del rol. */
export function destinationAfterSignIn(role: AppRole, requested: unknown): string {
  const landing = landingPathForRole(role);
  const path = safeNextPath(requested, landing);
  const required = requiredRoleForPath(path);

  return required && !roleSatisfies(role, required) ? landing : path;
}

export type AccessDecision = { action: 'allow' } | { action: 'sign-in' } | { action: 'redirect'; to: string };

/**
 * Decide qué hacer con una petición a una zona privada cuyo rol mínimo es `required`.
 * `role` debe venir de `profiles` leído en el servidor con la sesión del usuario, nunca del navegador.
 */
export function decideAccess(input: {
  required: AppRole;
  hasSession: boolean;
  role: string | null;
}): AccessDecision {
  if (!input.hasSession) {
    return { action: 'sign-in' };
  }

  if (!isAppRole(input.role)) {
    return { action: 'redirect', to: signInUrl({ error: 'sin-rol' }) };
  }

  if (!roleSatisfies(input.role, input.required)) {
    return { action: 'redirect', to: landingPathForRole(input.role) };
  }

  return { action: 'allow' };
}

export function signInUrl(options: { next?: string; error?: SessionErrorCode } = {}): string {
  const params = new URLSearchParams();

  if (options.next) {
    params.set('next', options.next);
  }

  if (options.error) {
    params.set('error', options.error);
  }

  const query = params.toString();

  return query ? `${signInPath}?${query}` : signInPath;
}

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type LoginInput = { valid: true; email: string; password: string } | { valid: false; errors: LoginFieldErrors };

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Valida el formulario de acceso en el servidor. La contraseña no se recorta ni se normaliza. */
export function parseLoginInput(input: { email: unknown; password: unknown }): LoginInput {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const errors: LoginFieldErrors = {};

  if (email.length < 5 || email.length > 254 || !emailPattern.test(email)) {
    errors.email = 'Ingresá un correo electrónico válido.';
  }

  if (password.length === 0 || password.length > 256) {
    errors.password = 'Ingresá tu contraseña.';
  }

  if (errors.email || errors.password) {
    return { valid: false, errors };
  }

  return { valid: true, email, password };
}

export const sessionErrorMessages: Record<SessionErrorCode, string> = {
  'sesion-expirada': 'Tu sesión venció. Ingresá de nuevo para continuar.',
  'sin-rol': 'Tu cuenta no tiene acceso a esta zona. Si crees que es un error, escribí a la organización del sitio.',
};

export function readSessionError(value: unknown): SessionErrorCode | null {
  return typeof value === 'string' && (sessionErrorCodes as readonly string[]).includes(value)
    ? (value as SessionErrorCode)
    : null;
}
