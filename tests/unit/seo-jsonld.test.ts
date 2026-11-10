import { describe, expect, it } from 'vitest';

import { articleJsonLd, breadcrumbListJsonLd, organizationJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld';

describe('datos estructurados SEO', () => {
  it('BreadcrumbList numera desde 1 con URLs absolutas', () => {
    const result = breadcrumbListJsonLd([{ name: 'Inicio', path: '/' }, { name: 'Congresos', path: '/congresos/' }], 'https://ticketera.example');
    expect(result).toMatchObject({ '@type': 'BreadcrumbList', itemListElement: [{ position: 1, item: 'https://ticketera.example/' }, { position: 2, item: 'https://ticketera.example/congresos/' }] });
  });

  it('WebSite incluye SearchAction hacia /buscar/', () => {
    const result = webSiteJsonLd('https://ticketera.example');
    expect(result).toMatchObject({ '@type': 'WebSite', potentialAction: { target: 'https://ticketera.example/buscar/?q={search_term_string}' } });
  });

  it('Organization demo lleva el sufijo DEMO', () => {
    const result = organizationJsonLd({ name: 'Organización', description: 'Descripción', path: '/org/', isDemo: true }, 'https://ticketera.example');
    expect(result).toMatchObject({ '@type': 'Organization', name: 'Organización (DEMO)' });
  });

  it('Article trae fechas ISO', () => {
    const result = articleJsonLd({ title: 'Artículo', description: 'Descripción', path: '/blog/articulo/', publishedAt: '2026-01-02T03:04:05Z', updatedAt: '2026-01-03T03:04:05Z' }, 'https://ticketera.example');
    expect(result).toMatchObject({ '@type': 'Article', datePublished: '2026-01-02T03:04:05.000Z', dateModified: '2026-01-03T03:04:05.000Z' });
  });
});
