import type { CatalogEvent } from './types';

/** Búsqueda de texto libre sobre el catálogo público (T17: la cabecera ya ofrecía el buscador). */

export const maxSearchLength = 80;

/** Minúsculas y sin acentos: «Inteligencia» encuentra «inteligencia» y «Ciudad» encuentra «ciudad». */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Lee el parámetro q: colapsa espacios, recorta la longitud y acepta solo la primera aparición. */
export function parseSearchQuery(value: string | string[] | undefined): string {
  const raw = (Array.isArray(value) ? value[0] : value) ?? '';

  return raw.replace(/\s+/g, ' ').trim().slice(0, maxSearchLength);
}

/** Cada palabra de la búsqueda debe aparecer en el título, tipo, ciudad, lugar u organizador. */
export function searchCatalogEvents(events: readonly CatalogEvent[], query: string): CatalogEvent[] {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);

  if (terms.length === 0) {
    return [...events];
  }

  return events.filter((event) => {
    const haystack = normalizeSearchText(
      [
        event.title,
        event.eventType.name,
        event.location?.name ?? '',
        event.venue ?? '',
        event.organizer?.name ?? '',
      ].join(' '),
    );

    return terms.every((term) => haystack.includes(term));
  });
}
