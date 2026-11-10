/**
 * Validación del formulario para publicar un evento. Es lógica pura: el servidor la vuelve a
 * aplicar antes de llamar a la base, y la base repite los límites con sus restricciones.
 */

import type { Speaker } from '../catalog/types';

export const publishModes = ['presencial', 'virtual'] as const;
export type PublishMode = (typeof publishModes)[number];

export const maxTicketTypes = 4;

/** Filas fijas del formulario y límites que repite la base (events_speakers_check). */
export const speakerFormRows = 6;
export const maxSpeakers = 8;
export const maxSpeakerNameLength = 80;
export const maxSpeakerRoleLength = 120;

export type TicketTypeInput = {
  name: string;
  priceCents: number;
  quantityTotal: number;
  maxPerOrder: number;
};

export type PublishData = {
  title: string;
  description: string;
  agenda: string | null;
  mode: PublishMode;
  venue: string | null;
  locationId: string | null;
  eventTypeId: string;
  topicId: string | null;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  speakers: Speaker[];
  ticketTypes: TicketTypeInput[];
};

export type PublishFieldName =
  | 'title'
  | 'description'
  | 'agenda'
  | 'mode'
  | 'venue'
  | 'locationId'
  | 'eventTypeId'
  | 'topicId'
  | 'imageUrl'
  | 'startsAt'
  | 'endsAt'
  | 'speakers'
  | 'tickets';

export type PublishFieldErrors = Partial<Record<PublishFieldName, string>>;

export type PublishParseResult = { valid: true; data: PublishData } | { valid: false; fieldErrors: PublishFieldErrors };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const usdPattern = /^\d{1,5}(\.\d{1,2})?$/;

/** El Salvador no tiene horario de verano: la hora local siempre es UTC-6. */
const elSalvadorOffset = '-06:00';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Convierte "2027-04-15T18:00" (hora de El Salvador) a ISO con desplazamiento. */
export function localDateTimeToIso(value: string): string | null {
  const match = localDateTimePattern.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00${elSalvadorOffset}`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Precio en dólares a centavos enteros, sin pasar por números de coma flotante. */
export function usdToCents(value: string): number | null {
  if (!usdPattern.test(value)) {
    return null;
  }

  const [whole, fraction = ''] = value.split('.');

  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Slug legible con un sufijo para que no choque con otro evento de igual título. */
export function buildEventSlug(title: string, suffix: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return `${base || 'evento'}-${suffix}`;
}

/** Filas de ponente: las vacías se ignoran; una fila con rol y sin nombre es un error. */
function parseSpeakers(raw: unknown, errors: PublishFieldErrors): Speaker[] {
  const speakers: Speaker[] = [];
  const rows = Array.isArray(raw) ? raw : [];

  for (const row of rows.slice(0, maxSpeakers)) {
    const record = (row ?? {}) as Record<string, unknown>;
    const name = text(record.name);
    const role = text(record.role);

    if (!name && !role) {
      continue;
    }

    if (name.length < 1 || name.length > maxSpeakerNameLength) {
      errors.speakers = `Cada ponente necesita un nombre de 1 a ${maxSpeakerNameLength} caracteres.`;
      return [];
    }

    if (role.length > maxSpeakerRoleLength) {
      errors.speakers = `El rol de un ponente no puede pasar de ${maxSpeakerRoleLength} caracteres.`;
      return [];
    }

    speakers.push({ name, role });
  }

  return speakers;
}

function parseTicketTypes(raw: unknown[], errors: PublishFieldErrors): TicketTypeInput[] {
  const tickets: TicketTypeInput[] = [];

  for (const row of raw.slice(0, maxTicketTypes)) {
    const record = (row ?? {}) as Record<string, unknown>;
    const name = text(record.name);
    const price = text(record.price);
    const quantity = text(record.quantity);
    const maxPerOrder = text(record.maxPerOrder) || '10';

    if (!name && !price && !quantity) {
      continue;
    }

    const priceCents = usdToCents(price);
    const quantityTotal = Number(quantity);
    const maxPerOrderValue = Number(maxPerOrder);

    if (name.length < 2 || name.length > 80) {
      errors.tickets = 'Cada tipo de entrada necesita un nombre de 2 a 80 caracteres.';
      return [];
    }

    if (priceCents === null) {
      errors.tickets = 'Revisa el precio: usa dólares, por ejemplo 12.50, o 0 para gratis.';
      return [];
    }

    if (!/^\d+$/.test(quantity) || quantityTotal < 1 || quantityTotal > 100000) {
      errors.tickets = 'La cantidad de cada tipo debe ser un número entre 1 y 100000.';
      return [];
    }

    if (!/^\d+$/.test(maxPerOrder) || maxPerOrderValue < 1 || maxPerOrderValue > 10) {
      errors.tickets = 'El máximo por orden debe estar entre 1 y 10.';
      return [];
    }

    tickets.push({ name, priceCents, quantityTotal, maxPerOrder: maxPerOrderValue });
  }

  if (tickets.length === 0 && !errors.tickets) {
    errors.tickets = 'Agrega al menos un tipo de entrada.';
  }

  return tickets;
}

/**
 * Valida el formulario completo. `input` llega del navegador: se trata como dato no confiable.
 * `now` se recibe como parámetro para que las pruebas no dependan del reloj.
 */
export function parsePublishInput(input: Record<string, unknown>, now: Date): PublishParseResult {
  const errors: PublishFieldErrors = {};
  const title = text(input.title);
  const description = text(input.description);
  const agenda = text(input.agenda);
  const mode = text(input.mode);
  const venue = text(input.venue);
  const locationId = text(input.locationId);
  const eventTypeId = text(input.eventTypeId);
  const topicId = text(input.topicId);
  const imageUrl = text(input.imageUrl);
  const startsAtLocal = text(input.startsAt);
  const endsAtLocal = text(input.endsAt);

  if (title.length < 3 || title.length > 160) {
    errors.title = 'El título debe tener entre 3 y 160 caracteres.';
  }

  if (description.length < 10 || description.length > 4000) {
    errors.description = 'La descripción debe tener entre 10 y 4000 caracteres.';
  }

  if (agenda.length > 4000) {
    errors.agenda = 'La agenda no puede pasar de 4000 caracteres.';
  }

  if (!(publishModes as readonly string[]).includes(mode)) {
    errors.mode = 'Elige presencial o en línea.';
  }

  if (mode === 'presencial') {
    if (!uuidPattern.test(locationId)) {
      errors.locationId = 'Elige la ciudad del evento.';
    }

    if (venue.length < 2 || venue.length > 200) {
      errors.venue = 'Escribe el lugar del evento (de 2 a 200 caracteres).';
    }
  }

  if (mode === 'virtual' && (venue || locationId)) {
    errors.venue = 'Un evento en línea no lleva lugar ni ciudad.';
  }

  if (!uuidPattern.test(eventTypeId)) {
    errors.eventTypeId = 'Elige el tipo de evento.';
  }

  if (topicId && !uuidPattern.test(topicId)) {
    errors.topicId = 'El tema no es válido.';
  }

  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);

      if (parsed.protocol !== 'https:' || imageUrl.length > 300) {
        errors.imageUrl = 'La portada debe ser un enlace https de hasta 300 caracteres.';
      }
    } catch {
      errors.imageUrl = 'La portada debe ser un enlace https válido.';
    }
  }

  const startsAt = localDateTimeToIso(startsAtLocal);
  const endsAt = endsAtLocal ? localDateTimeToIso(endsAtLocal) : null;

  if (!startsAt) {
    errors.startsAt = 'Indica la fecha y la hora de inicio.';
  } else if (new Date(startsAt) <= now) {
    errors.startsAt = 'La fecha de inicio debe ser futura.';
  }

  if (endsAtLocal && !endsAt) {
    errors.endsAt = 'La fecha de fin no es válida.';
  } else if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    errors.endsAt = 'La fecha de fin debe ser posterior al inicio.';
  }

  const speakers = parseSpeakers(input.speakers, errors);

  const ticketRows = Array.isArray(input.tickets) ? input.tickets : [];
  const ticketTypes = parseTicketTypes(ticketRows, errors);

  if (Object.keys(errors).length > 0 || !startsAt) {
    return { valid: false, fieldErrors: errors };
  }

  return {
    valid: true,
    data: {
      title,
      description,
      agenda: agenda || null,
      mode: mode as PublishMode,
      venue: mode === 'presencial' ? venue : null,
      locationId: mode === 'presencial' ? locationId : null,
      eventTypeId,
      topicId: topicId || null,
      imageUrl: imageUrl || null,
      startsAt,
      endsAt,
      speakers,
      ticketTypes,
    },
  };
}
