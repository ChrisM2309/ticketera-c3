const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timeZone = 'America/El_Salvador';

type ValidationErrors = Partial<Record<'eventId' | 'startsOn' | 'days', string>>;

function todayInElSalvador(today: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(today);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function validCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateFeaturedRequest(input: { eventId: unknown; startsOn: unknown; days: unknown }, today: Date):
  | { valid: true; data: { eventId: string; startsOn: string; days: number } }
  | { valid: false; errors: ValidationErrors } {
  const errors: ValidationErrors = {};
  const eventId = typeof input.eventId === 'string' ? input.eventId : '';
  const startsOn = typeof input.startsOn === 'string' ? input.startsOn : '';
  const daysValue = typeof input.days === 'string' ? input.days : '';

  if (!uuidPattern.test(eventId)) errors.eventId = 'El evento no es válido.';
  if (!validCalendarDate(startsOn)) {
    errors.startsOn = 'La fecha de inicio no es válida.';
  } else if (startsOn < todayInElSalvador(today)) {
    errors.startsOn = 'La fecha de inicio no puede estar en el pasado.';
  }
  if (!/^[1-9][0-9]*$/.test(daysValue) || Number(daysValue) < 1 || Number(daysValue) > 30) {
    errors.days = 'Los días deben estar entre 1 y 30.';
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, data: { eventId, startsOn, days: Number(daysValue) } };
}
