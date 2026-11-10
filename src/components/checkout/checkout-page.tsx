'use client';

import Link from 'next/link';
import { FormEvent, useState, useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { eventPath } from '@/features/catalog/paths';
import {
  CART_STORAGE_KEY,
  calculateCartTotals,
  parseCartSnapshot,
} from '@/features/checkout/cart';
import { checkoutErrorView, type CheckoutErrorView } from '@/features/checkout/errors';
import { submitLabel } from '@/features/checkout/labels';
import { CHECKOUT_REQUEST_STORAGE_KEY, CHECKOUT_SESSION_STORAGE_KEY } from '@/features/checkout/order';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

import { CartSummary } from './cart-summary';
import { CheckoutErrorNotice, CheckoutSteps, PaymentStep, type PendingOrder } from './payment-step';

type FieldErrors = {
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  form?: string;
};

type CreatedOrder = PendingOrder & {
  subtotalCents: number;
  feeCents: number;
};

/**
 * Un request id por sesión de checkout y selección de entradas. Se reutiliza en los reintentos para que el
 * servidor devuelva la misma orden en lugar de duplicarla; cambia si cambian el evento o las entradas.
 */
function getCheckoutRequestId(fingerprint: string): string {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(CHECKOUT_REQUEST_STORAGE_KEY) ?? 'null') as unknown;

    if (
      isRecord(stored) &&
      stored.fingerprint === fingerprint &&
      typeof stored.requestId === 'string'
    ) {
      return stored.requestId;
    }
  } catch {
    // Sin almacenamiento o con contenido ilegible se genera un request id nuevo.
  }

  const requestId = crypto.randomUUID();

  try {
    window.sessionStorage.setItem(CHECKOUT_REQUEST_STORAGE_KEY, JSON.stringify({ fingerprint, requestId }));
  } catch {
    // El reintento dentro de esta misma carga también debería reutilizarlo; sin almacenamiento no es posible.
  }

  return requestId;
}

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
      buyerPhone: typeof fromApi.buyerPhone === 'string' ? fromApi.buyerPhone : undefined,
      form: typeof fromApi.items === 'string' || typeof fromApi.eventId === 'string'
        ? 'Las entradas cambiaron. Volvé al carrito para revisarlas.'
        : typeof fromApi.requestId === 'string'
          ? 'No pudimos validar la solicitud de compra. Recargá la página e intentá nuevamente.'
          : undefined,
    };
  }

  return null;
}

function readApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === 'string' ? value.error : null;
}

function validateBuyer(name: string, email: string, phone: string): FieldErrors {
  const errors: FieldErrors = {};

  if (name.trim().length < 2 || name.trim().length > 120) {
    errors.buyerName = 'Ingresá tu nombre completo.';
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    errors.buyerEmail = 'Ingresá un correo electrónico válido.';
  }

  if (phone.trim() && !/^(?:\+?503)?[0-9]{8}$/.test(phone.trim().replace(/[\s-]/g, ''))) {
    errors.buyerPhone = 'Ingresá un teléfono de El Salvador de 8 dígitos.';
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
  const [buyerPhone, setBuyerPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [orderError, setOrderError] = useState<CheckoutErrorView | null>(null);

  const provisionalTotals = snapshot
    ? calculateCartTotals(snapshot.event, snapshot.items, siteConfig.demoCommissionPercent)
    : null;

  const eventHref = snapshot
    ? eventPath({
        slug: snapshot.event.slug,
        eventTypeSlug: snapshot.event.eventType.slug,
        topicSlug: snapshot.event.topic?.slug ?? null,
      })
    : undefined;

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createOrder();
  }

  /** Crea la orden; «Reintentar» la vuelve a llamar con el mismo request id, así no se duplica. */
  async function createOrder() {
    if (!snapshot || isSubmitting) {
      return;
    }

    const clientErrors = validateBuyer(buyerName, buyerEmail, buyerPhone);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setOrderError(null);

    try {
      const requestId = getCheckoutRequestId(JSON.stringify([snapshot.event.id, snapshot.items]));
      const response = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventId: snapshot.event.id,
          requestId,
          items: snapshot.items,
          buyer: {
            name: buyerName.trim(),
            email: buyerEmail.trim(),
            ...(buyerPhone.trim() ? { phone: buyerPhone.trim() } : {}),
          },
        }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const invalidFields = readFieldErrors(body);

        if (invalidFields) {
          setFieldErrors(invalidFields);
        } else {
          setOrderError(checkoutErrorView(readApiError(body), response.status));
        }

        return;
      }

      const order = readCreatedOrder(body);

      if (!order) {
        setOrderError(checkoutErrorView(null, response.status));
        return;
      }

      try {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        window.sessionStorage.removeItem(CHECKOUT_REQUEST_STORAGE_KEY);
        window.sessionStorage.setItem(
          CHECKOUT_SESSION_STORAGE_KEY,
          JSON.stringify({ orderId: order.orderId, checkoutToken: order.checkoutToken }),
        );
      } catch {
        // La orden existe aunque el navegador no permita almacenamiento temporal.
      }

      setCreatedOrder({ ...order, eventHref });
    } catch {
      setOrderError(checkoutErrorView(null, 0));
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
        <PaymentStep order={createdOrder} />
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
          <Icon name="cart" />
          Volver al carrito
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-6 md:px-6 md:pt-14">
      <section className="flex min-w-0 flex-col gap-4 md:gap-6" aria-labelledby="checkout-title">
        <CheckoutSteps current="datos" free={provisionalTotals.totalCents === 0} />
        <header className="flex flex-col gap-2 md:gap-3">
          <h1 id="checkout-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Finalizá tu compra
          </h1>
          <p className="max-w-2xl font-texto text-sm leading-6 text-texto-suave md:text-base md:leading-7">
            Completá tus datos para crear la orden. Este es un pago de demostración: no se cobrará dinero ni se pedirán datos de tarjeta.
          </p>
        </header>

        <form onSubmit={submitOrder} className="flex flex-col gap-4 rounded-lg bg-superficie p-4 shadow-sm md:gap-5 md:p-6" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="buyer-name" className="inline-flex items-center gap-2 font-titulo text-sm font-semibold">
              <Icon name="user" size={16} />
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
              className={fieldClass}
            />
            {fieldErrors.buyerName ? (
              <p id="buyer-name-error" role="alert" className="font-texto text-sm text-error">
                {fieldErrors.buyerName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="buyer-email" className="inline-flex items-center gap-2 font-titulo text-sm font-semibold">
              <Icon name="mail" size={16} />
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
              className={fieldClass}
            />
            {fieldErrors.buyerEmail ? (
              <p id="buyer-email-error" role="alert" className="font-texto text-sm text-error">
                {fieldErrors.buyerEmail}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="buyer-phone" className="inline-flex items-center gap-2 font-titulo text-sm font-semibold">
              <Icon name="phone" size={16} />
              Teléfono para WhatsApp (opcional)
            </label>
            <input
              id="buyer-phone"
              name="buyer-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={20}
              placeholder="7777 1234"
              value={buyerPhone}
              onChange={(input) => setBuyerPhone(input.target.value)}
              aria-invalid={Boolean(fieldErrors.buyerPhone)}
              aria-describedby={fieldErrors.buyerPhone ? 'buyer-phone-error buyer-phone-hint' : 'buyer-phone-hint'}
              className={fieldClass}
            />
            <p id="buyer-phone-hint" className="font-texto text-xs leading-5 text-texto-suave">
              Número de El Salvador de 8 dígitos. Solo lo guardamos con tu orden de demostración.
            </p>
            {fieldErrors.buyerPhone ? (
              <p id="buyer-phone-error" role="alert" className="font-texto text-sm text-error">
                {fieldErrors.buyerPhone}
              </p>
            ) : null}
          </div>

          {fieldErrors.form ? (
            <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
              {fieldErrors.form}
            </p>
          ) : null}

          {orderError ? (
            <CheckoutErrorNotice view={orderError} eventHref={eventHref} onRetry={createOrder} retrying={isSubmitting} />
          ) : null}

          <CartSummary totals={provisionalTotals} commissionPercent={siteConfig.demoCommissionPercent} compact />

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
          >
            {isSubmitting ? 'Creando orden…' : submitLabel(provisionalTotals.totalCents)}
          </button>
          <p className="text-center font-texto text-xs leading-5 text-texto-suave">
            Revisaremos precios y disponibilidad antes de guardar la orden.
          </p>
        </form>
      </section>
    </div>
  );
}
