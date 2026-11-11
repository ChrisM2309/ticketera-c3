'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { eventDateParts, formatUsd, modeLabel } from '@/features/catalog/format';
import { eventPath } from '@/features/catalog/paths';
import { getAvailableQuantity } from '@/features/catalog/tickets';
import type { CartEvent, CartItem } from '@/features/checkout/cart';
import {
  CART_CHANGED_EVENT,
  CART_STORAGE_KEY,
  calculateCartTotals,
  createCartSnapshot,
  getCartQuantityLimit,
  parseCartSnapshot,
  serializeCartSnapshot,
  type CartSnapshot,
  type CartInitialState,
} from '@/features/checkout/cart';
import { shouldUseStoredCart } from '@/features/checkout/cart';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

import { CartSummary } from './cart-summary';

export type CartPageProps = Readonly<{
  initialEvent: CartEvent | null;
  initialItems: CartItem[];
  initialState: CartInitialState;
}>;

const emptyCartSource = 'without-query';

function subscribeToCartStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);

  return () => window.removeEventListener('storage', onChange);
}

function getCartStorageSnapshot(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerCartStorageSnapshot(): string | null {
  return null;
}

export function CartPage({ initialEvent, initialItems, initialState }: CartPageProps) {
  const storedValue = useSyncExternalStore(
    subscribeToCartStorage,
    getCartStorageSnapshot,
    getServerCartStorageSnapshot,
  );
  const storedSnapshot = parseCartSnapshot(storedValue);
  const querySnapshot = initialEvent ? createCartSnapshot(initialEvent, initialItems) : null;
  const canUseStoredCart = shouldUseStoredCart(initialState);
  const source = querySnapshot?.event.id ?? (canUseStoredCart ? emptyCartSource : initialState);
  const [localOverride, setLocalOverride] = useState<{
    source: string;
    snapshot: CartSnapshot | null;
  } | null>(null);
  const snapshot = localOverride?.source === source
    ? localOverride.snapshot
    : querySnapshot ?? (canUseStoredCart ? storedSnapshot : null);
  const usingStoredSnapshot = canUseStoredCart && !querySnapshot && storedSnapshot !== null && localOverride === null;

  useEffect(() => {
    if (!canUseStoredCart && !querySnapshot) {
      return;
    }

    if (!snapshot && !querySnapshot && storedValue === null) {
      return;
    }

    try {
      if (snapshot && snapshot.items.length > 0) {
        window.localStorage.setItem(CART_STORAGE_KEY, serializeCartSnapshot(snapshot));
      } else {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
      // Avisa a la cabecera en la misma pestaña para actualizar el contador del carrito.
      window.dispatchEvent(new Event(CART_CHANGED_EVENT));
    } catch {
      // El carrito sigue funcionando durante la sesión si el navegador bloquea storage.
    }
  }, [canUseStoredCart, querySnapshot, snapshot, storedValue]);

  const totals = snapshot
    ? calculateCartTotals(snapshot.event, snapshot.items, siteConfig.demoCommissionPercent)
    : null;

  function updateQuantity(ticketTypeId: string, quantity: number) {
    if (!snapshot) {
      return;
    }

    const otherItems = snapshot.items.filter((item) => item.ticketTypeId !== ticketTypeId);
    setLocalOverride({
      source,
      snapshot: createCartSnapshot(snapshot.event, [...otherItems, { ticketTypeId, quantity }]),
    });
  }

  function changeQuantity(ticketTypeId: string, delta: number) {
    const currentQuantity = snapshot?.items.find((item) => item.ticketTypeId === ticketTypeId)?.quantity ?? 0;

    updateQuantity(ticketTypeId, currentQuantity + delta);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <header className="flex flex-col gap-3">
        <p className="font-titulo text-sm font-semibold uppercase tracking-[0.08em] text-enlace">Compra DEMO</p>
        <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">Tu carrito</h1>
        <p className="max-w-2xl font-texto text-base leading-7 text-texto-suave">
          Revisa tus entradas antes de continuar. Este carrito admite un evento por orden.
        </p>
      </header>

      {!snapshot || snapshot.items.length === 0 || !totals ? (
        <section className="flex flex-col items-start gap-4 rounded-lg bg-superficie p-6 shadow-sm" aria-live="polite">
          <h2 className="font-titulo text-2xl font-bold">
            {initialState === 'invalid_query'
              ? 'No pudimos leer esa selección.'
              : initialState === 'not_found'
                ? 'Ese evento no está disponible.'
                : initialState === 'unavailable'
                  ? 'No pudimos cargar ese evento.'
                  : initialState === 'empty_selection'
                    ? 'Las entradas seleccionadas ya no están disponibles.'
                    : 'Todavía no agregaste entradas.'}
          </h2>
          <p className="max-w-xl font-texto leading-7 text-texto-suave">
            {initialState === 'invalid_query'
              ? 'Vuelve a la ficha del evento y selecciona tus entradas nuevamente.'
              : initialState === 'not_found' || initialState === 'unavailable'
                ? 'Vuelve a intentar o explora otros eventos publicados.'
                : initialState === 'empty_selection'
                  ? 'Vuelve a la ficha para revisar la disponibilidad actual.'
                  : 'Elige un evento y selecciona tus entradas para verlas aquí.'}
          </p>
          <Link href="/congresos/" className={buttonVariants({ variant: 'compra' })}>
            <Icon name="search" />
            Explorar eventos
          </Link>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-start">
          <section aria-labelledby="evento-carrito" className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-3 rounded-lg bg-superficie p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="evento-carrito" className="font-titulo text-2xl font-bold">
                  {snapshot.event.title}
                </h2>
                <Link
                  href={eventPath({
                    slug: snapshot.event.slug,
                    eventTypeSlug: snapshot.event.eventType.slug,
                    topicSlug: snapshot.event.topic?.slug ?? null,
                  })}
                  className="font-titulo text-sm font-semibold text-enlace underline-offset-4 hover:underline"
                >
                  Volver al evento
                </Link>
              </div>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-texto text-sm leading-6 text-texto-suave">
                <span className="inline-flex items-center gap-2">
                  <Icon name="clock" size={16} />
                  {eventDateParts(snapshot.event.startsAt).time}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name={snapshot.event.mode === 'virtual' ? 'monitor' : 'mapPin'} size={16} />
                  {modeLabel(snapshot.event.mode)}
                  {snapshot.event.venue ? ` · ${snapshot.event.venue}` : ''}
                </span>
              </p>
              <p className="inline-flex items-center gap-2 font-texto text-sm text-texto-suave">
                <Icon name="ticket" size={16} />
                Un evento por orden
              </p>
              {usingStoredSnapshot ? (
                <p role="status" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-texto-suave">
                  Esta selección proviene de tu navegador. Los precios y cupos pueden haber cambiado y se verificarán al continuar.
                </p>
              ) : null}
            </div>

            <ul className="flex flex-col gap-4" aria-label="Entradas seleccionadas">
              {snapshot.items.map((item) => {
                const ticket = snapshot.event.ticketTypes.find((candidate) => candidate.id === item.ticketTypeId);

                if (!ticket) {
                  return null;
                }

                const limit = getCartQuantityLimit(ticket);
                const available = getAvailableQuantity(ticket);
                const unavailable = !ticket.isActive || available === 0;

                return (
                  <li key={ticket.id} className={cn('flex flex-col gap-4 rounded-lg bg-superficie p-5 shadow-sm', unavailable && 'bg-superficie-sutil')}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-titulo text-lg font-bold">{ticket.name}</h3>
                        <p className="mt-1 font-texto text-sm text-texto-suave">
                          {formatUsd(ticket.priceCents)} por entrada
                        </p>
                      </div>
                      <p className="font-titulo text-lg font-bold tabular-nums">
                        {formatUsd(ticket.priceCents * item.quantity)}
                      </p>
                    </div>

                    {unavailable ? (
                      <p role="status" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm text-texto-suave">
                        Esta entrada ya no muestra cupos disponibles. Se verificará nuevamente al continuar.
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor={`cantidad-carrito-${ticket.id}`} className="font-titulo text-sm font-semibold">
                          Cantidad de {ticket.name}
                        </label>
                        <div className="flex items-center overflow-hidden rounded-md border border-borde-fuerte bg-superficie">
                          <button
                            type="button"
                            aria-label={`Quitar una entrada de ${ticket.name}`}
                            onClick={() => changeQuantity(ticket.id, -1)}
                            disabled={unavailable || item.quantity === 0}
                            className="flex size-11 cursor-pointer items-center justify-center text-texto hover:bg-superficie-sutil disabled:pointer-events-none disabled:opacity-40"
                          >
                            <Icon name="minus" size={16} />
                          </button>
                          <input
                            id={`cantidad-carrito-${ticket.id}`}
                            type="number"
                            min={0}
                            max={Math.max(1, limit)}
                            value={item.quantity}
                            onChange={(input) => updateQuantity(ticket.id, Number.parseInt(input.target.value, 10) || 0)}
                            disabled={unavailable}
                            aria-describedby={`ayuda-carrito-${ticket.id}`}
                            className="h-11 w-14 bg-transparent text-center font-texto text-base font-semibold tabular-nums [appearance:textfield] disabled:text-texto-suave [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label={`Agregar una entrada de ${ticket.name}`}
                            onClick={() => changeQuantity(ticket.id, 1)}
                            disabled={unavailable || item.quantity >= limit}
                            className="flex size-11 cursor-pointer items-center justify-center text-texto hover:bg-superficie-sutil disabled:pointer-events-none disabled:opacity-40"
                          >
                            <Icon name="plus" size={16} />
                          </button>
                        </div>
                        <p id={`ayuda-carrito-${ticket.id}`} className="font-texto text-xs text-texto-suave">
                          Máximo {limit} por orden · {available} cupos conocidos
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQuantity(ticket.id, 0)}
                        className="inline-flex min-h-11 items-center gap-2 px-2 font-titulo text-sm font-semibold text-enlace underline-offset-4 hover:underline"
                      >
                        <Icon name="trash" size={16} />
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <CartSummary totals={totals} commissionPercent={siteConfig.demoCommissionPercent} />
            <Link href="/checkout/" className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}>
              Continuar al checkout
              <Icon name="chevronRight" />
            </Link>
            <p className="font-texto text-center text-xs leading-5 text-texto-suave">
              Tus datos y los importes se verificarán en el siguiente paso.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
