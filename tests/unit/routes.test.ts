import { describe, expect, it } from 'vitest';

import {
  isCatalogRouteIndexable,
  resolveCatalogRoute,
  scopeBreadcrumbs,
  scopeIntro,
  scopePath,
  scopeSubcategories,
  scopeTitle,
} from '../../src/features/catalog/routes';
import type { CatalogTaxonomy } from '../../src/features/catalog/types';

const taxonomy: CatalogTaxonomy = {
  eventTypes: [
    { slug: 'congresos', name: 'Congresos' },
    { slug: 'hackathons', name: 'Hackathons' },
  ],
  topics: [
    { slug: 'cloud', name: 'Cloud' },
    { slug: 'inteligencia-artificial', name: 'Inteligencia artificial' },
  ],
  locations: [{ slug: 'san-salvador', name: 'San Salvador' }],
  // Árbol del Excel: /congresos/cloud/ no existe; la modalidad sí, pero sin indexar (D-24).
  routes: [
    { path: '/congresos/', kind: 'event_type', isIndexable: true },
    { path: '/hackathons/', kind: 'event_type', isIndexable: true },
    { path: '/cloud/', kind: 'topic', isIndexable: true },
    { path: '/inteligencia-artificial/', kind: 'topic', isIndexable: true },
    { path: '/san-salvador/', kind: 'location', isIndexable: true },
    { path: '/congresos/inteligencia-artificial/', kind: 'subtopic', isIndexable: true },
    { path: '/congresos/inteligencia-artificial/virtual/', kind: 'modality', isIndexable: false },
    { path: '/congresos/inteligencia-artificial/gratis/', kind: 'modality', isIndexable: false },
  ],
};

describe('resolución de rutas de catálogo', () => {
  it('resuelve un tipo de evento', () => {
    expect(resolveCatalogRoute(['congresos'], taxonomy)).toEqual({
      kind: 'event_type',
      eventType: { slug: 'congresos', name: 'Congresos' },
    });
  });

  it('resuelve un tema y una ciudad de primer nivel', () => {
    expect(resolveCatalogRoute(['cloud'], taxonomy)?.kind).toBe('topic');
    expect(resolveCatalogRoute(['san-salvador'], taxonomy)?.kind).toBe('location');
  });

  it('resuelve un tipo dentro de un tema del árbol', () => {
    expect(resolveCatalogRoute(['congresos', 'inteligencia-artificial'], taxonomy)).toEqual({
      kind: 'event_type_topic',
      eventType: { slug: 'congresos', name: 'Congresos' },
      topic: { slug: 'inteligencia-artificial', name: 'Inteligencia artificial' },
    });
  });

  it('resuelve modalidad y precio dentro de tipo y tema', () => {
    expect(resolveCatalogRoute(['congresos', 'inteligencia-artificial', 'virtual'], taxonomy)).toEqual({
      kind: 'modality',
      eventType: { slug: 'congresos', name: 'Congresos' },
      topic: { slug: 'inteligencia-artificial', name: 'Inteligencia artificial' },
      modality: 'virtual',
    });
    expect(resolveCatalogRoute(['congresos', 'inteligencia-artificial', 'gratis'], taxonomy)?.kind).toBe(
      'modality',
    );
  });

  it('devuelve null para lo que no figura en el árbol del Excel', () => {
    expect(resolveCatalogRoute([], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['zzz'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['congresos', 'zzz'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['zzz', 'cloud'], taxonomy)).toBeNull();
    // Ambos son temas y tipos válidos, pero el árbol no tiene la combinación.
    expect(resolveCatalogRoute(['congresos', 'cloud'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['hackathons', 'san-salvador'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['congresos', 'inteligencia-artificial', 'presencial'], taxonomy)).toBeNull();
  });

  it('no interpreta slugs reservados de modalidad como categoría', () => {
    expect(resolveCatalogRoute(['virtual'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['gratis'], taxonomy)).toBeNull();
  });

  it('devuelve null cuando hay un segmento de más (las fichas llegan en T07)', () => {
    expect(resolveCatalogRoute(['congresos', 'inteligencia-artificial', 'congreso-demo-ia'], taxonomy)).toBeNull();
  });

  it('marca como no indexables las rutas de modalidad', () => {
    expect(isCatalogRouteIndexable(['congresos', 'inteligencia-artificial', 'virtual'], taxonomy)).toBe(false);
    expect(isCatalogRouteIndexable(['congresos', 'inteligencia-artificial'], taxonomy)).toBe(true);
  });
});

describe('textos y enlaces del alcance', () => {
  it('usa la ruta limpia y el título del tipo, tema o combinación', () => {
    const tipo = resolveCatalogRoute(['congresos'], taxonomy);
    const combinado = resolveCatalogRoute(['congresos', 'inteligencia-artificial'], taxonomy);

    expect(tipo && scopePath(tipo)).toBe('/congresos/');
    expect(combinado && scopePath(combinado)).toBe('/congresos/inteligencia-artificial/');
    expect(combinado && scopeTitle(combinado)).toBe('Congresos sobre inteligencia artificial');
  });

  it('usa el adjetivo de la modalidad en el título y la ruta', () => {
    const enLinea = resolveCatalogRoute(['congresos', 'inteligencia-artificial', 'virtual'], taxonomy);
    const gratis = resolveCatalogRoute(['congresos', 'inteligencia-artificial', 'gratis'], taxonomy);

    expect(enLinea && scopePath(enLinea)).toBe('/congresos/inteligencia-artificial/virtual/');
    expect(enLinea && scopeTitle(enLinea)).toBe('Congresos en línea sobre inteligencia artificial');
    expect(gratis && scopeTitle(gratis)).toBe('Congresos gratuitos sobre inteligencia artificial');
    expect(enLinea && scopeBreadcrumbs(enLinea).at(-1)?.label).toBe('En línea');
  });

  it('ofrece solo los subtemas que existen en el árbol', () => {
    const tipo = resolveCatalogRoute(['congresos'], taxonomy);
    const tema = resolveCatalogRoute(['cloud'], taxonomy);
    const iaTema = resolveCatalogRoute(['inteligencia-artificial'], taxonomy);

    expect(tipo && scopeSubcategories(tipo, taxonomy)).toEqual([
      { label: 'Inteligencia artificial', href: '/congresos/inteligencia-artificial/' },
    ]);
    expect(tema && scopeSubcategories(tema, taxonomy)).toEqual([]);
    expect(iaTema && scopeSubcategories(iaTema, taxonomy)).toEqual([
      { label: 'Congresos', href: '/congresos/inteligencia-artificial/' },
    ]);
  });

  it('describe el texto introductorio sin cifras', () => {
    const tipo = resolveCatalogRoute(['hackathons'], taxonomy);

    expect(tipo && scopeIntro(tipo)).toContain('hackathons en El Salvador');
  });
});
