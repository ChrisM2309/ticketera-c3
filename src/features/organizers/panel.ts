/** Textos del panel del organizador y de la administración mínima. */

const eventStatusLabels = new Map<string, string>([
  ['draft', 'Borrador'],
  ['pending', 'En revisión'],
  ['published', 'Publicado'],
  ['rejected', 'Rechazado'],
  ['archived', 'Archivado'],
]);

export function eventStatusLabel(status: string): string {
  return eventStatusLabels.get(status) ?? 'Estado desconocido';
}

const timeZone = 'America/El_Salvador';

/** Fecha y hora de inicio en la zona de El Salvador (UTC-6), en formato de 24 horas. */
export function formatEventStart(startsAt: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(startsAt));
}

export function pendingReviewText(count: number): string {
  if (count === 1) {
    return 'Hay 1 evento pendiente de revisión.';
  }

  return `Hay ${count} eventos pendientes de revisión.`;
}
