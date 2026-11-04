import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/** Id del boleto. Lo genera el servidor antes de confirmar la orden. */
export function createTicketId(): string {
  return randomUUID();
}

/**
 * Valor del QR de un boleto. Se deriva del token de checkout del comprador y del id del boleto,
 * así que puede volver a calcularse para la recuperación por enlace sin guardarlo en claro (D-29).
 */
export function deriveTicketQrToken(checkoutToken: string, ticketId: string): string {
  return createHmac('sha256', checkoutToken).update(ticketId, 'utf8').digest('base64url');
}

export function hashTicketQrToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function sameHash(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export type RecoverableTicket = { ticketId: string; qrTokenHash: string; typeName: string };
export type RecoveredTicket = { ticketId: string; typeName: string; qrToken: string };

/**
 * Vuelve a calcular el QR de cada boleto con el token del enlace y conserva solo los que coinciden
 * con el hash guardado. Un boleto que no coincide no se muestra.
 */
export function recoverTicketQrs(checkoutToken: string, tickets: RecoverableTicket[]): RecoveredTicket[] {
  return tickets.flatMap((ticket) => {
    const qrToken = deriveTicketQrToken(checkoutToken, ticket.ticketId);

    return sameHash(hashTicketQrToken(qrToken), ticket.qrTokenHash)
      ? [{ ticketId: ticket.ticketId, typeName: ticket.typeName, qrToken }]
      : [];
  });
}
