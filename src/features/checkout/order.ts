import { createHash, randomBytes } from 'node:crypto';

export type OrderItemRequest = {
  ticketTypeId: string;
  quantity: number;
};

export type OrderRequestData = {
  eventId: string;
  items: OrderItemRequest[];
  buyerName: string;
  buyerEmail: string;
};

export type OrderRequestResult =
  | { valid: true; data: OrderRequestData }
  | {
      valid: false;
      fieldErrors: {
        eventId?: string;
        items?: string;
        buyerName?: string;
        buyerEmail?: string;
      };
    };

type Environment = Readonly<Record<string, string | undefined>>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
  const fieldErrors: NonNullable<Extract<OrderRequestResult, { valid: false }>['fieldErrors']> = {};

  if (!uuidPattern.test(eventId)) {
    fieldErrors.eventId = 'La selección del evento no es válida.';
  }

  if (items.length === 0 || items.length > 10 || !items.every(isOrderItem)) {
    fieldErrors.items = 'Revisá las entradas seleccionadas.';
  }

  if (buyerName.length < 2 || buyerName.length > 120) {
    fieldErrors.buyerName = 'Ingresá tu nombre completo.';
  }

  if (buyerEmail.length < 5 || buyerEmail.length > 254 || !emailPattern.test(buyerEmail)) {
    fieldErrors.buyerEmail = 'Ingresá un correo electrónico válido.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { valid: false, fieldErrors };
  }

  return {
    valid: true,
    data: {
      eventId,
      items: items as OrderItemRequest[],
      buyerName,
      buyerEmail,
    },
  };
}

export function createCheckoutToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashCheckoutToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function getServerDemoCommissionPercent(env: Environment = process.env): number {
  const configured = Number(env.DEMO_COMMISSION_PERCENT ?? env.NEXT_PUBLIC_DEMO_COMMISSION_PERCENT);

  return Number.isFinite(configured) && configured >= 0 && configured <= 100 ? configured : 5;
}
