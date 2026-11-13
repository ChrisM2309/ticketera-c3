import { isFree, isPaid } from './format';
import type { CatalogModality, CatalogScope } from './routes';
import type { CatalogEvent, EventMode } from './types';

export type PriceFilter = 'gratis' | 'pago';
export type DateFilter = 'semana' | 'mes' | 'fin-de-semana';

/** Filtros GET combinables; los temas válidos vienen de la taxonomía. */
export type CatalogFilters = {
  tema: string | null;
  ciudad: string | null;
  organizador: string | null;
  modalidad: EventMode | null;
  precio: PriceFilter | null;
  fecha: DateFilter | null;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const noCatalogFilters: CatalogFilters = {
  tema: null,
  ciudad: null,
  organizador: null,
  modalidad: null,
  precio: null,
  fecha: null,
};

const modalidades: readonly EventMode[] = ['presencial', 'virtual'];
const precios: readonly PriceFilter[] = ['gratis', 'pago'];
const fechas: readonly DateFilter[] = ['semana', 'mes', 'fin-de-semana'];

/** Ventana de fechas en días desde ahora. */
const dateWindowDays: Readonly<Record<'semana' | 'mes', number>> = { semana: 7, mes: 30 };
const DAY_MS = 24 * 60 * 60 * 1000;
const EL_SALVADOR_TIME_ZONE = 'America/El_Salvador';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return allowed.find((option) => option === value) ?? null;
}

/** Valores que no están en la lista se ignoran; no hay error visible por un parámetro inventado. */
export function parseCatalogFilters(
  params: SearchParams,
  locationSlugs: readonly string[],
  topicSlugs: readonly string[] = [],
  organizerSlugs: readonly string[] = [],
): CatalogFilters {
  const ciudad = firstValue(params.ciudad);
  const tema = firstValue(params.tema);

  return {
    tema: tema && topicSlugs.includes(tema) ? tema : null,
    ciudad: ciudad && locationSlugs.includes(ciudad) ? ciudad : null,
    organizador: oneOf(firstValue(params.organizador), organizerSlugs),
    modalidad: oneOf(firstValue(params.modalidad), modalidades),
    precio: oneOf(firstValue(params.precio), precios),
    fecha: oneOf(firstValue(params.fecha), fechas),
  };
}

/** Cuando la ruta ya es una ciudad, el filtro de ciudad no aplica ni se muestra. */
export function filtersForScope(filters: CatalogFilters, scope: CatalogScope): CatalogFilters {
  return scope.kind === 'location' ? { ...filters, ciudad: null } : filters;
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Object.values(filters).some((value) => value !== null);
}

/** Eventos del alcance que cumplen los filtros, en el mismo orden (fecha ascendente). */
export function filterCatalogEvents(
  events: readonly CatalogEvent[],
  scope: CatalogScope,
  filters: CatalogFilters,
  now: Date,
): CatalogEvent[] {
  return events.filter(
    (event) => matchesScope(event, scope) && matchesFilters(event, filters, now),
  );
}

/** Eventos del catálogo completo que cumplen los filtros de la búsqueda global. */
export function filterCatalogEventsByFilters(
  events: readonly CatalogEvent[],
  filters: CatalogFilters,
  now: Date,
): CatalogEvent[] {
  return events.filter((event) => matchesFilters(event, filters, now));
}

function matchesScope(event: CatalogEvent, scope: CatalogScope): boolean {
  switch (scope.kind) {
    case 'event_type':
      return event.eventType.slug === scope.eventType.slug;
    case 'topic':
      return event.topic?.slug === scope.topic.slug;
    case 'location':
      return event.location?.slug === scope.location.slug;
    case 'event_type_topic':
      return (
        event.eventType.slug === scope.eventType.slug && event.topic?.slug === scope.topic.slug
      );
    case 'modality':
      return (
        event.eventType.slug === scope.eventType.slug &&
        event.topic?.slug === scope.topic.slug &&
        matchesModality(event, scope.modality)
      );
  }
}

/** /virtual/ y /presencial/ comparan la modalidad; /gratis/ compara el precio (árbol de SEO_ROUTES.md, sección 3). */
function matchesModality(event: CatalogEvent, modality: CatalogModality): boolean {
  return modality === 'gratis' ? isFree(event.ticketTypes) : event.mode === modality;
}

function matchesFilters(event: CatalogEvent, filters: CatalogFilters, now: Date): boolean {
  if (filters.tema && event.topic?.slug !== filters.tema) return false;
  if (filters.organizador && event.organizer?.slug !== filters.organizador) return false;
  if (filters.ciudad && event.location?.slug !== filters.ciudad) {
    return false;
  }

  if (filters.modalidad && event.mode !== filters.modalidad) {
    return false;
  }

  if (filters.precio === 'gratis' && !isFree(event.ticketTypes)) {
    return false;
  }

  if (filters.precio === 'pago' && !isPaid(event.ticketTypes)) {
    return false;
  }

  if (filters.fecha === 'fin-de-semana') {
    const eventTime = new Date(event.startsAt).getTime();
    const nowKey = localDateKey(now);
    const eventKey = localDateKey(new Date(event.startsAt));
    const eventDay = new Date(`${eventKey}T12:00:00Z`).getUTCDay();

    if (
      eventTime < now.getTime() ||
      (eventDay !== 0 && eventDay !== 6) ||
      eventKey < nowKey ||
      eventKey > weekendEndKey(nowKey)
    ) {
      return false;
    }
  } else if (
    filters.fecha &&
    new Date(event.startsAt).getTime() > now.getTime() + dateWindowDays[filters.fecha] * DAY_MS
  ) {
    return false;
  }

  return true;
}

function localDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EL_SALVADOR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekendEndKey(startKey: string): string {
  const day = new Date(`${startKey}T12:00:00Z`).getUTCDay();
  const daysToSaturday = day === 0 ? 0 : 6 - day;
  return shiftDateKey(startKey, daysToSaturday + (day === 0 ? 0 : 1));
}

/** Organizadores disponibles en la lista actual, sin duplicados. */
export function catalogOrganizers(events: readonly CatalogEvent[]): { slug: string; name: string }[] {
  const organizers = new Map<string, string>();
  for (const event of events) {
    if (event.organizer?.slug && event.organizer.status === 'active') organizers.set(event.organizer.slug, event.organizer.name);
  }
  return [...organizers].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
