import { lineForEventType, type CatalogLine } from './lines';

/** Fotos temporales de stock (Unsplash, licencia libre). No son del evento: son mockups. */
const mockupByLine: Readonly<Record<CatalogLine, string>> = {
  compite: '/images/mockups/compite.jpg',
  crea: '/images/mockups/crea.jpg',
  conecta: '/images/mockups/conecta.jpg',
};

/** Carpetas locales permitidas para imágenes de eventos (D-36). */
const allowedLocalPrefixes = ['/images/mockups/', '/images/tipos/', '/images/stock/'] as const;

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

/** Portada del evento; si no tiene imagen propia, una foto temporal de su línea de C3. */
export function coverImagePath(event: { imagePath: string | null; eventType: { slug: string } }): string {
  return publicImagePath(event.imagePath) ?? mockupByLine[lineForEventType(event.eventType.slug)];
}
