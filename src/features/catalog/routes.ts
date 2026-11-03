import type { CatalogCategory, CatalogTaxonomy } from './types';

/**
 * Qué muestra una página de catálogo (SEO_ROUTES.md, secciones 1 a 3):
 * un tipo, un tema, una ciudad, o un tipo dentro de un tema.
 */
export type CatalogScope =
  | { kind: 'event_type'; eventType: CatalogCategory }
  | { kind: 'topic'; topic: CatalogCategory }
  | { kind: 'location'; location: CatalogCategory }
  | { kind: 'event_type_topic'; eventType: CatalogCategory; topic: CatalogCategory };

export type CatalogLink = { label: string; href?: string };

const homeLink: CatalogLink = { label: 'Ticketera C3', href: '/' };

function findBySlug(categories: readonly CatalogCategory[], slug: string): CatalogCategory | null {
  return categories.find((category) => category.slug === slug) ?? null;
}

/**
 * Resuelve un path contra la taxonomía antes de tratarlo como evento (SEO_ROUTES.md, sección 4).
 * Devuelve null para todo lo que no es una página de catálogo: la ruta responde 404.
 */
export function resolveCatalogRoute(
  segments: readonly string[],
  taxonomy: CatalogTaxonomy,
): CatalogScope | null {
  const [first, second, ...rest] = segments;

  if (!first || rest.length > 0) {
    return null;
  }

  if (second === undefined) {
    const eventType = findBySlug(taxonomy.eventTypes, first);

    if (eventType) {
      return { kind: 'event_type', eventType };
    }

    const topic = findBySlug(taxonomy.topics, first);

    if (topic) {
      return { kind: 'topic', topic };
    }

    const location = findBySlug(taxonomy.locations, first);

    return location ? { kind: 'location', location } : null;
  }

  const eventType = findBySlug(taxonomy.eventTypes, first);
  const topic = findBySlug(taxonomy.topics, second);

  return eventType && topic ? { kind: 'event_type_topic', eventType, topic } : null;
}

export function scopePath(scope: CatalogScope): string {
  switch (scope.kind) {
    case 'event_type':
      return `/${scope.eventType.slug}/`;
    case 'topic':
      return `/${scope.topic.slug}/`;
    case 'location':
      return `/${scope.location.slug}/`;
    case 'event_type_topic':
      return `/${scope.eventType.slug}/${scope.topic.slug}/`;
  }
}

export function scopeTitle(scope: CatalogScope): string {
  switch (scope.kind) {
    case 'event_type':
      return scope.eventType.name;
    case 'topic':
      return scope.topic.name;
    case 'location':
      return scope.location.name;
    case 'event_type_topic':
      return `${scope.eventType.name} sobre ${scope.topic.name.toLowerCase()}`;
  }
}

/** Texto introductorio con la keyword de la categoría. No afirma cifras ni disponibilidad. */
export function scopeIntro(scope: CatalogScope): string {
  switch (scope.kind) {
    case 'event_type':
      return `Próximos eventos publicados de ${scope.eventType.name.toLowerCase()} en El Salvador. Fecha, modalidad y precio se ven antes de comprar.`;
    case 'topic':
      return `Próximos eventos publicados sobre ${scope.topic.name.toLowerCase()} en El Salvador, de cualquier tipo.`;
    case 'location':
      return `Eventos presenciales publicados en ${scope.location.name}.`;
    case 'event_type_topic':
      return `${scope.eventType.name} publicados sobre ${scope.topic.name.toLowerCase()} en El Salvador.`;
  }
}

export function scopeBreadcrumbs(scope: CatalogScope): CatalogLink[] {
  switch (scope.kind) {
    case 'event_type':
      return [homeLink, { label: scope.eventType.name }];
    case 'topic':
      return [homeLink, { label: scope.topic.name }];
    case 'location':
      return [homeLink, { label: scope.location.name }];
    case 'event_type_topic':
      return [
        homeLink,
        { label: scope.eventType.name, href: `/${scope.eventType.slug}/` },
        { label: scope.topic.name },
      ];
  }
}

/** Subtemas que enlazan desde un tipo (sus temas) o desde un tema (los tipos). */
export function scopeSubcategories(
  scope: CatalogScope,
  taxonomy: CatalogTaxonomy,
): { label: string; href: string }[] {
  switch (scope.kind) {
    case 'event_type':
      return taxonomy.topics.map((topic) => ({
        label: topic.name,
        href: `/${scope.eventType.slug}/${topic.slug}/`,
      }));
    case 'topic':
      return taxonomy.eventTypes.map((eventType) => ({
        label: eventType.name,
        href: `/${eventType.slug}/${scope.topic.slug}/`,
      }));
    case 'location':
    case 'event_type_topic':
      return [];
  }
}
