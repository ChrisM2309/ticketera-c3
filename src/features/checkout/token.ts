import { createHmac } from 'node:crypto';

/**
 * Token público de checkout derivado del request id de la sesión de compra.
 * HMAC-SHA256 en base64url sin relleno (43 caracteres): el mismo request id siempre produce el mismo token,
 * así un reintento idempotente devuelve el mismo enlace sin guardar el token en claro.
 */
export function deriveCheckoutToken(secret: string, requestId: string): string {
  if (!secret) {
    throw new Error('CHECKOUT_TOKEN_SECRET no está configurado.');
  }

  return createHmac('sha256', secret).update(requestId, 'utf8').digest('base64url');
}

/** Secreto solo para desarrollo y pruebas locales; nunca se usa en producción. */
const DEVELOPMENT_SECRET = 'ticketera-c3-solo-desarrollo-no-usar-en-produccion';

type Environment = Readonly<Record<string, string | undefined>>;

export function getCheckoutTokenSecret(env: Environment = process.env): string {
  const configured = env.CHECKOUT_TOKEN_SECRET;

  if (configured) {
    return configured;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('Falta CHECKOUT_TOKEN_SECRET: es obligatorio en producción.');
  }

  return DEVELOPMENT_SECRET;
}
