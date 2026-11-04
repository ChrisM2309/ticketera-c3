/**
 * Reglas puras de acceso: qué rol entra a cada zona privada y a dónde se redirige.
 * No importa nada de Next ni de Supabase, para poder probarlas en `tests/unit`.
 */

export const appRoles = ['organizer', 'admin'] as const;

export type AppRole = (typeof appRoles)[number];

export const signInPath = '/ingresar/';
export const organizerHomePath = '/panel/';
export const adminHomePath = '/admin/';

export const sessionErrorCodes = ['sesion-expirada', 'sin-rol'] as const;

export type SessionErrorCode = (typeof sessionErrorCodes)[number];

/** Cada zona privada admite un único rol: un organizador no entra a /admin/ y el admin no usa /panel/. */
const zoneRoles: readonly { prefix: string; role: AppRole }[] = [
  { prefix: organizerHomePath, role: 'organizer' },
  { prefix: adminHomePath, role: 'admin' },
];

export function requiredRoleForPath(pathname: string): AppRole | null {
  const zone = zoneRoles.find(
    ({ prefix }) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );

  return zone ? zone.role : null;
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (appRoles as readonly string[]).includes(value);
}

export function homePathFor(role: AppRole): string {
  return role === 'admin' ? adminHomePath : organizerHomePath;
}

export type AccessDecision = { action: 'allow' } | { action: 'sign-in' } | { action: 'redirect'; to: string };

/**
 * Decide qué hacer con una petición a una zona privada.
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

  if (input.role !== input.required) {
    return { action: 'redirect', to: homePathFor(input.role) };
  }

  return { action: 'allow' };
}

/**
 * Acepta solo rutas internas del propio sitio (evita redirecciones abiertas).
 * Cualquier otro valor cae en el destino por defecto.
 */
export function safeNextPath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.length > 200) {
    return fallback;
  }

  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }

  if (/[\u0000-\u001f\u007f\\]/.test(value)) {
    return fallback;
  }

  return value;
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
