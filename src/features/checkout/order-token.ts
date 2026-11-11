import { createHash } from 'node:crypto';

/** Hash SHA-256 para persistir tokens de confirmación sin guardar el secreto en claro. */
export function hashCheckoutToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
