import { hashTicketQrToken } from './qr';

/** Hash del valor escaneado, solo se usa en el servidor antes de consultar el boleto. */
export function hashScannedCode(code: string): string {
  return hashTicketQrToken(code);
}
