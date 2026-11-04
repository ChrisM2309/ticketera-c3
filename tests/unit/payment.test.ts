import { describe, expect, it } from 'vitest';

import {
  paymentIdempotencyKey,
  paymentOutcomeFor,
  parseConfirmRequest,
} from '../../src/features/checkout/payment';
import {
  createTicketId,
  deriveTicketQrToken,
  hashTicketQrToken,
  recoverTicketQrs,
} from '../../src/features/ticketing/qr';

const token = 'a'.repeat(43);

describe('parseConfirmRequest', () => {
  it('acepta un token de checkout con la forma de base64url y una decisión opcional', () => {
    expect(parseConfirmRequest({ checkoutToken: token, decision: 'approved' })).toEqual({
      valid: true,
      data: { checkoutToken: token, decision: 'approved' },
    });
    expect(parseConfirmRequest({ checkoutToken: token, decision: null })).toEqual({
      valid: true,
      data: { checkoutToken: token, decision: null },
    });
  });

  it('rechaza tokens mal formados, decisiones desconocidas y cuerpos que no son objetos', () => {
    expect(parseConfirmRequest({ checkoutToken: 'corto', decision: 'approved' }).valid).toBe(false);
    expect(parseConfirmRequest({ checkoutToken: `${'a'.repeat(42)}!`, decision: null }).valid).toBe(false);
    expect(parseConfirmRequest({ checkoutToken: token, decision: 'captured' }).valid).toBe(false);
    expect(parseConfirmRequest({ checkoutToken: token, decision: 100 }).valid).toBe(false);
    expect(parseConfirmRequest(null).valid).toBe(false);
    expect(parseConfirmRequest('texto').valid).toBe(false);
  });

  it('no acepta importes ni totales desde el navegador', () => {
    const result = parseConfirmRequest({ checkoutToken: token, decision: 'approved', totalCents: 0 });

    expect(result).toEqual({ valid: true, data: { checkoutToken: token, decision: 'approved' } });
  });
});

describe('paymentOutcomeFor', () => {
  it('confirma sin pasarela cuando la orden no tiene importe, sin importar la decisión enviada', () => {
    expect(paymentOutcomeFor(0, null)).toBe('free');
    expect(paymentOutcomeFor(0, 'rejected')).toBe('free');
  });

  it('traduce la decisión DEMO de una orden con importe', () => {
    expect(paymentOutcomeFor(4725, 'approved')).toBe('demo_approved');
    expect(paymentOutcomeFor(4725, 'rejected')).toBe('demo_rejected');
  });

  it('no inventa un resultado para una orden con importe y sin decisión', () => {
    expect(paymentOutcomeFor(4725, null)).toBeNull();
  });
});

describe('paymentIdempotencyKey', () => {
  it('es estable por orden y cumple el largo que exige la tabla payments', () => {
    const key = paymentIdempotencyKey('33333333-3333-4333-8333-333333333333');

    expect(key).toBe('demo:33333333-3333-4333-8333-333333333333');
    expect(key).toBe(paymentIdempotencyKey('33333333-3333-4333-8333-333333333333'));
    expect(key.length).toBeGreaterThanOrEqual(8);
    expect(key.length).toBeLessThanOrEqual(128);
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
