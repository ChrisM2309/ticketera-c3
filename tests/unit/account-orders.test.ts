import { describe, expect, test } from 'vitest';

import { toAccountOrder, type MyOrdersRow } from '../../src/features/accounts/orders';
import { deriveCheckoutToken } from '../../src/features/checkout/token';

const secret = 'secreto-de-prueba-para-boletos';
const requestId = '5b0c1d2e-3f4a-4b5c-8d6e-7f8091a2b3c4';

function row(overrides: Partial<MyOrdersRow> = {}): MyOrdersRow {
  return {
    order_id: '3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b',
    status: 'confirmed',
    total_cents: 2100,
    created_at: '2026-11-20T15:00:00.000Z',
    checkout_request_id: requestId,
    event_id: '8a1c2d3e-4f5a-4b6c-9d7e-0f1a2b3c4d5e',
    event_title: 'Congreso DEMO de IA',
    event_starts_at: '2026-12-05T14:00:00.000Z',
    ...overrides,
  };
}

describe('toAccountOrder', () => {
  test('construye la ruta de confirmación con el token derivado', () => {
    const order = toAccountOrder(row(), secret);
    const token = deriveCheckoutToken(secret, requestId);

    expect(order.confirmationPath).toBe(`/confirmacion/3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b/${token}/`);
    expect(token).toHaveLength(43);
    expect(order).toMatchObject({
      orderId: '3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b',
      status: 'confirmed',
      totalCents: 2100,
      createdAt: '2026-11-20T15:00:00.000Z',
      eventTitle: 'Congreso DEMO de IA',
      eventStartsAt: '2026-12-05T14:00:00.000Z',
    });
  });

  test('ordenes sin request id no generan enlace', () => {
    const order = toAccountOrder(row({ checkout_request_id: null }), secret);

    expect(order.confirmationPath).toBe('');
  });

  test('orden fallida se muestra con su estado', () => {
    const order = toAccountOrder(row({ status: 'failed' }), secret);

    expect(order.status).toBe('failed');
    expect(order.confirmationPath).toContain('/confirmacion/');
  });

  test('el enlace no incluye el request id ni datos personales', () => {
    const order = toAccountOrder(row(), secret);

    expect(order.confirmationPath).not.toContain(requestId);
  });
});
