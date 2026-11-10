import { describe, expect, it } from 'vitest';

import { buildSitemapEntries } from '@/lib/seo/indexing';

const input = {
  indexingEnabled: true,
  siteUrl: 'https://ticketera.example',
  catalogPaths: ['/congresos/', '/congresos/gratis/', '/congresos/'],
  eventPaths: [{ path: '/congresos/evento-demo/', updatedAt: new Date('2026-01-02T00:00:00Z') }],
  organizerPaths: ['/organizadores/demo/'],
  blogPaths: [{ path: '/blog/seo/', updatedAt: new Date('2026-01-03T00:00:00Z') }],
  now: new Date('2026-01-04T00:00:00Z'),
};

describe('sitemap', () => {
  it('apagado devuelve un sitemap vacío', () => {
    expect(buildSitemapEntries({ ...input, indexingEnabled: false })).toEqual([]);
  });

  it('encendido incluye home, categorías, eventos y blog', () => {
    const urls = buildSitemapEntries(input).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining(['https://ticketera.example/', 'https://ticketera.example/congresos/', 'https://ticketera.example/congresos/evento-demo/', 'https://ticketera.example/blog/seo/']));
  });

  it('no incluye rutas privadas', () => {
    const urls = buildSitemapEntries({ ...input, catalogPaths: ['/panel/', '/checkout/'] }).map((entry) => entry.url);
    expect(urls).not.toContain('https://ticketera.example/panel/');
    expect(urls).not.toContain('https://ticketera.example/checkout/');
  });

  it('no repite URLs', () => {
    const urls = buildSitemapEntries(input).map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('todas las URLs son absolutas y terminan en barra', () => {
    for (const entry of buildSitemapEntries(input)) expect(entry.url).toMatch(/^https:\/\/ticketera\.example\/.+\/$|^https:\/\/ticketera\.example\/$/);
  });
});
