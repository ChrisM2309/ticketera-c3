import { describe, expect, it } from 'vitest';

import { suggestSlug, validateBlogPost } from '@/features/content/validation';

describe('validación de contenido', () => {
  it('suggestSlug quita acentos y símbolos', () => {
    expect(suggestSlug('¿Cómo publicar eventos tecnológicos?')).toBe('como-publicar-eventos-tecnologicos');
  });

  it('un borrador solo necesita título y slug', () => {
    expect(validateBlogPost({ title: 'Borrador DEMO', slug: 'borrador-demo' }, 'draft')).toMatchObject({ valid: true });
  });

  it('publicar exige palabra clave, descripción y 200 caracteres', () => {
    const result = validateBlogPost({ title: 'Artículo DEMO', slug: 'articulo-demo', description: 'corta', bodyMd: 'corto', topic: 'eventos' }, 'publish');
    expect(result).toMatchObject({ valid: false });
    if (!result.valid) expect(Object.keys(result.errors)).toEqual(expect.arrayContaining(['description', 'bodyMd', 'keyword']));
  });

  it('rechaza un tema fuera de la lista', () => {
    expect(validateBlogPost({ title: 'Artículo DEMO', slug: 'articulo-demo', topic: 'politica' }, 'draft')).toMatchObject({ valid: false });
  });
});
