import type { CatalogCategory, CatalogRoute, CatalogTaxonomy } from './types';

export type CatalogModality = 'virtual' | 'presencial' | 'gratis';

/**
 * Qué muestra una página de catálogo (SEO_ROUTES.md, secciones 1 a 3): un tipo, un tema, una ciudad,
 * un tipo dentro de un tema, o un tipo dentro de un tema con modalidad o precio.
 */
export type CatalogScope =
  | { kind: 'event_type'; eventType: CatalogCategory }
  | { kind: 'topic'; topic: CatalogCategory }
  | { kind: 'location'; location: CatalogCategory }
  | { kind: 'event_type_topic'; eventType: CatalogCategory; topic: CatalogCategory }
  | {
      kind: 'modality';
      eventType: CatalogCategory;
      topic: CatalogCategory;
      modality: CatalogModality;
    };

export type CatalogLink = { label: string; href?: string };

const homeLink: CatalogLink = { label: 'Ticketera C3', href: '/' };

const modalityLabel: Record<CatalogModality, string> = {
  virtual: 'En línea',
  presencial: 'Presencial',
  gratis: 'Gratis',
};

/** Adjetivo dentro de un título: «Congresos en línea sobre…», «Congresos gratuitos sobre…». */
const modalityPhrase: Record<CatalogModality, string> = {
  virtual: 'en línea',
  presencial: 'presenciales',
  gratis: 'gratuitos',
};

function findBySlug(categories: readonly CatalogCategory[], slug: string): CatalogCategory | null {
  return categories.find((category) => category.slug === slug) ?? null;
}

function isModality(value: string): value is CatalogModality {
  return value === 'virtual' || value === 'presencial' || value === 'gratis';
}

function findRoute(segments: readonly string[], taxonomy: CatalogTaxonomy): CatalogRoute | null {
  const path = `/${segments.join('/')}/`;

  return taxonomy.routes.find((route) => route.path === path) ?? null;
}

/**
 * Resuelve un path solo si figura en el árbol del Excel (seo_routes). Cualquier otro path devuelve null
 * y responde 404. Las fichas de evento (/tipo/tema/evento/) se resuelven en T07 (SEO_ROUTES.md, sección 4).
 */
export function resolveCatalogRoute(
  segments: readonly string[],
  taxonomy: CatalogTaxonomy,
): CatalogScope | null {
  const [first, second, third, ...rest] = segments;
  const route = findRoute(segments, taxonomy);

  if (!first || rest.length > 0 || !route) {
    return null;
  }

  switch (route.kind) {
    case 'event_type': {
      const eventType = findBySlug(taxonomy.eventTypes, first);

      return eventType ? { kind: 'event_type', eventType } : null;
    }
    case 'topic': {
      const topic = findBySlug(taxonomy.topics, first);

      return topic ? { kind: 'topic', topic } : null;
    }
    case 'location': {
      const location = findBySlug(taxonomy.locations, first);

      return location ? { kind: 'location', location } : null;
    }
    case 'subtopic': {
      const eventType = findBySlug(taxonomy.eventTypes, first);
      const topic = second ? findBySlug(taxonomy.topics, second) : null;

      return eventType && topic ? { kind: 'event_type_topic', eventType, topic } : null;
    }
    case 'modality': {
      const eventType = findBySlug(taxonomy.eventTypes, first);
      const topic = second ? findBySlug(taxonomy.topics, second) : null;

      return eventType && topic && third && isModality(third)
        ? { kind: 'modality', eventType, topic, modality: third }
        : null;
    }
  }
}

/** Las rutas de modalidad y precio no se indexan hasta tener contenido (D-24). */
export function isCatalogRouteIndexable(
  segments: readonly string[],
  taxonomy: CatalogTaxonomy,
): boolean {
  return findRoute(segments, taxonomy)?.isIndexable ?? false;
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
    case 'modality':
      return `/${scope.eventType.slug}/${scope.topic.slug}/${scope.modality}/`;
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
    case 'modality':
      return `${scope.eventType.name} ${modalityPhrase[scope.modality]} sobre ${scope.topic.name.toLowerCase()}`;
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
    case 'modality':
      return `${scope.eventType.name} ${modalityPhrase[scope.modality]} publicados sobre ${scope.topic.name.toLowerCase()} en El Salvador.`;
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
    case 'modality':
      return [
        homeLink,
        { label: scope.eventType.name, href: `/${scope.eventType.slug}/` },
        { label: scope.topic.name, href: `/${scope.eventType.slug}/${scope.topic.slug}/` },
        { label: modalityLabel[scope.modality] },
      ];
  }
}

function hasSubtopicRoute(taxonomy: CatalogTaxonomy, eventTypeSlug: string, topicSlug: string): boolean {
  const path = `/${eventTypeSlug}/${topicSlug}/`;

  return taxonomy.routes.some((route) => route.kind === 'subtopic' && route.path === path);
}

/** Subtemas que enlazan desde un tipo (sus temas) o desde un tema (los tipos), solo si el árbol los tiene. */
export function scopeSubcategories(
  scope: CatalogScope,
  taxonomy: CatalogTaxonomy,
): { label: string; href: string }[] {
  switch (scope.kind) {
    case 'event_type':
      return taxonomy.topics
        .filter((topic) => hasSubtopicRoute(taxonomy, scope.eventType.slug, topic.slug))
        .map((topic) => ({
          label: topic.name,
          href: `/${scope.eventType.slug}/${topic.slug}/`,
        }));
    case 'topic':
      return taxonomy.eventTypes
        .filter((eventType) => hasSubtopicRoute(taxonomy, eventType.slug, scope.topic.slug))
        .map((eventType) => ({
          label: eventType.name,
          href: `/${eventType.slug}/${scope.topic.slug}/`,
        }));
    case 'location':
    case 'event_type_topic':
    case 'modality':
      return [];
  }
}
