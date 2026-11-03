import { isFree, isPaid } from './format';
import type { CatalogModality, CatalogScope } from './routes';
import type { CatalogEvent, EventMode } from './types';

export type PriceFilter = 'gratis' | 'pago';
export type DateFilter = 'semana' | 'mes';

/** Filtros de la URL (`?ciudad=&modalidad=&precio=&fecha=`). El tema va en la ruta, no aquí. */
export type CatalogFilters = {
  ciudad: string | null;
  modalidad: EventMode | null;
  precio: PriceFilter | null;
  fecha: DateFilter | null;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const noCatalogFilters: CatalogFilters = {
  ciudad: null,
  modalidad: null,
  precio: null,
  fecha: null,
};

const modalidades: readonly EventMode[] = ['presencial', 'virtual'];
const precios: readonly PriceFilter[] = ['gratis', 'pago'];
const fechas: readonly DateFilter[] = ['semana', 'mes'];

/** Ventana de fechas en días desde ahora. */
const dateWindowDays: Readonly<Record<DateFilter, number>> = { semana: 7, mes: 30 };
const DAY_MS = 24 * 60 * 60 * 1000;

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
): CatalogFilters {
  const ciudad = firstValue(params.ciudad);

  return {
    ciudad: ciudad && locationSlugs.includes(ciudad) ? ciudad : null,
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

  if (
    filters.fecha &&
    new Date(event.startsAt).getTime() > now.getTime() + dateWindowDays[filters.fecha] * DAY_MS
  ) {
    return false;
  }

  return true;
}
