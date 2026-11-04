import { describe, expect, it } from 'vitest';

import {
  createCheckoutToken,
  getServerDemoCommissionPercent,
  hashCheckoutToken,
  parseOrderRequest,
} from '../../src/features/checkout/order';

const eventId = '11111111-1111-4111-8111-111111111111';
const ticketTypeId = '22222222-2222-4222-8222-222222222222';

describe('contrato de orden de invitado', () => {
  it('normaliza datos de comprador y descarta totales enviados por navegador', () => {
    expect(
      parseOrderRequest({
        eventId,
        items: [{ ticketTypeId, quantity: 2 }],
        buyer: { name: '  Ana DEMO  ', email: ' ANA@EXAMPLE.TEST ' },
        subtotalCents: 1,
        feeCents: 0,
        totalCents: 1,
      }),
    ).toEqual({
      valid: true,
      data: {
        eventId,
        items: [{ ticketTypeId, quantity: 2 }],
        buyerName: 'Ana DEMO',
        buyerEmail: 'ana@example.test',
      },
    });
  });

  it('rechaza IDs, cantidades y datos de comprador inválidos', () => {
    expect(
      parseOrderRequest({
        eventId: 'evento-manipulado',
        items: [{ ticketTypeId, quantity: 0 }],
        buyer: { name: ' ', email: 'sin-correo' },
      }),
    ).toEqual({
      valid: false,
      fieldErrors: {
        eventId: 'La selección del evento no es válida.',
        items: 'Revisá las entradas seleccionadas.',
        buyerName: 'Ingresá tu nombre completo.',
        buyerEmail: 'Ingresá un correo electrónico válido.',
      },
    });
  });

  it('crea un secreto aleatorio y persiste solo su hash SHA-256', () => {
    const first = createCheckoutToken();
    const second = createCheckoutToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
    expect(hashCheckoutToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashCheckoutToken(first)).not.toBe(first);
  });

  it('acepta únicamente un porcentaje de comisión de servidor entre 0 y 100', () => {
    expect(getServerDemoCommissionPercent({ DEMO_COMMISSION_PERCENT: '7' })).toBe(7);
    expect(getServerDemoCommissionPercent({ DEMO_COMMISSION_PERCENT: '101' })).toBe(5);
    expect(getServerDemoCommissionPercent({})).toBe(5);
  });
});
