import { getAvailableQuantity } from '../catalog/tickets';
import type { CatalogEventTicket, EventMode } from '../catalog/types';

export const CART_STORAGE_KEY = 'ticketera-c3-cart-v1';

export type CartItem = {
  ticketTypeId: string;
  quantity: number;
};

export type CartEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  mode: EventMode;
  venue: string | null;
  eventType: { slug: string; name: string };
  topic: { slug: string; name: string } | null;
  ticketTypes: CatalogEventTicket[];
};

export type CartSnapshot = {
  version: 1;
  event: CartEvent;
  items: CartItem[];
};

export type CartInitialState = 'empty' | 'ready' | 'invalid_query' | 'not_found' | 'unavailable' | 'empty_selection';

export type CartTotals = {
  subtotalCents: number;
  commissionCents: number;
  totalCents: number;
};

export function shouldUseStoredCart(initialState: CartInitialState): boolean {
  return initialState === 'empty';
}

export type CartQuerySelection = {
  eventId: string;
  items: CartItem[];
};

export function getCartQuantityLimit(ticket: Pick<CatalogEventTicket, 'quantityTotal' | 'quantitySold' | 'maxPerOrder'>): number {
  return Math.max(0, Math.min(getAvailableQuantity(ticket), ticket.maxPerOrder));
}

/** Normaliza una selección provisional con los cupos conocidos en el cliente. */
export function normalizeCartItems(event: CartEvent, items: readonly CartItem[]): CartItem[] {
  const quantities = new Map<string, number>();

  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      continue;
    }

    const ticket = event.ticketTypes.find((candidate) => candidate.id === item.ticketTypeId);
    const limit = ticket && ticket.isActive ? getCartQuantityLimit(ticket) : 0;

    if (!ticket || limit === 0) {
      continue;
    }

    const current = quantities.get(ticket.id) ?? 0;
    quantities.set(ticket.id, Math.min(limit, current + item.quantity));
  }

  return [...quantities].map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
}

export function calculateCartTotals(
  event: CartEvent,
  items: readonly CartItem[],
  commissionPercent: number,
): CartTotals {
  const normalizedItems = normalizeCartItems(event, items);
  const subtotalCents = normalizedItems.reduce((subtotal, item) => {
    const ticket = event.ticketTypes.find((candidate) => candidate.id === item.ticketTypeId);

    return subtotal + (ticket?.priceCents ?? 0) * item.quantity;
  }, 0);
  const safeCommissionPercent = Number.isFinite(commissionPercent) && commissionPercent >= 0 ? commissionPercent : 0;
  const commissionCents = Math.round((subtotalCents * safeCommissionPercent) / 100);

  return { subtotalCents, commissionCents, totalCents: subtotalCents + commissionCents };
}

export function createCartSnapshot(event: CartEvent, items: readonly CartItem[]): CartSnapshot {
  return { version: 1, event, items: normalizeCartItems(event, items) };
}

/** Lee solo ids y cantidades de la URL; precios e inventario llegan del servidor. */
export function parseCartQuery(
  eventId: string | null | undefined,
  encodedItems: string | null | undefined,
): CartQuerySelection | null {
  if (!eventId?.trim() || !encodedItems?.trim()) {
    return null;
  }

  let decodedItems: string;

  try {
    decodedItems = decodeURIComponent(encodedItems);
  } catch {
    return null;
  }

  const quantities = new Map<string, number>();

  for (const token of decodedItems.split(',')) {
    const [ticketTypeId, rawQuantity, ...extra] = token.split(':');
    const quantity = Number(rawQuantity);

    if (
      extra.length > 0 ||
      !ticketTypeId ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      continue;
    }

    quantities.set(ticketTypeId, (quantities.get(ticketTypeId) ?? 0) + quantity);
  }

  const items = [...quantities].map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

  return items.length > 0 ? { eventId: eventId.trim(), items } : null;
}

export function serializeCartSnapshot(snapshot: CartSnapshot): string {
  return JSON.stringify(snapshot);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCategory(value: unknown): value is { slug: string; name: string } {
  return isRecord(value) && typeof value.slug === 'string' && typeof value.name === 'string';
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function isCartTicket(value: unknown): value is CatalogEventTicket {
  if (!isRecord(value)) {
    return false;
  }

  const { id, name, priceCents, quantityTotal, quantitySold, maxPerOrder, isActive } = value;

  return (
    typeof id === 'string' &&
    typeof name === 'string' &&
    isNonNegativeSafeInteger(priceCents) &&
    isNonNegativeSafeInteger(quantityTotal) &&
    isNonNegativeSafeInteger(quantitySold) &&
    isNonNegativeSafeInteger(maxPerOrder) &&
    typeof isActive === 'boolean'
  );
}

function isCartEvent(value: unknown): value is CartEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.title === 'string' &&
    typeof value.startsAt === 'string' &&
    (value.mode === 'presencial' || value.mode === 'virtual') &&
    (value.venue === null || typeof value.venue === 'string') &&
    isCategory(value.eventType) &&
    (value.topic === null || isCategory(value.topic)) &&
    Array.isArray(value.ticketTypes) &&
    value.ticketTypes.every(isCartTicket)
  );
}

export function parseCartSnapshot(value: string | null): CartSnapshot | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!isRecord(parsed) || parsed.version !== 1 || !isCartEvent(parsed.event) || !Array.isArray(parsed.items)) {
      return null;
    }

    if (parsed.items.some((item) => {
      if (!isRecord(item)) {
        return true;
      }

      return typeof item.ticketTypeId !== 'string' || !isPositiveSafeInteger(item.quantity);
    })) {
      return null;
    }

    const items = normalizeCartItems(parsed.event, parsed.items as CartItem[]);

    return items.length > 0 ? { version: 1, event: parsed.event, items } : null;
  } catch {
    return null;
  }
}

/** Entradas guardadas en el carrito local: suma de cantidades; sin carrito, cero. */
export function cartItemCount(snapshot: Pick<CartSnapshot, 'items'> | null): number {
  return snapshot ? snapshot.items.reduce((total, item) => total + item.quantity, 0) : 0;
}

/** Aviso en la misma pestaña cuando cambia el carrito guardado (el evento «storage» solo llega a otras pestañas). */
export const CART_CHANGED_EVENT = 'ticketera-cart-changed';
