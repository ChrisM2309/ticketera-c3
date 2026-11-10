'use client';

import Link from 'next/link';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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

  function changeQuantity(ticketId: string, limit: number, next: (current: number) => number) {
    setQuantities((current) => ({
      ...current,
      [ticketId]: Math.min(Math.max(next(current[ticketId] ?? 0), 0), limit),
    }));
  }

  function updateQuantity(ticketId: string, value: string, limit: number) {
    const parsed = Number.parseInt(value, 10);

    changeQuantity(ticketId, limit, () => (Number.isFinite(parsed) ? parsed : 0));
  }

  const disabledMessage = event.status !== 'published'
    ? 'Este evento no está disponible para compra.'
    : disabled && availableTickets.length === 0
      ? 'No hay cupos disponibles para este evento.'
      : disabled
        ? 'Este evento ya finalizó. No se pueden comprar entradas.'
        : null;

  return (
    <section aria-labelledby="entradas" className="flex flex-col gap-3 rounded-lg bg-superficie p-4 shadow-sm sm:gap-5 sm:p-5">
      <div className="flex flex-col gap-2">
        <h2 id="entradas" className="font-titulo text-xl font-bold sm:text-2xl">
          Elegí tus entradas
        </h2>
        <p className="hidden font-texto text-sm leading-6 text-texto-suave sm:block">
          Seleccioná cantidades del mismo evento. El precio final y los cupos se verifican al continuar.
        </p>
      </div>

      {disabledMessage ? (
        <p role="status" className="rounded-md bg-superficie-sutil p-4 font-texto text-sm leading-6 text-texto-suave">
          {disabledMessage}
        </p>
      ) : null}

      <div role="group" aria-label="Tipos de entrada" className="flex flex-col gap-2 sm:gap-3">
        {event.ticketTypes.map((ticket) => {
          const available = getAvailableQuantity(ticket);
          const limit = getTicketQuantityLimit(ticket);
          const quantity = quantities[ticket.id] ?? 0;
          const isDisabled = disabled || !ticket.isActive || available === 0;

          return (
            <div
              key={ticket.id}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-md border p-3 sm:p-4',
                quantity > 0 ? 'border-accion bg-superficie-sutil' : 'border-borde',
                isDisabled && 'bg-superficie-sutil',
              )}
            >
              <div className="col-span-2 flex items-start justify-between gap-4">
                <label
                  htmlFor={`entrada-${ticket.id}`}
                  className="min-w-0 font-titulo text-base font-semibold leading-6 text-texto"
                >
                  {ticket.name}
                </label>
                <p className="shrink-0 font-titulo text-lg font-bold tabular-nums text-texto">
                  {formatUsd(ticket.priceCents)}
                </p>
              </div>

              <p id={`ayuda-${ticket.id}`} className="font-texto text-xs leading-4 text-texto-suave sm:text-sm sm:leading-5">
                {available > 0
                  ? `${available} cupos disponibles · máximo ${ticket.maxPerOrder} por orden`
                  : 'Agotada'}
              </p>

              <div className="flex items-center">
                <div className="flex items-center overflow-hidden rounded-md border border-borde-fuerte bg-superficie">
                  <button
                    type="button"
                    aria-label={`Quitar una entrada de ${ticket.name}`}
                    onClick={() => changeQuantity(ticket.id, limit, (current) => current - 1)}
                    disabled={isDisabled || quantity === 0}
                    className="flex size-11 cursor-pointer items-center justify-center text-texto transition-colors hover:bg-superficie-sutil disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <input
                    id={`entrada-${ticket.id}`}
                    name={`entrada-${ticket.id}`}
                    type="number"
                    min={0}
                    max={limit}
                    value={quantity}
                    onChange={(input) => updateQuantity(ticket.id, input.target.value, limit)}
                    disabled={isDisabled}
                    aria-describedby={`ayuda-${ticket.id}`}
                    aria-label={`Cantidad de ${ticket.name}`}
                    className="h-11 w-12 bg-transparent text-center font-texto text-base font-semibold text-texto tabular-nums [appearance:textfield] disabled:text-texto-suave [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={`Agregar una entrada de ${ticket.name}`}
                    onClick={() => changeQuantity(ticket.id, limit, (current) => current + 1)}
                    disabled={isDisabled || quantity >= limit}
                    className="flex size-11 cursor-pointer items-center justify-center text-texto transition-colors hover:bg-superficie-sutil disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>
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
