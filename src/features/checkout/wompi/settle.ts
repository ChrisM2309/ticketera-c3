/**
 * Decisión de liquidación de un webhook de Wompi. Función pura: no toca la base ni la red.
 * Solo el resultado documentado «ExitosaAprobada» (docs.wompi.sv/webhook/definicion-webhook) permite emitir
 * boletos. Cualquier otro resultado, incluidos los rechazos, no se interpreta: la orden queda pendiente
 * y caduca a los 30 minutos, porque los valores de rechazo no están en la documentación oficial.
 */

export const APPROVED_RESULT_CODE = 'ExitosaAprobada';

export type OrderStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export type WebhookFacts = {
  transactionId: string;
  /** EnlacePago.IdentificadorEnlaceComercio: aquí va el id de la orden. */
  reference: string;
  /** ResultadoTransaccion del webhook. */
  resultCode: string;
  /** Monto del webhook, en dólares (unidad pendiente de confirmar con la prueba de $0.01). */
  amount: unknown;
  /** EsProductiva del webhook. */
  productive: unknown;
};

/** Lo que devuelve la consulta directa a la API de Wompi: la fuente de verdad. */
export type VerifiedFacts = {
  approved: boolean;
  amount: unknown;
  productive: unknown;
};

export type SettlementDecision =
  | { action: 'approve' }
  | { action: 'ignore'; reason: string }
  | { action: 'reject'; reason: string }
  | { action: 'review'; reason: string };

export type SettlementInput = {
  orderId: string;
  orderStatus: OrderStatus;
  totalCents: number;
  webhook: WebhookFacts;
  verified: VerifiedFacts;
};

/** Convierte un monto en dólares (número o texto decimal) a centavos enteros, o null si no es válido. */
export function dollarsToCents(amount: unknown): number | null {
  if (typeof amount !== 'number' && typeof amount !== 'string') return null;
  if (typeof amount === 'string' && !/^\d+(\.\d{1,2})?$/.test(amount.trim())) return null;

  const dollars = Number(amount);
  if (!Number.isFinite(dollars) || dollars < 0) return null;

  const cents = Math.round(dollars * 100);
  return Math.abs(dollars * 100 - cents) < 0.001 ? cents : null;
}

export function amountMatches(amount: unknown, expectedCents: number): boolean {
  return dollarsToCents(amount) === expectedCents;
}

export function decideSettlement(input: SettlementInput): SettlementDecision {
  const { webhook, verified } = input;

  if (webhook.reference !== input.orderId) {
    return { action: 'reject', reason: 'La referencia no corresponde a la orden.' };
  }

  if (webhook.productive !== false || verified.productive !== false) {
    return { action: 'reject', reason: 'La transacción no es de sandbox.' };
  }

  if (webhook.resultCode !== APPROVED_RESULT_CODE) {
    return { action: 'ignore', reason: 'Resultado no aprobado o no documentado: la orden sigue pendiente.' };
  }

  if (!verified.approved) {
    return { action: 'reject', reason: 'La consulta a Wompi no confirma la aprobación.' };
  }

  if (!amountMatches(webhook.amount, input.totalCents) || !amountMatches(verified.amount, input.totalCents)) {
    return { action: 'reject', reason: 'El importe no coincide con la orden.' };
  }

  switch (input.orderStatus) {
    case 'pending':
      return { action: 'approve' };
    case 'confirmed':
      return { action: 'ignore', reason: 'La orden ya fue confirmada con esta transacción o con otra.' };
    case 'failed':
      return { action: 'review', reason: 'Pago aprobado en una orden marcada como fallida.' };
    case 'cancelled':
      return { action: 'review', reason: 'Pago aprobado después de caducar la orden: revisar manualmente.' };
  }
}

export const PAYMENT_WINDOW_MINUTES = 30;

export function paymentWindowEndsAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + PAYMENT_WINDOW_MINUTES * 60_000);
}

export function isPaymentWindowOpen(createdAt: Date, now: Date): boolean {
  return now.getTime() < paymentWindowEndsAt(createdAt).getTime();
}
