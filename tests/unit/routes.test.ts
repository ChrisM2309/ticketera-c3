import { describe, expect, it } from 'vitest';

import {
  resolveCatalogRoute,
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

  it('resuelve un tipo dentro de un tema', () => {
    expect(resolveCatalogRoute(['congresos', 'inteligencia-artificial'], taxonomy)).toEqual({
      kind: 'event_type_topic',
      eventType: { slug: 'congresos', name: 'Congresos' },
      topic: { slug: 'inteligencia-artificial', name: 'Inteligencia artificial' },
    });
  });

  it('devuelve null para lo que no está en la taxonomía', () => {
    expect(resolveCatalogRoute([], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['zzz'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['congresos', 'zzz'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['zzz', 'cloud'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['hackathons', 'san-salvador'], taxonomy)).toBeNull();
  });

  it('no interpreta slugs reservados de modalidad como categoría', () => {
    expect(resolveCatalogRoute(['virtual'], taxonomy)).toBeNull();
    expect(resolveCatalogRoute(['gratis'], taxonomy)).toBeNull();
  });

  it('devuelve null cuando hay un segmento de más (las fichas llegan en T07)', () => {
    expect(resolveCatalogRoute(['congresos', 'cloud', 'congreso-demo-ia'], taxonomy)).toBeNull();
  });
});

describe('textos y enlaces del alcance', () => {
  it('usa la ruta limpia y el título del tipo, tema o ciudad', () => {
    const tipo = resolveCatalogRoute(['congresos'], taxonomy);
    const combinado = resolveCatalogRoute(['congresos', 'inteligencia-artificial'], taxonomy);

    expect(tipo && scopePath(tipo)).toBe('/congresos/');
    expect(combinado && scopePath(combinado)).toBe('/congresos/inteligencia-artificial/');
    expect(combinado && scopeTitle(combinado)).toBe('Congresos sobre inteligencia artificial');
  });

  it('ofrece los temas desde un tipo y los tipos desde un tema', () => {
    const tipo = resolveCatalogRoute(['congresos'], taxonomy);
    const tema = resolveCatalogRoute(['cloud'], taxonomy);

    expect(tipo && scopeSubcategories(tipo, taxonomy)).toEqual([
      { label: 'Cloud', href: '/congresos/cloud/' },
      { label: 'Inteligencia artificial', href: '/congresos/inteligencia-artificial/' },
    ]);
    expect(tema && scopeSubcategories(tema, taxonomy)).toEqual([
      { label: 'Congresos', href: '/congresos/cloud/' },
      { label: 'Hackathons', href: '/hackathons/cloud/' },
    ]);
  });

  it('describe el texto introductorio sin cifras', () => {
    const tipo = resolveCatalogRoute(['hackathons'], taxonomy);

    expect(tipo && scopeIntro(tipo)).toContain('hackathons en El Salvador');
  });
});
