import type { CatalogEventDetail, CatalogEventTicket } from './types';

export type TicketSelection = {
  ticketTypeId: string;
  quantity: number;
};

export type ValidatedTicketItem = {
  ticketTypeId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type TicketSelectionResult =
  | { valid: true; items: ValidatedTicketItem[]; subtotalCents: number }
  | { valid: false; error: string };

export function getAvailableQuantity(ticket: Pick<CatalogEventTicket, 'quantityTotal' | 'quantitySold'>): number {
  return Math.max(0, ticket.quantityTotal - ticket.quantitySold);
}

export function getTicketQuantityLimit(
  ticket: Pick<CatalogEventTicket, 'quantityTotal' | 'quantitySold' | 'maxPerOrder'>,
): number {
  return Math.min(getAvailableQuantity(ticket), ticket.maxPerOrder);
}

export function isEventPast(event: Pick<CatalogEventDetail, 'startsAt' | 'endsAt'>, now = new Date()): boolean {
  const lastMoment = event.endsAt ?? event.startsAt;

  return new Date(lastMoment).getTime() < now.getTime();
}

export function hasAvailableTickets(
  event: Pick<CatalogEventDetail, 'status' | 'startsAt' | 'endsAt' | 'ticketTypes'>,
  now = new Date(),
): boolean {
  return (
    event.status === 'published' &&
    !isEventPast(event, now) &&
    event.ticketTypes.some((ticket) => ticket.isActive && getAvailableQuantity(ticket) > 0)
  );
}

function invalid(error: string): TicketSelectionResult {
  return { valid: false, error };
}

/** Valida y recalcula la selección con los precios y cupos leídos del servidor. */
export function validateTicketSelection(
  event: CatalogEventDetail,
  selection: readonly TicketSelection[],
  now = new Date(),
): TicketSelectionResult {
  if (event.status !== 'published' || isEventPast(event, now)) {
    return invalid('Este evento no está disponible para compra.');
  }

  const quantities = new Map<string, number>();

  for (const item of selection) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return invalid('Selecciona al menos una entrada.');
    }

    quantities.set(item.ticketTypeId, (quantities.get(item.ticketTypeId) ?? 0) + item.quantity);
  }

  if (quantities.size === 0) {
    return invalid('Selecciona al menos una entrada.');
  }

  const items: ValidatedTicketItem[] = [];
  let subtotalCents = 0;

  for (const [ticketTypeId, quantity] of quantities) {
    const ticket = event.ticketTypes.find((candidate) => candidate.id === ticketTypeId);
    const available = ticket ? getAvailableQuantity(ticket) : 0;

    if (!ticket || !ticket.isActive || available === 0) {
      return invalid('Esta entrada ya no está disponible.');
    }

    if (quantity > ticket.maxPerOrder) {
      return invalid('La cantidad supera el máximo permitido por orden.');
    }

    if (quantity > available) {
      return invalid('La cantidad supera los cupos disponibles.');
    }

    const lineTotalCents = ticket.priceCents * quantity;

    items.push({ ticketTypeId, quantity, unitPriceCents: ticket.priceCents, lineTotalCents });
    subtotalCents += lineTotalCents;
  }

  return { valid: true, items, subtotalCents };
}
