/**
 * Referencia del enlace de pago (identificadorEnlaceComercio). Dice qué compra es:
 *   - orden de entradas: solo el id de la orden (uuid), como antes;
 *   - destacado:         "featured:<uuid>";
 *   - paquete empresas:  "package:<uuid>".
 * Función pura.
 */

export type PaymentSubject = { kind: 'order' | 'featured' | 'package'; id: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parsePaymentReference(reference: string): PaymentSubject | null {
  if (uuidPattern.test(reference)) return { kind: 'order', id: reference };

  const match = /^(featured|package):(.+)$/.exec(reference);
  if (match && uuidPattern.test(match[2])) {
    return { kind: match[1] as 'featured' | 'package', id: match[2] };
  }

  return null;
}

export function paymentReference(subject: PaymentSubject): string {
  return subject.kind === 'order' ? subject.id : `${subject.kind}:${subject.id}`;
}
