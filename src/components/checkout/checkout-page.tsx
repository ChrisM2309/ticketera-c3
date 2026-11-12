'use client';

import Link from 'next/link';
import { FormEvent, useState, useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { eventPath } from '@/features/catalog/paths';
import {
  CART_CHANGED_EVENT,
  CART_STORAGE_KEY,
  calculateCartTotals,
  parseCartSnapshot,
} from '@/features/checkout/cart';
import { checkoutErrorView, type CheckoutErrorView } from '@/features/checkout/errors';
import { accountNotice, submitLabel } from '@/features/checkout/labels';
import { CHECKOUT_REQUEST_STORAGE_KEY, CHECKOUT_SESSION_STORAGE_KEY } from '@/features/checkout/order';
import { siteConfig } from '@/lib/site-config';
import { trackEvent } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';

import { AccountPrompt } from './account-prompt';
import { CartSummary } from './cart-summary';
import { CheckoutErrorNotice, CheckoutSteps, PaymentStep, type PendingOrder } from './payment-step';

type FieldErrors = {
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  form?: string;
};

/** Cuenta con sesión, leída en el servidor desde las cookies; sirve solo para precargar el formulario. */
export type CheckoutAccount = { name: string; email: string };

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
        ? 'Las entradas cambiaron. Vuelve al carrito para revisarlas.'
        : typeof fromApi.requestId === 'string'
          ? 'No pudimos validar la solicitud de compra. Recarga la página e intenta nuevamente.'
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
    errors.buyerName = 'Ingresa tu nombre completo.';
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    errors.buyerEmail = 'Ingresa un correo electrónico válido.';
  }

  if (phone.trim() && !/^(?:\+?503)?[0-9]{8}$/.test(phone.trim().replace(/[\s-]/g, ''))) {
    errors.buyerPhone = 'Ingresa un teléfono de El Salvador de 8 dígitos.';
  }

  return errors;
}

export function CheckoutPage({ account = null }: { account?: CheckoutAccount | null }) {
  const storedValue = useSyncExternalStore(
    subscribeToCartStorage,
    getCartStorageSnapshot,
    getServerCartStorageSnapshot,
  );
  const snapshot = parseCartSnapshot(storedValue);
  const [buyerName, setBuyerName] = useState(account?.name ?? '');
  const [typedEmail, setTypedEmail] = useState('');
  // Con sesión se compra con la cuenta (correo fijo) salvo que el comprador elija seguir como invitado.
  const [asGuest, setAsGuest] = useState(false);
  const usingAccount = account !== null && !asGuest;
  const buyerEmail = usingAccount ? account.email : typedEmail;
  const [buyerPhone, setBuyerPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [orderError, setOrderError] = useState<CheckoutErrorView | null>(null);
  const [reviewing, setReviewing] = useState(false);

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
    const errors = validateBuyer(buyerName, buyerEmail, buyerPhone);
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) setReviewing(true);
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
    trackEvent('begin_checkout', { path: '/checkout/' });

    try {
      const requestId = getCheckoutRequestId(JSON.stringify([snapshot.event.id, snapshot.items]));
      const response = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventId: snapshot.event.id,
          requestId,
          items: snapshot.items,
          // Solo indica que no se ligue a la cuenta; quién es el usuario lo decide el servidor con la sesión.
          ...(account && asGuest ? { asGuest: true } : {}),
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
        // Avisa a la cabecera en la misma pestaña para que el contador del carrito llegue a cero.
        window.dispatchEvent(new Event(CART_CHANGED_EVENT));
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
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
        <PaymentStep order={createdOrder} />
      </div>
    );
  }

  if (!snapshot || snapshot.items.length === 0 || !provisionalTotals) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
        <header className="flex flex-col gap-3">
          <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">Todavía no agregaste entradas.</h1>
          <p className="max-w-xl font-texto text-base leading-7 text-texto-suave">
            Vuelve al carrito para elegir un evento y continuar con tus datos de compra.
          </p>
        </header>
        <Link href="/carrito/" className={buttonVariants({ variant: 'compra', size: 'lg' })}>
          <Icon name="cart" />
          Volver al carrito
        </Link>
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 pt-6 md:px-6 md:pt-14">
        <CheckoutSteps current="datos" free={provisionalTotals.totalCents === 0} />
        <header>
          <h1 className="font-titulo text-2xl font-bold md:text-4xl">Revisa tu compra</h1>
          <p className="mt-2 text-sm text-texto-suave">Confirma las entradas y tus datos antes de continuar.</p>
        </header>
        <section aria-labelledby="review-event" className="rounded-lg bg-superficie p-4 md:p-6">
          <h2 id="review-event" className="font-titulo text-xl font-bold">{snapshot.event.title}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-borde">
            {snapshot.items.map((item) => {
              const ticket = snapshot.event.ticketTypes.find((candidate) => candidate.id === item.ticketTypeId);
              if (!ticket) return null;
              return <li key={item.ticketTypeId} className="flex justify-between gap-4 py-3 text-sm"><span>{ticket.name} × {item.quantity}</span><span>{new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(ticket.priceCents * item.quantity / 100)}</span></li>;
            })}
          </ul>
          <dl className="mt-3 flex flex-col gap-2 border-t border-borde pt-4 text-sm">
            <div><dt className="inline text-texto-suave">Nombre: </dt><dd className="inline">{buyerName}</dd></div>
            <div><dt className="inline text-texto-suave">Correo: </dt><dd className="inline">{buyerEmail}</dd></div>
            {buyerPhone ? <div><dt className="inline text-texto-suave">Teléfono: </dt><dd className="inline">{buyerPhone}</dd></div> : null}
            <div className="flex justify-between border-t border-borde pt-3 text-base font-bold"><dt>Total</dt><dd>{new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(provisionalTotals.totalCents / 100)}</dd></div>
          </dl>
        </section>
        {orderError ? <CheckoutErrorNotice view={orderError} eventHref={eventHref} onRetry={createOrder} retrying={isSubmitting} /> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" onClick={() => setReviewing(false)} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>Editar datos</button>
          <button type="button" disabled={isSubmitting} onClick={() => void createOrder()} className={cn(buttonVariants({ variant: 'compra' }), 'w-full sm:flex-1')}>{isSubmitting ? 'Creando orden…' : provisionalTotals.totalCents === 0 ? 'Confirmar registro gratis' : `Confirmar y pagar ${new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(provisionalTotals.totalCents / 100)}`}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-2 md:px-6 md:pt-14">
      <section className="flex min-w-0 flex-col gap-3 md:gap-6" aria-labelledby="checkout-title">
        <CheckoutSteps current="datos" free={provisionalTotals.totalCents === 0} />
        <header className="flex flex-col gap-2 md:gap-3">
          <h1 id="checkout-title" className="font-titulo text-2xl font-bold leading-tight tracking-tight md:text-4xl">
            Finaliza tu compra
          </h1>
          <p className="max-w-2xl font-texto text-sm leading-6 text-texto-suave md:text-base md:leading-7">
            <span className="md:hidden">Pago de prueba con Wompi: no se cobra dinero real.</span>
            <span className="hidden md:inline">
              Completa tus datos para crear la orden. El pago se realiza en Wompi en modo de prueba, sin cobro real.
            </span>
          </p>
        </header>

        {account ? (
          <div className="flex flex-col gap-3 rounded-lg bg-superficie-sutil p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-texto text-sm leading-6">
              <Icon name="user" size={16} />
              {accountNotice(usingAccount)}
            </p>
            <button
              type="button"
              onClick={() => setAsGuest((current) => !current)}
              className={cn(buttonVariants({ variant: 'secundario' }), 'w-full shrink-0 sm:w-auto')}
            >
              {usingAccount ? 'Comprar como invitado' : 'Usar mi cuenta'}
            </button>
          </div>
        ) : null}

        <form onSubmit={submitOrder} className="flex flex-col gap-3 rounded-lg bg-superficie p-3 shadow-sm md:gap-5 md:p-6" noValidate>
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
              onChange={(input) => setTypedEmail(input.target.value)}
              readOnly={usingAccount}
              aria-invalid={Boolean(fieldErrors.buyerEmail)}
              aria-describedby={
                [fieldErrors.buyerEmail ? 'buyer-email-error' : null, usingAccount ? 'buyer-email-hint' : null]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className={cn(fieldClass, usingAccount && 'cursor-default bg-superficie-sutil text-texto-suave')}
            />
            {usingAccount ? (
              <p id="buyer-email-hint" className="font-texto text-xs leading-5 text-texto-suave">
                Es el correo de tu cuenta; a él se asocia la compra.
              </p>
            ) : null}
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
              <span className="md:hidden">8 dígitos de El Salvador, solo para tu orden DEMO.</span>
              <span className="hidden md:inline">
                Número de El Salvador de 8 dígitos. Solo lo guardamos con tu orden de demostración.
              </span>
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
            className={cn(
              buttonVariants({ variant: 'compra', size: 'lg' }),
              'w-full min-w-0 whitespace-normal px-3 text-center text-sm normal-case leading-5 tracking-normal',
            )}
          >
            {isSubmitting ? 'Creando orden…' : submitLabel(provisionalTotals.totalCents)}
          </button>
          <p className="text-center font-texto text-xs leading-5 text-texto-suave">
            Revisaremos precios y disponibilidad antes de guardar la orden.
          </p>
        </form>

        {/* Debajo del formulario: en móvil la compra va primero y la cuenta es opcional. */}
        <AccountPrompt variant="checkout" signedIn={account !== null} />
      </section>
    </div>
  );
}
