'use client';

import Link from 'next/link';
import { FormEvent, useState, useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import {
  CART_STORAGE_KEY,
  calculateCartTotals,
  parseCartSnapshot,
} from '@/features/checkout/cart';
import { CHECKOUT_SESSION_STORAGE_KEY } from '@/features/checkout/order';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

import { CartSummary } from './cart-summary';

type FieldErrors = {
  buyerName?: string;
  buyerEmail?: string;
  form?: string;
};

type CreatedOrder = {
  orderId: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  checkoutToken: string;
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCreatedOrder(value: unknown): CreatedOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const { orderId, subtotalCents, feeCents, totalCents, checkoutToken } = value;

  return (
    typeof orderId === 'string' &&
    typeof subtotalCents === 'number' &&
    typeof feeCents === 'number' &&
    typeof totalCents === 'number' &&
    typeof checkoutToken === 'string'
  )
    ? { orderId, subtotalCents, feeCents, totalCents, checkoutToken }
    : null;
}

function readFieldErrors(value: unknown): FieldErrors | null {
  if (!isRecord(value)) {
    return null;
  }

  const fromApi = isRecord(value.fieldErrors) ? value.fieldErrors : null;

  if (fromApi) {
    return {
      buyerName: typeof fromApi.buyerName === 'string' ? fromApi.buyerName : undefined,
      buyerEmail: typeof fromApi.buyerEmail === 'string' ? fromApi.buyerEmail : undefined,
      form: typeof fromApi.items === 'string' || typeof fromApi.eventId === 'string'
        ? 'Las entradas cambiaron. Volvé al carrito para revisarlas.'
        : undefined,
    };
  }

  return typeof value.error === 'string' ? { form: value.error } : null;
}

function validateBuyer(name: string, email: string): FieldErrors {
  const errors: FieldErrors = {};

  if (name.trim().length < 2 || name.trim().length > 120) {
    errors.buyerName = 'Ingresá tu nombre completo.';
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    errors.buyerEmail = 'Ingresá un correo electrónico válido.';
  }

  return errors;
}

export function CheckoutPage() {
  const storedValue = useSyncExternalStore(
    subscribeToCartStorage,
    getCartStorageSnapshot,
    getServerCartStorageSnapshot,
  );
  const snapshot = parseCartSnapshot(storedValue);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  const provisionalTotals = snapshot
    ? calculateCartTotals(snapshot.event, snapshot.items, siteConfig.demoCommissionPercent)
    : null;

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot || isSubmitting) {
      return;
    }

    const clientErrors = validateBuyer(buyerName, buyerEmail);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventId: snapshot.event.id,
          items: snapshot.items,
          buyer: { name: buyerName.trim(), email: buyerEmail.trim() },
        }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setFieldErrors(readFieldErrors(body) ?? { form: 'No pudimos crear la orden. Intentá nuevamente.' });
        return;
      }

      const order = readCreatedOrder(body);

      if (!order) {
        setFieldErrors({ form: 'No pudimos crear la orden. Intentá nuevamente.' });
        return;
      }

      try {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        window.sessionStorage.setItem(
          CHECKOUT_SESSION_STORAGE_KEY,
          JSON.stringify({ orderId: order.orderId, checkoutToken: order.checkoutToken }),
        );
      } catch {
        // La orden existe aunque el navegador no permita almacenamiento temporal.
      }

      setCreatedOrder(order);
    } catch {
      setFieldErrors({ form: 'No pudimos crear la orden. Revisá tu conexión e intentá nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdOrder) {
    const verifiedTotals = {
      subtotalCents: createdOrder.subtotalCents,
      commissionCents: createdOrder.feeCents,
      totalCents: createdOrder.totalCents,
    };

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
        <header className="flex flex-col gap-3">
          <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">Orden pendiente creada</h1>
          <p className="max-w-2xl font-texto text-base leading-7 text-texto-suave">
            Verificamos tus entradas y guardamos la orden DEMO. En el siguiente paso elegirás el resultado del pago de demostración.
          </p>
        </header>
        <CartSummary
          totals={verifiedTotals}
          commissionPercent={siteConfig.demoCommissionPercent}
          totalLabel="Total verificado"
          note="Estos importes fueron calculados en el servidor. No se solicitarán datos de tarjeta."
        />
      </div>
    );
  }

  if (!snapshot || snapshot.items.length === 0 || !provisionalTotals) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
        <header className="flex flex-col gap-3">
          <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">Todavía no agregaste entradas.</h1>
          <p className="max-w-xl font-texto text-base leading-7 text-texto-suave">
            Volvé al carrito para elegir un evento y continuar con tus datos de compra.
          </p>
        </header>
        <Link href="/carrito/" className={buttonVariants({ variant: 'compra', size: 'lg' })}>
          Volver al carrito
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-start">
      <section className="flex min-w-0 flex-col gap-6" aria-labelledby="checkout-title">
        <header className="flex flex-col gap-3">
          <h1 id="checkout-title" className="font-titulo text-4xl font-bold leading-tight tracking-tight">
            Finalizá tu compra
          </h1>
          <p className="max-w-2xl font-texto text-base leading-7 text-texto-suave">
            Completá tus datos para crear la orden. Este es un pago de demostración: no se cobrará dinero ni se pedirán datos de tarjeta.
          </p>
        </header>

        <form onSubmit={submitOrder} className="flex flex-col gap-5 rounded-lg bg-superficie p-6 shadow-sm" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="buyer-name" className="font-titulo text-sm font-semibold">
              Nombre completo
            </label>
            <input
              id="buyer-name"
              name="buyer-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={buyerName}
              onChange={(input) => setBuyerName(input.target.value)}
              aria-invalid={Boolean(fieldErrors.buyerName)}
              aria-describedby={fieldErrors.buyerName ? 'buyer-name-error' : undefined}
              className="min-h-11 rounded-md border border-borde-fuerte bg-superficie px-3 font-texto text-base text-texto outline-none focus-visible:ring-2 focus-visible:ring-foco"
            />
            {fieldErrors.buyerName ? (
              <p id="buyer-name-error" role="alert" className="font-texto text-sm text-error">
                {fieldErrors.buyerName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="buyer-email" className="font-titulo text-sm font-semibold">
              Correo electrónico
            </label>
            <input
              id="buyer-email"
              name="buyer-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={buyerEmail}
              onChange={(input) => setBuyerEmail(input.target.value)}
              aria-invalid={Boolean(fieldErrors.buyerEmail)}
              aria-describedby={fieldErrors.buyerEmail ? 'buyer-email-error' : undefined}
              className="min-h-11 rounded-md border border-borde-fuerte bg-superficie px-3 font-texto text-base text-texto outline-none focus-visible:ring-2 focus-visible:ring-foco"
            />
            {fieldErrors.buyerEmail ? (
              <p id="buyer-email-error" role="alert" className="font-texto text-sm text-error">
                {fieldErrors.buyerEmail}
              </p>
            ) : null}
          </div>

          {fieldErrors.form ? (
            <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
              {fieldErrors.form}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
          >
            {isSubmitting ? 'Creando orden…' : 'Crear orden DEMO'}
          </button>
        </form>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <CartSummary totals={provisionalTotals} commissionPercent={siteConfig.demoCommissionPercent} />
        <p className="font-texto text-center text-xs leading-5 text-texto-suave">
          Revisaremos precios y disponibilidad antes de guardar la orden.
        </p>
      </aside>
    </div>
  );
}
