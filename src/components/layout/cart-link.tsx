'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { Icon } from '@/components/ui/icon';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY, cartItemCount, parseCartSnapshot } from '@/features/checkout/cart';
import { cn } from '@/lib/utils';

function suscribir(avisar: () => void) {
  window.addEventListener('storage', avisar);
  window.addEventListener(CART_CHANGED_EVENT, avisar);

  return () => {
    window.removeEventListener('storage', avisar);
    window.removeEventListener(CART_CHANGED_EVENT, avisar);
  };
}

function cantidadGuardada(): number {
  try {
    return cartItemCount(parseCartSnapshot(window.localStorage.getItem(CART_STORAGE_KEY)));
  } catch {
    // Si el navegador bloquea el almacenamiento, el carrito queda vacío en la cabecera.
    return 0;
  }
}

type CartLinkProps = Readonly<{ className?: string }>;

/**
 * Enlace al carrito con icono y número de entradas guardadas. Visible en móvil sin abrir el menú (D-34).
 * En el servidor no hay almacenamiento local, así que el contador aparece al cargar en el navegador.
 */
export function CartLink({ className }: CartLinkProps) {
  const cantidad = useSyncExternalStore(suscribir, cantidadGuardada, () => 0);
  const etiqueta = cantidad === 1 ? 'Carrito, 1 entrada' : `Carrito, ${cantidad} entradas`;

  return (
    <Link
      href="/carrito/"
      aria-label={cantidad > 0 ? etiqueta : 'Carrito'}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm font-medium text-texto-inverso underline-offset-4 hover:underline',
        className,
      )}
    >
      <Icon name="cart" />
      Carrito
      {cantidad > 0 ? (
        <span
          aria-hidden="true"
          className="inline-flex min-w-6 items-center justify-center rounded-pill bg-texto-inverso px-2 font-titulo text-xs font-bold text-navy"
        >
          {cantidad}
        </span>
      ) : null}
    </Link>
  );
}
