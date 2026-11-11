import { describe, expect, it } from 'vitest';

import {
  calculateCartTotals,
  createCartSnapshot,
  getCartQuantityLimit,
  normalizeCartItems,
  parseCartQuery,
  parseCartSnapshot,
  serializeCartSnapshot,
  shouldUseStoredCart,
  type CartInitialState,
  type CartEvent,
} from '../../src/features/checkout/cart';

const event: CartEvent = {
  id: 'event-ia',
  slug: 'congreso-demo-ia',
  title: 'Congreso demo de IA',
  startsAt: '2027-04-15T21:00:00Z',
  mode: 'presencial',
  venue: 'San Salvador',
  eventType: { slug: 'congresos', name: 'Congresos' },
  topic: { slug: 'inteligencia-artificial', name: 'Inteligencia artificial' },
  ticketTypes: [
    {
      id: 'general',
      name: 'General',
      priceCents: 1200,
      quantityTotal: 10,
      quantitySold: 2,
      maxPerOrder: 4,
      isActive: true,
    },
    {
      id: 'vip',
      name: 'VIP',
      priceCents: 2500,
      quantityTotal: 1,
      quantitySold: 0,
      maxPerOrder: 3,
      isActive: true,
    },
    {
      id: 'closed',
      name: 'Cerrada',
      priceCents: 500,
      quantityTotal: 10,
      quantitySold: 0,
      maxPerOrder: 4,
      isActive: false,
    },
  ],
};

describe('carrito single-event', () => {
  it('calcula subtotal, comisión demo y total usando centavos enteros', () => {
    const items = normalizeCartItems(event, [
      { ticketTypeId: 'general', quantity: 2 },
      { ticketTypeId: 'vip', quantity: 1 },
    ]);

    expect(calculateCartTotals(event, items, 5)).toEqual({
      subtotalCents: 4900,
      commissionCents: 0,
      totalCents: 4900,
    });
  });

  it('redondea la comisión cuando produce una fracción de centavo', () => {
    const oneCentEvent: CartEvent = {
      ...event,
      ticketTypes: [{ ...event.ticketTypes[0], priceCents: 333 }],
    };
    const items = [{ ticketTypeId: 'general', quantity: 1 }];

    expect(calculateCartTotals(oneCentEvent, items, 5)).toEqual({
      subtotalCents: 333,
      commissionCents: 0,
      totalCents: 333,
    });
  });

  it('limita por cupos y máximo por orden, y elimina tipos no disponibles', () => {
    expect(getCartQuantityLimit(event.ticketTypes[1])).toBe(1);
    expect(
      normalizeCartItems(event, [
        { ticketTypeId: 'general', quantity: 3 },
        { ticketTypeId: 'general', quantity: 3 },
        { ticketTypeId: 'vip', quantity: 2 },
        { ticketTypeId: 'closed', quantity: 1 },
        { ticketTypeId: 'missing', quantity: 1 },
      ]),
    ).toEqual([
      { ticketTypeId: 'general', quantity: 4 },
      { ticketTypeId: 'vip', quantity: 1 },
    ]);
  });

  it('serializa y recupera un snapshot válido de una sola orden', () => {
    const snapshot = createCartSnapshot(event, [{ ticketTypeId: 'general', quantity: 2 }]);

    expect(parseCartSnapshot(serializeCartSnapshot(snapshot))).toEqual(snapshot);
  });

  it('descarta JSON corrupto, versiones desconocidas y snapshots inválidos', () => {
    const snapshot = createCartSnapshot(event, [{ ticketTypeId: 'general', quantity: 2 }]);

    expect(parseCartSnapshot('{')).toBeNull();
    expect(parseCartSnapshot(JSON.stringify({ ...snapshot, version: 2 }))).toBeNull();
    expect(parseCartSnapshot(JSON.stringify({ ...snapshot, event: [snapshot.event] }))).toBeNull();
    expect(
      parseCartSnapshot(JSON.stringify({ ...snapshot, items: [{ ticketTypeId: 'general', quantity: 0 }] })),
    ).toBeNull();
  });

  it('parsea la selección de la ficha sin confiar en precios del query string', () => {
    expect(parseCartQuery('event-ia', 'general:2,general:1,vip:0,malformado')).toEqual({
      eventId: 'event-ia',
      items: [{ ticketTypeId: 'general', quantity: 3 }],
    });
    expect(parseCartQuery('', 'general:1')).toBeNull();
    expect(parseCartQuery('event-ia', 'general:-1')).toBeNull();
  });

  it('solo recupera localStorage cuando la ruta no trae una selección', () => {
    const states: CartInitialState[] = ['invalid_query', 'not_found', 'unavailable', 'empty_selection'];

    expect(shouldUseStoredCart('empty')).toBe(true);
    expect(states.every((state) => !shouldUseStoredCart(state))).toBe(true);
  });
});
