/** Línea de C3 que identifica a cada tipo de evento (DESIGN.md, Marca). */
export type CatalogLine = 'compite' | 'crea' | 'conecta';

const lineByEventType: Readonly<Record<string, CatalogLine>> = {
  competencias: 'compite',
  concursos: 'compite',
  hackathons: 'crea',
  workshops: 'crea',
  bootcamps: 'crea',
};

/** Compite: retos y competencia. Crea: construcción. Conecta: comunidad y empresas (por defecto). */
export function lineForEventType(eventTypeSlug: string): CatalogLine {
  return lineByEventType[eventTypeSlug] ?? 'conecta';
}
