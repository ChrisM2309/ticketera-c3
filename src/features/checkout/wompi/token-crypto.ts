import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Cifrado del token de checkout guardado en la base (plan Wompi v2, D-B). AES-256-GCM con una clave
 * de 32 bytes que vive solo en el servidor (CHECKOUT_TOKEN_ENCRYPTION_KEY, base64).
 * Formato: v1.<iv>.<tag>.<texto cifrado>, todo en base64url.
 */

const VERSION = 'v1';
const IV_BYTES = 12;

/** Devuelve la clave o null si falta o no mide 32 bytes: sin clave no se guarda ningún token. */
export function readTokenEncryptionKey(value: string | undefined): Buffer | null {
  if (!value) return null;

  const key = Buffer.from(value.trim(), 'base64');
  return key.length === 32 ? key : null;
}

export function encryptCheckoutToken(token: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

/** Devuelve null si el formato no es válido o la autenticación falla (texto alterado o clave distinta). */
export function decryptCheckoutToken(payload: string, key: Buffer): string | null {
  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) return null;

  try {
    const iv = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const ciphertext = Buffer.from(parts[3], 'base64url');
    if (iv.length !== IV_BYTES || tag.length !== 16) return null;

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
