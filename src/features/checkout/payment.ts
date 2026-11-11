/**
 * Decisión de pago DEMO de la simulación interna. Sigue vigente solo en destacados y paquete de empresas
 * (compras de organizadores, pendientes de migrar a Wompi). Las compras de entradas ya no la usan.
 */
export type PaymentDecision = 'approved' | 'rejected';

/** Resultado que recibe la RPC `confirm_order` (ver supabase/migrations). */
export type PaymentOutcome = 'free' | 'demo_approved' | 'demo_rejected' | 'wompi_approved';

export type ConfirmRequestData = {
  checkoutToken: string;
};

export type ConfirmRequestResult = { valid: true; data: ConfirmRequestData } | { valid: false };

const checkoutTokenPattern = /^[A-Za-z0-9_-]{43}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Solo se acepta el token de checkout. Cualquier otro campo, incluida una decisión de pago o un importe,
 * se ignora: el importe y el resultado de pago los decide el servidor.
 */
export function parseConfirmRequest(input: unknown): ConfirmRequestResult {
  const request = isRecord(input) ? input : {};
  const checkoutToken = typeof request.checkoutToken === 'string' ? request.checkoutToken : '';

  if (!checkoutTokenPattern.test(checkoutToken)) {
    return { valid: false };
  }

  return { valid: true, data: { checkoutToken } };
}

/** Solo las órdenes sin importe se confirman desde el navegador. Las demás pasan por Wompi. */
export function freeOutcomeFor(totalCents: number): 'free' | null {
  return totalCents === 0 ? 'free' : null;
}
