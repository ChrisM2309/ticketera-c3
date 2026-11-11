export const CHECKOUT_SESSION_STORAGE_KEY = 'ticketera-c3-checkout-v1';
export const CHECKOUT_REQUEST_STORAGE_KEY = 'ticketera-c3-checkout-request';

export type OrderItemRequest = {
  ticketTypeId: string;
  quantity: number;
};

export type OrderRequestData = {
  eventId: string;
  requestId: string;
  items: OrderItemRequest[];
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
};

export type OrderRequestResult =
  | { valid: true; data: OrderRequestData }
  | {
      valid: false;
      fieldErrors: {
        eventId?: string;
        requestId?: string;
        items?: string;
        buyerName?: string;
        buyerEmail?: string;
        buyerPhone?: string;
      };
    };

type Environment = Readonly<Record<string, string | undefined>>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Normaliza un teléfono de El Salvador a +503XXXXXXXX.
 * Acepta 8 dígitos locales con espacios o guiones, con o sin prefijo +503 / 503.
 */
export function normalizeSvPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s-]/g, '');
  const match = /^(?:\+?503)?([0-9]{8})$/.exec(compact);

  return match ? `+503${match[1]}` : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOrderItem(value: unknown): value is OrderItemRequest {
  return (
    isRecord(value) &&
    typeof value.ticketTypeId === 'string' &&
    uuidPattern.test(value.ticketTypeId) &&
    typeof value.quantity === 'number' &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity >= 1 &&
    value.quantity <= 10
  );
}

export function parseOrderRequest(input: unknown): OrderRequestResult {
  const request = isRecord(input) ? input : {};
  const buyer = isRecord(request.buyer) ? request.buyer : {};
  const eventId = typeof request.eventId === 'string' ? request.eventId : '';
  const items = Array.isArray(request.items) ? request.items : [];
  const buyerName = typeof buyer.name === 'string' ? buyer.name.trim() : '';
  const buyerEmail = typeof buyer.email === 'string' ? buyer.email.trim().toLowerCase() : '';
  const requestId = typeof request.requestId === 'string' ? request.requestId : '';
  const rawPhone = typeof buyer.phone === 'string' ? buyer.phone.trim() : '';
  const buyerPhone = rawPhone ? normalizeSvPhone(rawPhone) : null;
  const fieldErrors: NonNullable<Extract<OrderRequestResult, { valid: false }>['fieldErrors']> = {};

  if (!uuidPattern.test(eventId)) {
    fieldErrors.eventId = 'La selección del evento no es válida.';
  }

  if (!uuidPattern.test(requestId)) {
    fieldErrors.requestId = 'La solicitud de compra no es válida. Recarga la página.';
  }

  if (items.length === 0 || items.length > 10 || !items.every(isOrderItem)) {
    fieldErrors.items = 'Revisa las entradas seleccionadas.';
  }

  if (buyerName.length < 2 || buyerName.length > 120) {
    fieldErrors.buyerName = 'Ingresa tu nombre completo.';
  }

  if (buyerEmail.length < 5 || buyerEmail.length > 254 || !emailPattern.test(buyerEmail)) {
    fieldErrors.buyerEmail = 'Ingresa un correo electrónico válido.';
  }

  if (rawPhone && !buyerPhone) {
    fieldErrors.buyerPhone = 'Ingresa un teléfono de El Salvador de 8 dígitos.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { valid: false, fieldErrors };
  }

  return {
    valid: true,
    data: {
      eventId,
      requestId,
      items: items as OrderItemRequest[],
      buyerName,
      buyerEmail,
      buyerPhone,
    },
  };
}

export function getServerDemoCommissionPercent(env: Environment = process.env): number {
  const configured = Number(env.DEMO_COMMISSION_PERCENT ?? env.NEXT_PUBLIC_DEMO_COMMISSION_PERCENT);

  return Number.isFinite(configured) && configured >= 0 && configured <= 100 ? configured : 5;
}
