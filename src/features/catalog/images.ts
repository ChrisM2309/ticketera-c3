import { lineForEventType, type CatalogLine } from './lines';

/**
 * Imágenes ilustrativas de stock por línea (D-36). Son fotos de salas y lugares con licencia libre
 * (créditos en public/images/CREDITOS.md). No son del evento: la interfaz lo indica.
 */
const illustrationByLine: Readonly<Record<CatalogLine, string>> = {
  compite: '/images/stock/stock-auditorio-01.jpg',
  crea: '/images/stock/stock-sala-conferencia-02.jpg',
  conecta: '/images/stock/stock-salon-evento-01.jpg',
};

/** Carpetas locales permitidas para imágenes de eventos (D-36). */
const allowedLocalPrefixes = ['/images/tipos/', '/images/stock/'] as const;

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

/** Portada del evento; si no tiene imagen propia válida, una ilustración de stock de su línea. */
export function coverImagePath(event: { imagePath: string | null; eventType: { slug: string } }): string {
  return publicImagePath(event.imagePath) ?? illustrationByLine[lineForEventType(event.eventType.slug)];
}

/** Verdadero cuando la portada es una ilustración y no una foto del evento: se debe indicar en pantalla. */
export function isIllustrativeCover(event: { imagePath: string | null }): boolean {
  return publicImagePath(event.imagePath) === null;
}
