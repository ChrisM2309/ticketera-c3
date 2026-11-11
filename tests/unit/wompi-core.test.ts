import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { readWompiConfig } from '@/features/checkout/wompi/config';
import { buildPaymentLinkBody, centsToDollars } from '@/features/checkout/wompi/payment-link';
import { computeWompiHash, verifyWompiSignature } from '@/features/checkout/wompi/signature';
import {
  amountMatches,
  APPROVED_RESULT_CODE,
  decideSettlement,
  dollarsToCents,
  isPaymentWindowOpen,
  paymentWindowEndsAt,
  type SettlementInput,
} from '@/features/checkout/wompi/settle';
import {
  decryptCheckoutToken,
  encryptCheckoutToken,
  readTokenEncryptionKey,
} from '@/features/checkout/wompi/token-crypto';

const orderId = '33333333-3333-4333-8333-333333333333';
const token = 'a'.repeat(43);
const secret = 'secreto-de-prueba';

describe('cifrado del token de checkout', () => {
  const key = randomBytes(32);

  it('cifra y descifra el mismo texto, sin dejarlo en claro', () => {
    const payload = encryptCheckoutToken(token, key);

    expect(payload.startsWith('v1.')).toBe(true);
    expect(payload).not.toContain(token);
    expect(decryptCheckoutToken(payload, key)).toBe(token);
  });

  it('usa un IV distinto en cada cifrado', () => {
    expect(encryptCheckoutToken(token, key)).not.toBe(encryptCheckoutToken(token, key));
  });

  it('rechaza un texto alterado, otra clave o un formato desconocido', () => {
    const payload = encryptCheckoutToken(token, key);
    const parts = payload.split('.');
    const tampered = [parts[0], parts[1], parts[2], `${parts[3].slice(0, -2)}AA`].join('.');

    expect(decryptCheckoutToken(tampered, key)).toBeNull();
    expect(decryptCheckoutToken(payload, randomBytes(32))).toBeNull();
    expect(decryptCheckoutToken('v2.x.y.z', key)).toBeNull();
    expect(decryptCheckoutToken('basura', key)).toBeNull();
  });

  it('lee solo claves de 32 bytes en base64', () => {
    expect(readTokenEncryptionKey(undefined)).toBeNull();
    expect(readTokenEncryptionKey(randomBytes(16).toString('base64'))).toBeNull();
    expect(readTokenEncryptionKey(randomBytes(32).toString('base64'))?.length).toBe(32);
  });
});

describe('firma del webhook', () => {
  const body = '{"IdTransaccion":"abc","ResultadoTransaccion":"ExitosaAprobada"}';

  it('calcula HMAC-SHA256 en hexadecimal minúscula sobre el cuerpo', () => {
    expect(computeWompiHash(body, secret)).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyWompiSignature(body, computeWompiHash(body, secret), secret)).toBe(true);
  });

  it('acepta la firma en mayúsculas o con espacios alrededor', () => {
    const hash = computeWompiHash(body, secret);
    expect(verifyWompiSignature(body, `  ${hash.toUpperCase()} `, secret)).toBe(true);
  });

  it('rechaza cuerpo alterado, clave distinta, cabecera ausente o de otra longitud', () => {
    const hash = computeWompiHash(body, secret);

    expect(verifyWompiSignature(`${body} `, hash, secret)).toBe(false);
    expect(verifyWompiSignature(body, computeWompiHash(body, 'otra'), secret)).toBe(false);
    expect(verifyWompiSignature(body, null, secret)).toBe(false);
    expect(verifyWompiSignature(body, 'corta', secret)).toBe(false);
    expect(verifyWompiSignature(body, hash, '')).toBe(false);
  });
});

describe('configuración de Wompi (falla cerrado)', () => {
  const complete = { WOMPI_ENV: 'sandbox', WOMPI_APP_ID: 'app', WOMPI_API_SECRET: 'sec' };

  it('solo acepta el modo sandbox con credenciales completas', () => {
    expect(readWompiConfig(complete)).toEqual({ appId: 'app', apiSecret: 'sec' });
  });

  it('bloquea producción, valores desconocidos, ausencia de modo o credenciales incompletas', () => {
    expect(readWompiConfig({ ...complete, WOMPI_ENV: 'production' })).toBeNull();
    expect(readWompiConfig({ ...complete, WOMPI_ENV: 'live' })).toBeNull();
    expect(readWompiConfig({ WOMPI_APP_ID: 'app', WOMPI_API_SECRET: 'sec' })).toBeNull();
    expect(readWompiConfig({ ...complete, WOMPI_APP_ID: '' })).toBeNull();
    expect(readWompiConfig({ ...complete, WOMPI_API_SECRET: undefined })).toBeNull();
  });
});

describe('importes y decisión de liquidación', () => {
  it('convierte dólares decimales a centavos y rechaza montos con más de dos decimales', () => {
    expect(dollarsToCents(15)).toBe(1500);
    expect(dollarsToCents('47.25')).toBe(4725);
    expect(dollarsToCents(0.01)).toBe(1);
    expect(dollarsToCents('47.255')).toBeNull();
    expect(dollarsToCents(-1)).toBeNull();
    expect(dollarsToCents('abc')).toBeNull();
    expect(dollarsToCents(null)).toBeNull();
    expect(amountMatches(15, 1500)).toBe(true);
    expect(amountMatches(15, 1501)).toBe(false);
  });

  const approvedInput = (overrides: Partial<SettlementInput> = {}): SettlementInput => ({
    orderId,
    orderStatus: 'pending',
    totalCents: 1500,
    webhook: {
      transactionId: 'tx-1',
      reference: orderId,
      resultCode: APPROVED_RESULT_CODE,
      amount: 15,
      productive: false,
    },
    verified: { approved: true, amount: 15, productive: false },
    ...overrides,
  });

  it('aprueba solo una orden pendiente con todos los datos verificados', () => {
    expect(decideSettlement(approvedInput())).toEqual({ action: 'approve' });
  });

  it('rechaza una referencia distinta de la orden', () => {
    const decision = decideSettlement(
      approvedInput({ webhook: { ...approvedInput().webhook, reference: '44444444-4444-4444-8444-444444444444' } }),
    );
    expect(decision.action).toBe('reject');
  });

  it('rechaza transacciones productivas en el webhook o en la verificación', () => {
    const base = approvedInput();
    expect(decideSettlement({ ...base, webhook: { ...base.webhook, productive: true } }).action).toBe('reject');
    expect(decideSettlement({ ...base, webhook: { ...base.webhook, productive: undefined } }).action).toBe('reject');
    expect(decideSettlement({ ...base, verified: { ...base.verified, productive: true } }).action).toBe('reject');
  });

  it('no interpreta resultados distintos de ExitosaAprobada: la orden queda pendiente', () => {
    const base = approvedInput();
    const decision = decideSettlement({ ...base, webhook: { ...base.webhook, resultCode: 'Rechazada' } });

    expect(decision).toEqual({
      action: 'ignore',
      reason: 'Resultado no aprobado o no documentado: la orden sigue pendiente.',
    });
  });

  it('rechaza si la consulta a la API no confirma la aprobación', () => {
    const base = approvedInput();
    expect(decideSettlement({ ...base, verified: { ...base.verified, approved: false } }).action).toBe('reject');
  });

  it('rechaza importes distintos en el webhook o en la consulta', () => {
    const base = approvedInput();
    expect(decideSettlement({ ...base, webhook: { ...base.webhook, amount: 14 } }).action).toBe('reject');
    expect(decideSettlement({ ...base, verified: { ...base.verified, amount: 99 } }).action).toBe('reject');
  });

  it('no emite dos veces: una orden confirmada se ignora', () => {
    expect(decideSettlement(approvedInput({ orderStatus: 'confirmed' })).action).toBe('ignore');
  });

  it('un pago aprobado en una orden caducada o fallida se marca para revisión manual', () => {
    expect(decideSettlement(approvedInput({ orderStatus: 'cancelled' })).action).toBe('review');
    expect(decideSettlement(approvedInput({ orderStatus: 'failed' })).action).toBe('review');
  });
});

describe('ventana de pago de 30 minutos', () => {
  const createdAt = new Date('2026-12-01T12:00:00Z');

  it('vence a los 30 minutos exactos', () => {
    expect(paymentWindowEndsAt(createdAt).toISOString()).toBe('2026-12-01T12:30:00.000Z');
    expect(isPaymentWindowOpen(createdAt, new Date('2026-12-01T12:29:59Z'))).toBe(true);
    expect(isPaymentWindowOpen(createdAt, new Date('2026-12-01T12:30:00Z'))).toBe(false);
  });
});

describe('cuerpo del enlace de pago', () => {
  it('envía el monto en dólares y la referencia de la orden, sin datos del comprador', () => {
    const body = buildPaymentLinkBody({
      orderId,
      totalCents: 4725,
      productName: 'Entradas: Congreso',
      startsAt: new Date('2026-12-01T12:00:00Z'),
      endsAt: new Date('2026-12-01T12:30:00Z'),
      redirectUrl: `https://demo.ticketera.c3.com.sv/pago/resultado/?orden=${orderId}`,
      webhookUrl: 'https://demo.ticketera.c3.com.sv/api/pagos/wompi/webhook/',
    });

    expect(body.identificadorEnlaceComercio).toBe(orderId);
    expect(body.monto).toBe(47.25);
    expect(centsToDollars(1)).toBe(0.01);
    expect(body.vigencia.fechaFin).toBe('2026-12-01T12:30:00.000Z');
    expect(body.configuracion.urlRedirect).not.toContain(token);
    expect(JSON.stringify(body)).not.toMatch(/email|telefono|buyer/i);
  });
});
