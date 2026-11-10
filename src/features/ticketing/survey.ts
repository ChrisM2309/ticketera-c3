import { maskEmail, maskPhone, type OutboxRow } from './notifications';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function validateSurvey(
  input: unknown,
): { valid: true; data: { rating: number; comment: string | null } } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) return { valid: false, error: 'La respuesta no es válida.' };

  const { rating, comment } = input as { rating?: unknown; comment?: unknown };
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: 'Elige una calificación del 1 al 5.' };
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    return { valid: false, error: 'El comentario no es válido.' };
  }

  const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
  if (trimmedComment.length > 500) return { valid: false, error: 'El comentario no puede superar 500 caracteres.' };

  return { valid: true, data: { rating, comment: trimmedComment || null } };
}

export function buildSurveyNotifications(input: {
  orderId: string;
  email: string;
  phone: string | null;
  eventEndsAt: Date;
}): OutboxRow[] {
  const scheduledFor = new Date(input.eventEndsAt.getTime() + TWO_HOURS_MS);
  if (Number.isNaN(scheduledFor.getTime())) return [];

  const rows: OutboxRow[] = [
    { orderId: input.orderId, channel: 'email', template: 'survey', destinationMasked: maskEmail(input.email), scheduledFor },
  ];
  if (input.phone) {
    rows.push({ orderId: input.orderId, channel: 'whatsapp', template: 'survey', destinationMasked: maskPhone(input.phone), scheduledFor });
  }
  return rows;
}
