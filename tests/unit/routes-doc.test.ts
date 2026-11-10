import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { buildRobots, buildSitemapEntries, privatePaths } from '../../src/lib/seo/indexing';

test('SEO_ROUTES.md lista cada ruta nueva', () => {
  const document = readFileSync(join(process.cwd(), 'docs/architecture/SEO_ROUTES.md'), 'utf8');
  const routes = [
    '/blog/', '/blog/[slug]/', '/copa/', '/para-empresas/', '/privacidad/', '/terminos/',
    '/calendario/[id]/', '/mis-boletos/', '/cuenta/', '/registro/', '/recuperar/',
    '/panel/destacar/[id]/', '/panel/paquete/', '/panel/eventos/[id]/checkin/',
    '/panel/eventos/[id]/reporte/', '/admin/*', '/confirmacion/[orderId]/[token]/encuesta/',
  ];

  for (const route of routes) {
    expect(document, `Falta documentar ${route}`).toContain(`\`${route}\``);
  }
});

test('las rutas no indexables están en privatePaths o llevan noindex en su página', () => {
  // Se comprueba con indexación habilitada: el interruptor global apagado no puede ocultar un fallo.
  const prefixes = ['/calendario/', '/mis-boletos/', '/cuenta/', '/registro/', '/recuperar/', '/panel/', '/admin/'];
  const paths = [
    ...prefixes, '/calendario/evento/', '/recuperar/nueva/', '/panel/destacar/evento/',
    '/panel/paquete/', '/panel/eventos/evento/checkin/', '/panel/eventos/evento/reporte/',
    '/admin/ajustes/', '/admin/contenido/', '/confirmacion/orden/token/encuesta/',
  ];
  const robots = buildRobots({ indexingEnabled: true, siteUrl: 'https://ticketera.example' });

  for (const path of paths) {
    const prefix = privatePaths.find((entry) => path.startsWith(entry));
    expect(prefix, `Sin exclusión privada para ${path}`).toBeDefined();
    expect(robots.rules).toMatchObject({ disallow: expect.arrayContaining([prefix]) });
  }

  const entries = buildSitemapEntries({
    indexingEnabled: true,
    siteUrl: 'https://ticketera.example',
    catalogPaths: paths,
    eventPaths: [],
    organizerPaths: [],
    blogPaths: [],
    now: new Date('2026-11-10T12:00:00Z'),
  });
  const urls = entries.map((entry) => new URL(entry.url).pathname);
  expect(urls).toContain('/');
  for (const path of paths) expect(urls, `Ruta privada en sitemap: ${path}`).not.toContain(path);
});
