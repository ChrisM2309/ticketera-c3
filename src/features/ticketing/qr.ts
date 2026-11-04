import { createHash, randomBytes } from 'node:crypto';

/** Valor aleatorio del QR de un boleto. Solo viaja al comprador; la base guarda su hash. */
export function createTicketQrToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashTicketQrToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
