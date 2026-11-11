import { eventCategories } from './categories';
import { lineForEventType, type CatalogLine } from './lines';

/**
 * Imágenes ilustrativas de stock por línea (D-36). Son fotos de salas y lugares con licencia libre
 * (créditos en public/images/CREDITOS.md). Quedan como respaldo para eventos sin identificador;
 * los eventos del catálogo usan las ilustraciones propias por tipo (illustrationForEvent).
 */
const illustrationByLine: Readonly<Record<CatalogLine, string>> = {
  compite: '/images/stock/stock-auditorio-01.jpg',
  crea: '/images/stock/stock-sala-conferencia-02.jpg',
  conecta: '/images/stock/stock-salon-evento-01.jpg',
};

/** Carpetas locales permitidas para imágenes de eventos (D-36). */
const allowedLocalPrefixes = ['/images/tipos/', '/images/stock/', '/images/events/'] as const;

/**
 * Solo se aceptan rutas locales de las carpetas del sitio o URL HTTPS. «//» apunta a otro host
 * y «..» sale de la carpeta; ambos se ignoran.
 */
export function publicImagePath(imagePath: string | null): string | null {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith('https://')) {
    return imagePath;
  }

  const esLocalPermitida = allowedLocalPrefixes.some((prefijo) => imagePath.startsWith(prefijo));

  if (esLocalPermitida && !imagePath.includes('..') && !imagePath.startsWith('//')) {
    return imagePath;
  }

  return null;
}

/** Variantes dibujadas por tipo de evento (design/illustrations → public/images/tipos). */
const ILLUSTRATION_VARIANTS = 2;

/** Tipo usado cuando el slug no es una de las 12 categorías. */
const FALLBACK_TYPE_SLUG = eventCategories[0].slug;

/** Hash FNV-1a de 32 bits: estable entre ejecuciones y sin dependencias. */
function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Ilustración propia (DEMO) del tipo de evento. La variante 1 o 2 se elige con un hash estable del
 * identificador del evento, de modo que el mismo evento siempre muestra la misma imagen.
 */
export function illustrationForEvent(input: { eventId: string; typeSlug: string }): { src: string; alt: string } {
  const category = eventCategories.find((candidate) => candidate.slug === input.typeSlug);
  const slug = category?.slug ?? FALLBACK_TYPE_SLUG;
  const variant = (stableHash(input.eventId) % ILLUSTRATION_VARIANTS) + 1;
  const subject = category ? category.label.toLowerCase() : 'evento tecnológico';

  return {
    src: `/images/tipos/${slug}-${variant}.webp`,
    alt: `Ilustración DEMO de ${subject}`,
  };
}

/**
 * Portada del evento; si no tiene imagen propia válida, la ilustración propia de su tipo. Sin
 * identificador del evento no se puede elegir variante y se usa la foto de stock de su línea.
 */
export function coverImagePath(event: {
  id?: string;
  imagePath: string | null;
  eventType: { slug: string };
}): string {
  const own = publicImagePath(event.imagePath);
  if (own) {
    return own;
  }

  if (event.id) {
    return illustrationForEvent({ eventId: event.id, typeSlug: event.eventType.slug }).src;
  }

  return illustrationByLine[lineForEventType(event.eventType.slug)];
}

/** Verdadero cuando la portada es una ilustración y no una foto del evento: se debe indicar en pantalla. */
export function isIllustrativeCover(event: { imagePath: string | null }): boolean {
  const imagePath = publicImagePath(event.imagePath);
  return imagePath === null || imagePath.startsWith('/images/stock/');
}

/** Un solo respaldo local si falla la portada; evita bucles cuando falla el propio respaldo. */
export function fallbackCoverPath(event: { id: string; eventType: { slug: string } }, current: string): string | null {
  const fallback = illustrationForEvent({ eventId: event.id, typeSlug: event.eventType.slug }).src;
  return current === fallback ? null : fallback;
}
