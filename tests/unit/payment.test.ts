import { describe, expect, it } from 'vitest';

import { freeOutcomeFor, parseConfirmRequest } from '../../src/features/checkout/payment';
import {
  createTicketId,
  deriveTicketQrToken,
  hashTicketQrToken,
  recoverTicketQrs,
} from '../../src/features/ticketing/qr';

const token = 'a'.repeat(43);

describe('parseConfirmRequest', () => {
  it('acepta un token de checkout con la forma de base64url', () => {
    expect(parseConfirmRequest({ checkoutToken: token })).toEqual({ valid: true, data: { checkoutToken: token } });
  });

  it('rechaza tokens mal formados y cuerpos que no son objetos', () => {
    expect(parseConfirmRequest({ checkoutToken: 'corto' }).valid).toBe(false);
    expect(parseConfirmRequest({ checkoutToken: `${'a'.repeat(42)}!` }).valid).toBe(false);
    expect(parseConfirmRequest(null).valid).toBe(false);
    expect(parseConfirmRequest('texto').valid).toBe(false);
  });

  it('ignora decisiones de pago e importes enviados por el navegador', () => {
    expect(parseConfirmRequest({ checkoutToken: token, decision: 'approved', totalCents: 0 })).toEqual({
      valid: true,
      data: { checkoutToken: token },
    });
  });
});

describe('freeOutcomeFor', () => {
  it('confirma sin pasarela solo cuando la orden no tiene importe', () => {
    expect(freeOutcomeFor(0)).toBe('free');
  });

  it('nunca confirma una orden con importe desde el navegador', () => {
    expect(freeOutcomeFor(4725)).toBeNull();
  });
});

describe('ticket QR tokens', () => {
  it('deriva el mismo QR para el mismo token e id, y otro para cada boleto o token distinto', () => {
    const ticketId = '11111111-1111-4111-8111-111111111111';
    const qr = deriveTicketQrToken(token, ticketId);

    expect(qr).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(qr).toBe(deriveTicketQrToken(token, ticketId));
    expect(qr).not.toBe(deriveTicketQrToken(token, '22222222-2222-4222-8222-222222222222'));
    expect(qr).not.toBe(deriveTicketQrToken('b'.repeat(43), ticketId));
  });

  it('recupera solo los QR cuyo hash coincide con el guardado', () => {
    const ticketId = '11111111-1111-4111-8111-111111111111';
    const otherId = '22222222-2222-4222-8222-222222222222';
    const tickets = [
      { ticketId, qrTokenHash: hashTicketQrToken(deriveTicketQrToken(token, ticketId)), typeName: 'General' },
      { ticketId: otherId, qrTokenHash: 'f'.repeat(64), typeName: 'Premium' },
    ];

    expect(recoverTicketQrs(token, tickets)).toEqual([
      { ticketId, typeName: 'General', qrToken: deriveTicketQrToken(token, ticketId) },
    ]);
    expect(recoverTicketQrs('b'.repeat(43), tickets)).toEqual([]);
  });

  it('genera ids de boleto distintos en cada llamada', () => {
    expect(createTicketId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(createTicketId()).not.toBe(createTicketId());
  });

  it('guarda solo un hash SHA-256 de 64 caracteres hexadecimales', () => {
    const hash = hashTicketQrToken(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashTicketQrToken(token));
    expect(hash).not.toContain(token);
  });
});
