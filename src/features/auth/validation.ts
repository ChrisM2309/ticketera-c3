/**
 * Validación pura de los formularios de cuenta (registro y nueva contraseña).
 * No importa nada de Next ni de Supabase: se prueba en `tests/unit` y se repite en el servidor,
 * porque las Server Actions también se pueden invocar con un POST directo.
 */

export type RegistrationInput = {
  email: string;
  password: string;
  displayName: string;
  acceptsPrivacy: boolean;
};

export type RegistrationErrors = Partial<Record<keyof RegistrationInput, string>>;

export type RegistrationResult =
  | { valid: true; data: RegistrationInput }
  | { valid: false; errors: RegistrationErrors };

export type NewPasswordResult = { valid: true; data: { password: string } } | { valid: false; error: string };

export const emailMaxLength = 254;
export const passwordMinLength = 8;
export const passwordMaxLength = 72;
export const displayNameMinLength = 2;
export const displayNameMaxLength = 80;

export const passwordLengthMessage = `La contraseña debe tener entre ${passwordMinLength} y ${passwordMaxLength} caracteres.`;

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
}

/**
 * Largo permitido de la contraseña. bcrypt solo usa los primeros 72 bytes y Auth rechaza lo que
 * pase de ahí; por eso también se cuentan los bytes UTF-8, no solo los caracteres.
 */
function isValidPasswordLength(password: string): boolean {
  return (
    password.length >= passwordMinLength &&
    password.length <= passwordMaxLength &&
    new TextEncoder().encode(password).length <= passwordMaxLength
  );
}

export function validateRegistration(input: unknown): RegistrationResult {
  const raw = asRecord(input);
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw.password === 'string' ? raw.password : '';
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim() : '';
  const acceptsPrivacy = raw.acceptsPrivacy === true;
  const errors: RegistrationErrors = {};

  if (email.length > emailMaxLength || !emailPattern.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!isValidPasswordLength(password)) {
    errors.password = passwordLengthMessage;
  }

  if (displayName.length < displayNameMinLength || displayName.length > displayNameMaxLength) {
    errors.displayName = `Ingresa tu nombre (de ${displayNameMinLength} a ${displayNameMaxLength} caracteres).`;
  }

  if (!acceptsPrivacy) {
    errors.acceptsPrivacy = 'Necesitamos que aceptes la política de privacidad para crear tu cuenta.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { email, password, displayName, acceptsPrivacy } };
}

/** Mismo largo que el registro. Si llega `confirmPassword`, debe coincidir. */
export function validateNewPassword(input: unknown): NewPasswordResult {
  const raw = asRecord(input);
  const password = typeof raw.password === 'string' ? raw.password : '';

  if (!isValidPasswordLength(password)) {
    return { valid: false, error: passwordLengthMessage };
  }

  if (raw.confirmPassword !== undefined && raw.confirmPassword !== password) {
    return { valid: false, error: 'Las contraseñas no coinciden.' };
  }

  return { valid: true, data: { password } };
}

/** Respuesta de «Recuperar contraseña»: la misma exista o no el correo. */
export const resetRequestedMessage = 'Si el correo existe, te enviamos un enlace para cambiar la contraseña.';

/** Destino por defecto tras crear la cuenta con sesión inmediata. */
export const buyerLandingPath = '/mis-boletos/';

/** Página a la que Auth redirige desde el correo de recuperación (el token llega en el fragmento). */
export const recoverNewPasswordPath = '/recuperar/nueva/';

export type RecoveryFragment = { kind: 'ready'; accessToken: string } | { kind: 'invalid' };

const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Lee el fragmento (`#access_token=…&type=recovery`) con que Supabase Auth redirige desde el correo.
 * Un enlace vencido o ya usado llega como `#error=access_denied&error_code=otp_expired…`.
 * Solo acepta un access token con forma de JWT y `type=recovery`; todo lo demás es inválido.
 */
export function parseRecoveryFragment(hash: string): RecoveryFragment {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const accessToken = params.get('access_token') ?? '';

  if (params.get('error') || params.get('error_code') || params.get('type') !== 'recovery') {
    return { kind: 'invalid' };
  }

  if (accessToken.length > 4096 || !jwtPattern.test(accessToken)) {
    return { kind: 'invalid' };
  }

  return { kind: 'ready', accessToken };
}
