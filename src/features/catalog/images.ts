import { lineForEventType, type CatalogLine } from './lines';

/** Fotos temporales de stock (Unsplash, licencia libre). No son del evento: son mockups. */
const mockupByLine: Readonly<Record<CatalogLine, string>> = {
  compite: '/images/mockups/compite.jpg',
  crea: '/images/mockups/crea.jpg',
  conecta: '/images/mockups/conecta.jpg',
};

/** Solo se aceptan rutas locales o HTTPS; cualquier otra cosa se ignora. */
export function publicImagePath(imagePath: string | null): string | null {
  if (imagePath && (imagePath.startsWith('/') || imagePath.startsWith('https://'))) {
    return imagePath;
  }

  return null;
}

/** Portada del evento; si no tiene imagen propia, una foto temporal de su línea de C3. */
export function coverImagePath(event: { imagePath: string | null; eventType: { slug: string } }): string {
  return publicImagePath(event.imagePath) ?? mockupByLine[lineForEventType(event.eventType.slug)];
}
