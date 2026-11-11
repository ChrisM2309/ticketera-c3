import { describe, expect, it } from 'vitest';

import {
  getServerDemoCommissionPercent,
  normalizeSvPhone,
  parseOrderRequest,
} from '../../src/features/checkout/order';
import { hashCheckoutToken } from '../../src/features/checkout/order-token';
import { deriveCheckoutToken } from '../../src/features/checkout/token';

const eventId = '11111111-1111-4111-8111-111111111111';
const ticketTypeId = '22222222-2222-4222-8222-222222222222';
const requestId = '33333333-3333-4333-8333-333333333333';

describe('contrato de orden de invitado', () => {
  it('normaliza datos de comprador y descarta totales enviados por navegador', () => {
    expect(
      parseOrderRequest({
        eventId,
        requestId,
        items: [{ ticketTypeId, quantity: 2 }],
        buyer: { name: '  Ana DEMO  ', email: ' ANA@EXAMPLE.TEST ', phone: '7777-1234' },
        subtotalCents: 1,
        feeCents: 0,
        totalCents: 1,
      }),
    ).toEqual({
      valid: true,
      data: {
        eventId,
        requestId,
        items: [{ ticketTypeId, quantity: 2 }],
        buyerName: 'Ana DEMO',
        buyerEmail: 'ana@example.test',
        buyerPhone: '+50377771234',
      },
    });
  });

  it('rechaza IDs, cantidades y datos de comprador inválidos', () => {
    expect(
      parseOrderRequest({
        eventId: 'evento-manipulado',
        requestId: 'no-es-uuid',
        items: [{ ticketTypeId, quantity: 0 }],
        buyer: { name: ' ', email: 'sin-correo', phone: '12ab' },
      }),
    ).toEqual({
      valid: false,
      fieldErrors: {
        eventId: 'La selección del evento no es válida.',
        requestId: 'La solicitud de compra no es válida. Recarga la página.',
        items: 'Revisa las entradas seleccionadas.',
        buyerName: 'Ingresa tu nombre completo.',
        buyerEmail: 'Ingresa un correo electrónico válido.',
        buyerPhone: 'Ingresa un teléfono de El Salvador de 8 dígitos.',
      },
    });
  });

  it('trata el teléfono vacío o ausente como opcional', () => {
    const buyers = [
      { name: 'Ana DEMO', email: 'ana@example.test' },
      { name: 'Ana DEMO', email: 'ana@example.test', phone: '  ' },
    ];

    for (const buyer of buyers) {
      expect(parseOrderRequest({ eventId, requestId, items: [{ ticketTypeId, quantity: 1 }], buyer })).toMatchObject({
        valid: true,
        data: { buyerPhone: null },
      });
    }
  });

  it('persiste solo el hash SHA-256 del token derivado', () => {
    const first = deriveCheckoutToken('secreto-de-prueba', requestId);

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashCheckoutToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashCheckoutToken(first)).not.toBe(first);
  });

  it('acepta únicamente un porcentaje de comisión de servidor entre 0 y 100', () => {
    expect(getServerDemoCommissionPercent({ DEMO_COMMISSION_PERCENT: '7' })).toBe(7);
    expect(getServerDemoCommissionPercent({ DEMO_COMMISSION_PERCENT: '101' })).toBe(5);
    expect(getServerDemoCommissionPercent({})).toBe(5);
  });
});

describe('teléfono de El Salvador', () => {
  it('normaliza 7777-1234, 7777 1234, +503 7777 1234 y 50377771234 a +50377771234', () => {
    for (const input of ['7777-1234', '7777 1234', '+503 7777 1234', '50377771234', '77771234']) {
      expect(normalizeSvPhone(input)).toBe('+50377771234');
    }
  });

  it('rechaza letras y longitudes distintas de 8 dígitos', () => {
    for (const input of ['7777-12ab', '777712', '777712345', '+503 777712', '+504 7777 1234', '']) {
      expect(normalizeSvPhone(input)).toBeNull();
    }
  });
});
