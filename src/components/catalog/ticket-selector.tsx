'use client';

import Link from 'next/link';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { formatUsd } from '@/features/catalog/format';
import { getAvailableQuantity, getTicketQuantityLimit } from '@/features/catalog/tickets';
import type { CatalogEventDetail } from '@/features/catalog/types';
import { cn } from '@/lib/utils';

type TicketSelectorProps = Readonly<{
  event: CatalogEventDetail;
  disabled: boolean;
}>;

export function TicketSelector({ event, disabled }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const availableTickets = event.ticketTypes.filter((ticket) => ticket.isActive && getAvailableQuantity(ticket) > 0);
  const selectedItems = availableTickets
    .map((ticket) => ({ ticketTypeId: ticket.id, quantity: quantities[ticket.id] ?? 0 }))
    .filter((item) => item.quantity > 0);
  const selectedQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const cartItems = selectedItems.map((item) => `${item.ticketTypeId}:${item.quantity}`).join(',');
  const cartHref = `/carrito/?evento=${encodeURIComponent(event.id)}&entradas=${encodeURIComponent(cartItems)}`;

  function updateQuantity(ticketId: string, value: string, limit: number) {
    const parsed = Number.parseInt(value, 10);
    const next = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), limit) : 0;

    setQuantities((current) => ({ ...current, [ticketId]: next }));
  }

  const disabledMessage = event.status !== 'published'
    ? 'Este evento no está disponible para compra.'
    : disabled && availableTickets.length === 0
      ? 'No hay cupos disponibles para este evento.'
      : disabled
        ? 'Este evento ya finalizó. No se pueden comprar entradas.'
        : null;

  return (
    <section aria-labelledby="entradas" className="flex flex-col gap-5 rounded-lg bg-superficie p-5 shadow-md">
      <div className="flex flex-col gap-2">
        <h2 id="entradas" className="font-titulo text-2xl font-bold">
          Elegí tus entradas
        </h2>
        <p className="font-texto text-sm leading-6 text-texto-suave">
          Seleccioná cantidades del mismo evento. El precio final y los cupos se verifican al continuar.
        </p>
      </div>

      {disabledMessage ? (
        <p role="status" className="rounded-md bg-superficie-sutil p-4 font-texto text-sm leading-6 text-texto-suave">
          {disabledMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3" aria-label="Tipos de entrada">
        {event.ticketTypes.map((ticket) => {
          const available = getAvailableQuantity(ticket);
          const limit = getTicketQuantityLimit(ticket);
          const isDisabled = disabled || !ticket.isActive || available === 0;

          return (
            <div key={ticket.id} className="flex items-center justify-between gap-4 rounded-md border border-borde p-4">
              <div className="min-w-0">
                <label htmlFor={`entrada-${ticket.id}`} className="font-titulo text-base font-semibold text-texto">
                  {ticket.name}
                </label>
                <p id={`ayuda-${ticket.id}`} className="mt-1 font-texto text-sm leading-5 text-texto-suave">
                  {formatUsd(ticket.priceCents)} · {available > 0 ? `${available} cupos disponibles` : 'Agotada'}
                  {available > 0 ? ` · máximo ${ticket.maxPerOrder} por orden` : ''}
                </p>
              </div>
              <input
                id={`entrada-${ticket.id}`}
                name={`entrada-${ticket.id}`}
                type="number"
                min={0}
                max={limit}
                value={quantities[ticket.id] ?? 0}
                onChange={(input) => updateQuantity(ticket.id, input.target.value, limit)}
                disabled={isDisabled}
                aria-describedby={`ayuda-${ticket.id}`}
                aria-label={`Cantidad de ${ticket.name}`}
                className="min-h-11 w-20 rounded-md border border-borde-fuerte bg-superficie px-3 text-center font-texto text-base text-texto"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-borde pt-4">
        <p className="font-texto text-sm text-texto-suave" aria-live="polite">
          {selectedQuantity === 0
            ? 'Todavía no seleccionaste entradas.'
            : `${selectedQuantity} ${selectedQuantity === 1 ? 'entrada seleccionada' : 'entradas seleccionadas'}`}
        </p>
        <Link
          href={cartHref}
          aria-disabled={disabled || selectedQuantity === 0}
          tabIndex={disabled || selectedQuantity === 0 ? -1 : 0}
          className={cn(
            buttonVariants({ variant: 'compra', size: 'lg' }),
            'w-full',
            (disabled || selectedQuantity === 0) && 'pointer-events-none opacity-50',
          )}
        >
          Continuar al carrito
        </Link>
      </div>
    </section>
  );
}
