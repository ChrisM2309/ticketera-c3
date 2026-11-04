/** Resultado que el comprador elige en el pago DEMO. Nunca incluye datos de tarjeta. */
export type PaymentDecision = 'approved' | 'rejected';

/** Resultado que recibe la RPC `confirm_order` (ver supabase/migrations). */
export type PaymentOutcome = 'free' | 'demo_approved' | 'demo_rejected';

export type ConfirmRequestData = {
  checkoutToken: string;
  decision: PaymentDecision | null;
};

export type ConfirmRequestResult = { valid: true; data: ConfirmRequestData } | { valid: false };

const checkoutTokenPattern = /^[A-Za-z0-9_-]{43}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseConfirmRequest(input: unknown): ConfirmRequestResult {
  const request = isRecord(input) ? input : {};
  const checkoutToken = typeof request.checkoutToken === 'string' ? request.checkoutToken : '';
  const decision = request.decision ?? null;

  if (!checkoutTokenPattern.test(checkoutToken)) {
    return { valid: false };
  }

  if (decision !== null && decision !== 'approved' && decision !== 'rejected') {
    return { valid: false };
  }

  return { valid: true, data: { checkoutToken, decision } };
}

/**
 * Una orden sin importe se confirma gratis y no pide decisión de pago.
 * Una orden con importe necesita el resultado DEMO elegido por el comprador.
 */
export function paymentOutcomeFor(totalCents: number, decision: PaymentDecision | null): PaymentOutcome | null {
  if (totalCents === 0) {
    return 'free';
  }

  if (decision === 'approved') {
    return 'demo_approved';
  }

  if (decision === 'rejected') {
    return 'demo_rejected';
  }

  return null;
}

/** Clave estable por orden: un reintento nunca crea un segundo pago para la misma orden. */
export function paymentIdempotencyKey(orderId: string): string {
  return `demo:${orderId}`;
}
