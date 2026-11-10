import { describe, expect, it } from 'vitest';

import { eventPathMatches } from '../../src/features/catalog/paths';
import {
  getAvailableQuantity,
  getTicketQuantityLimit,
  hasAvailableTickets,
  isEventPast,
  validateTicketSelection,
} from '../../src/features/catalog/tickets';
import type { CatalogEventDetail } from '../../src/features/catalog/types';

function event(overrides: Partial<CatalogEventDetail> = {}): CatalogEventDetail {
  return {
    id: 'event-1',
    slug: 'congreso-demo',
    title: 'Congreso demo',
    description: 'Descripción almacenada del evento.',
    agenda: '09:00 Bienvenida',
    startsAt: '2027-03-13T15:00:00Z',
    endsAt: '2027-03-13T18:00:00Z',
    mode: 'presencial',
    venue: 'Sede DEMO',
    imagePath: null,
    status: 'published',
    eventType: { slug: 'congresos', name: 'Congresos' },
    topic: { slug: 'cloud', name: 'Cloud' },
    location: { slug: 'san-salvador', name: 'San Salvador' },
    organizer: { name: 'Organizador DEMO' },
    speakers: [],
    ticketTypes: [
      {
        id: 'ticket-general',
        name: 'General',
        priceCents: 1000,
        isActive: true,
        quantityTotal: 10,
        quantitySold: 3,
        maxPerOrder: 4,
      },
    ],
    ...overrides,
  };
}

describe('rutas de ficha', () => {
  it('coincide con tipo, tema y slug del evento cuando hay tema', () => {
    expect(eventPathMatches(['congresos', 'cloud', 'congreso-demo'], event())).toBe(true);
    expect(eventPathMatches(['congresos', 'congreso-demo'], event())).toBe(false);
  });

  it('coincide con tipo y slug cuando el evento no tiene tema', () => {
    const withoutTopic = event({ topic: null });

    expect(eventPathMatches(['congresos', 'congreso-demo'], withoutTopic)).toBe(true);
    expect(eventPathMatches(['congresos', 'cloud', 'congreso-demo'], withoutTopic)).toBe(false);
  });
});

describe('validación de entradas', () => {
  it('calcula el cupo disponible a partir del total y lo vendido', () => {
    expect(getAvailableQuantity(event().ticketTypes[0])).toBe(7);
    expect(getTicketQuantityLimit(event().ticketTypes[0])).toBe(4);
  });

  it('acepta cantidades válidas y calcula el subtotal con el precio del servidor', () => {
    expect(
      validateTicketSelection(event(), [{ ticketTypeId: 'ticket-general', quantity: 2 }]),
    ).toEqual({
      valid: true,
      items: [
        {
          ticketTypeId: 'ticket-general',
          quantity: 2,
          unitPriceCents: 1000,
          lineTotalCents: 2000,
        },
      ],
      subtotalCents: 2000,
    });
  });

  it('rechaza una entrada inactiva o agotada', () => {
    const soldOut = event({
      ticketTypes: [
        {
          ...event().ticketTypes[0],
          isActive: false,
          quantitySold: 10,
        },
      ],
    });

    expect(validateTicketSelection(soldOut, [{ ticketTypeId: 'ticket-general', quantity: 1 }])).toEqual({
      valid: false,
      error: 'Esta entrada ya no está disponible.',
    });
  });

  it('rechaza una cantidad mayor al cupo o al máximo por orden', () => {
    const limited = event({
      ticketTypes: [
        {
          ...event().ticketTypes[0],
          quantityTotal: 3,
          quantitySold: 0,
          maxPerOrder: 2,
        },
      ],
    });

    expect(validateTicketSelection(limited, [{ ticketTypeId: 'ticket-general', quantity: 3 }])).toEqual({
      valid: false,
      error: 'La cantidad supera el máximo permitido por orden.',
    });
  });

  it('rechaza eventos no publicados y eventos pasados', () => {
    expect(
      validateTicketSelection(
        event({ status: 'pending' }),
        [{ ticketTypeId: 'ticket-general', quantity: 1 }],
        new Date('2027-03-01T12:00:00Z'),
      ),
    ).toEqual({ valid: false, error: 'Este evento no está disponible para compra.' });

    expect(isEventPast(event(), new Date('2027-04-01T12:00:00Z'))).toBe(true);
  });

  it('indica si todavía existe una entrada comprable', () => {
    expect(hasAvailableTickets(event(), new Date('2027-03-01T12:00:00Z'))).toBe(true);
    expect(
      hasAvailableTickets(
        event({
          ticketTypes: [{ ...event().ticketTypes[0], quantitySold: 10 }],
        }),
        new Date('2027-03-01T12:00:00Z'),
      ),
    ).toBe(false);
  });

});
