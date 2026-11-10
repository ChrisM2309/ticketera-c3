import type { CatalogTicketType, EventMode } from './types';

const timeZone = 'America/El_Salvador';
const usdWhole = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Montos en centavos enteros (AGENTS.md). Solo se formatean para mostrar. */
export function formatUsd(cents: number): string {
  return cents % 100 === 0 ? usdWhole.format(cents / 100) : usdCents.format(cents / 100);
}

function activePrices(ticketTypes: readonly CatalogTicketType[]): number[] {
  return ticketTypes.filter((ticket) => ticket.isActive).map((ticket) => ticket.priceCents);
}

export function isFree(ticketTypes: readonly CatalogTicketType[]): boolean {
  const prices = activePrices(ticketTypes);

  return prices.length > 0 && Math.max(...prices) === 0;
}

/** Hay al menos una entrada activa y alguna cuesta más de cero. */
export function isPaid(ticketTypes: readonly CatalogTicketType[]): boolean {
  const prices = activePrices(ticketTypes);

  return prices.length > 0 && Math.max(...prices) > 0;
}

export function priceLabel(ticketTypes: readonly CatalogTicketType[]): string {
  const prices = activePrices(ticketTypes);

  if (prices.length === 0) {
    return 'Sin entradas disponibles';
  }

  if (Math.max(...prices) === 0) {
    return 'Gratis';
  }

  return `Desde ${formatUsd(Math.min(...prices))}`;
}

/**
 * Precio corto para la barra de compra móvil. `minPriceCents` es el precio más bajo de las entradas
 * con cupo (`null` si no hay) y `hasFree` indica que alguna de ellas es gratuita.
 * Solo gratuitas: 'Gratis'; con alguna de pago: 'Desde $18' o 'Desde $10.50' (sin decimales cuando son cero).
 */
export function priceFromLabel(minPriceCents: number | null, hasFree: boolean): string {
  if (minPriceCents === null) {
    return '';
  }

  if (minPriceCents === 0 && hasFree) {
    return 'Gratis';
  }

  return `Desde ${formatUsd(minPriceCents)}`;
}

export function modeLabel(mode: EventMode): string {
  return mode === 'virtual' ? 'En línea' : 'Presencial';
}

/** Fecha y hora en la zona de El Salvador (UTC-6, sin cambio de horario). */
export function eventDateParts(startsAt: string) {
  const date = new Date(startsAt);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-SV', { timeZone, ...options }).format(date);

  return {
    day: part({ day: 'numeric' }),
    month: part({ month: 'short' }).replace('.', ''),
    time: part({ hour: 'numeric', minute: '2-digit' }),
  };
}
