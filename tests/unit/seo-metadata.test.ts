import { describe, expect, it } from 'vitest';

import { buildPageMetadata } from '@/lib/seo/metadata';

describe('metadatos SEO', () => {
  it('recorta el título a 60 sin cortar palabras', () => {
    const result = buildPageMetadata({
      title: 'Este título tiene muchas palabras para no superar el límite recomendado de buscadores',
      description: 'Descripción', path: '/', indexable: true, indexingEnabled: true,
    }, 'https://ticketera.example');
    const title = result.title as string;
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).not.toMatch(/buscadore$/);
  });

  it('la descripción no pasa de 160', () => {
    const result = buildPageMetadata({ title: 'Título', description: 'a'.repeat(200), path: '/', indexable: true, indexingEnabled: true }, 'https://ticketera.example');
    expect((result.description as string).length).toBeLessThanOrEqual(160);
  });

  it('el canónico es absoluto y termina en barra', () => {
    const result = buildPageMetadata({ title: 'Título', description: 'Descripción', path: '/congresos', indexable: true, indexingEnabled: true }, 'https://ticketera.example');
    expect(result.alternates?.canonical).toBe('https://ticketera.example/congresos/');
  });

  it('sin interruptor la página es noindex aunque sea indexable', () => {
    const result = buildPageMetadata({ title: 'Título', description: 'Descripción', path: '/', indexable: true, indexingEnabled: false }, 'https://ticketera.example');
    expect(result.robots).toEqual({ index: false, follow: false });
  });

  it('incluye Open Graph con es_SV', () => {
    const result = buildPageMetadata({ title: 'Título', description: 'Descripción', path: '/', indexable: true, indexingEnabled: true, image: '/imagen.webp' }, 'https://ticketera.example');
    expect(result.openGraph).toMatchObject({ locale: 'es_SV', url: 'https://ticketera.example/' });
  });
});
