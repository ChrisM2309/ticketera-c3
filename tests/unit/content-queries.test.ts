import { describe, expect, it } from 'vitest';

import { paginateSummaries } from '@/features/content/queries';

const posts = Array.from({ length: 12 }, (_, index) => ({ slug: `post-${index}`, title: `Post ${index}`, description: 'Descripción', topic: 'eventos', publishedAt: '2026-01-01' }));

describe('consultas de contenido', () => {
  it('la paginación calcula el total', () => {
    expect(paginateSummaries(posts, 2, 10)).toMatchObject({ total: 12, posts: [{ slug: 'post-10' }, { slug: 'post-11' }] });
  });

  it('un borrador no se lista en la fuente pública', () => {
    expect(paginateSummaries(posts.filter((post) => post.slug !== 'post-0'), 1, 10).posts.map((post) => post.slug)).not.toContain('post-0');
  });
});
