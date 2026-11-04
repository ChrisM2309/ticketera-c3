import { describe, expect, it } from 'vitest';

import {
  paymentIdempotencyKey,
  paymentOutcomeFor,
  parseConfirmRequest,
} from '../../src/features/checkout/payment';
import { createTicketQrToken, hashTicketQrToken } from '../../src/features/ticketing/qr';

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
  it('genera valores distintos de 43 caracteres base64url', () => {
    const first = createTicketQrToken();
    const second = createTicketQrToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  it('guarda solo un hash SHA-256 de 64 caracteres hexadecimales', () => {
    const hash = hashTicketQrToken(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashTicketQrToken(token));
    expect(hash).not.toContain(token);
  });
});
