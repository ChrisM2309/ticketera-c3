import { describe, expect, it } from 'vitest';

import { mapPublishedPostRow, paginateSummaries } from '@/features/content/queries';

const posts = Array.from({ length: 12 }, (_, index) => ({ slug: `post-${index}`, title: `Post ${index}`, description: 'Descripción', topic: 'eventos', publishedAt: '2026-01-01', keyword: null, authorName: null, coverImagePath: null }));

describe('consultas de contenido', () => {
  it('la paginación calcula el total', () => {
    expect(paginateSummaries(posts, 2, 10)).toMatchObject({ total: 12, posts: [{ slug: 'post-10' }, { slug: 'post-11' }] });
  });

  it('un borrador no se lista en la fuente pública', () => {
    expect(paginateSummaries(posts.filter((post) => post.slug !== 'post-0'), 1, 10).posts.map((post) => post.slug)).not.toContain('post-0');
  });

  it('mapea keyword, autor y portada segura de un artículo publicado', () => {
    expect(mapPublishedPostRow({
      slug: 'post-demo',
      title: 'Artículo DEMO',
      description: 'Descripción suficiente para el artículo.',
      topic: 'eventos',
      published_at: '2026-01-01T00:00:00Z',
      body_md: 'Contenido largo.',
      keyword: 'eventos tecnológicos',
      author_name: 'Fiorella Guzman',
      cover_image_path: '/images/events/networking-cafe-nodo.jpg',
      related_type_slugs: ['networking'],
    }, [{ slug: 'networking', name: 'Networking' }])).toMatchObject({
      keyword: 'eventos tecnológicos',
      authorName: 'Fiorella Guzman',
      coverImagePath: '/images/events/networking-cafe-nodo.jpg',
    });
  });

  it('descarta una portada editorial fuera de las rutas locales permitidas', () => {
    expect(mapPublishedPostRow({
      slug: 'post-demo',
      title: 'Artículo DEMO',
      description: 'Descripción suficiente para el artículo.',
      topic: 'eventos',
      published_at: '2026-01-01T00:00:00Z',
      body_md: 'Contenido largo.',
      keyword: 'eventos tecnológicos',
      author_name: 'Fiorella Guzman',
      cover_image_path: 'https://images.example.com/cover.jpg',
      related_type_slugs: [],
    }, [])).toMatchObject({ coverImagePath: null });
  });
});
