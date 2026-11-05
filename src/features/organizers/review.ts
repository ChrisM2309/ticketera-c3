/**
 * Moderación mínima (T16): lógica pura para la revisión de eventos por el administrador.
 * El servidor vuelve a validar cada dato, y la función SQL repite la comprobación de rol.
 */

export const adminReviewPath = '/admin/';

export const reviewDecisions = ['approve', 'reject'] as const;
export type ReviewDecision = (typeof reviewDecisions)[number];

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReviewInput = { valid: true; eventId: string; decision: ReviewDecision } | { valid: false };

/** Lee el formulario de revisión. Cualquier valor fuera de lo esperado invalida la petición. */
export function parseReviewInput(input: { eventId: unknown; decision: unknown }): ReviewInput {
  if (typeof input.eventId !== 'string' || !uuidPattern.test(input.eventId)) {
    return { valid: false };
  }

  if (typeof input.decision !== 'string' || !(reviewDecisions as readonly string[]).includes(input.decision)) {
    return { valid: false };
  }

  return { valid: true, eventId: input.eventId, decision: input.decision as ReviewDecision };
}

/** Mensaje tras volver a la administración. Solo acepta códigos conocidos; el resto se ignora. */
export function reviewResultMessage(params: { revision?: string; error?: string }): string | null {
  if (params.revision === 'aprobado') {
    return 'Evento aprobado. Ya aparece en el catálogo público.';
  }

  if (params.revision === 'rechazado') {
    return 'Evento rechazado. El organizador no lo verá en el catálogo.';
  }

  if (params.error === 'no-pendiente') {
    return 'Ese evento ya no está pendiente de revisión.';
  }

  if (params.error === 'vencido') {
    return 'Ese evento ya terminó y no puede publicarse.';
  }

  if (params.error === 'revision') {
    return 'No pudimos registrar la revisión. Intenta nuevamente.';
  }

  return null;
}

const orderStatusLabels = new Map<string, string>([
  ['pending', 'Pendiente'],
  ['confirmed', 'Confirmada'],
  ['failed', 'Fallida'],
  ['cancelled', 'Cancelada'],
]);

export function orderStatusLabel(status: string): string {
  return orderStatusLabels.get(status) ?? 'Estado desconocido';
}

/** Texto del conteo de boletos emitidos para un evento del organizador. */
export function ticketsIssuedText(count: number): string {
  if (count === 1) {
    return '1 boleto emitido';
  }

  return `${count} boletos emitidos`;
}
