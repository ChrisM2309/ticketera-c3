import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { eventCategories } from '../../src/features/catalog/categories';
import { coverImagePath, illustrationForEvent } from '../../src/features/catalog/images';

const tiposDir = join(process.cwd(), 'public', 'images', 'tipos');
const slugs = eventCategories.map((category) => category.slug);

describe('ilustraciones propias por tipo', () => {
  test('hay dos variantes por cada uno de los 12 tipos', () => {
    expect(slugs).toHaveLength(12);

    const faltantes = slugs.flatMap((slug) =>
      [1, 2].map((n) => `${slug}-${n}.webp`).filter((archivo) => !existsSync(join(tiposDir, archivo))),
    );

    expect(faltantes).toEqual([]);
  });

  test('cada WebP tiene su SVG de origen', () => {
    const sinOrigen = slugs.flatMap((slug) =>
      [1, 2]
        .map((n) => `${slug}-${n}.svg`)
        .filter((archivo) => !existsSync(join(process.cwd(), 'design', 'illustrations', archivo))),
    );

    expect(sinOrigen).toEqual([]);
  });

  test('la elección de variante es estable', () => {
    const primera = illustrationForEvent({ eventId: 'evento-estable-01', typeSlug: 'congresos' });
    const segunda = illustrationForEvent({ eventId: 'evento-estable-01', typeSlug: 'congresos' });

    expect(segunda.src).toBe(primera.src);
    expect(primera.src).toMatch(/^\/images\/tipos\/congresos-[12]\.webp$/);
  });

  test('ambas variantes se usan según el evento', () => {
    const variantes = new Set(
      Array.from({ length: 40 }, (_, i) =>
        illustrationForEvent({ eventId: `evento-${i}`, typeSlug: 'meetups' }).src,
      ),
    );

    expect(variantes).toEqual(new Set(['/images/tipos/meetups-1.webp', '/images/tipos/meetups-2.webp']));
  });

  test('el alt declara que es ilustración', () => {
    for (const slug of slugs) {
      expect(illustrationForEvent({ eventId: 'cualquiera', typeSlug: slug }).alt).toMatch(/^Ilustración DEMO de /);
    }
  });

  test('un tipo desconocido cae en la ilustración de una categoría existente', () => {
    const { src } = illustrationForEvent({ eventId: 'x', typeSlug: 'no-existe' });

    expect(src).toMatch(/^\/images\/tipos\/[a-z-]+-[12]\.webp$/);
    expect(existsSync(join(process.cwd(), 'public', src))).toBe(true);
  });
});

describe('portada de respaldo', () => {
  test('un evento sin imagen propia usa la ilustración de su tipo', () => {
    const portada = coverImagePath({ id: 'evento-1', imagePath: null, eventType: { slug: 'hackathons' } });

    expect(portada).toMatch(/^\/images\/tipos\/hackathons-[12]\.webp$/);
  });

  test('la imagen propia del evento tiene prioridad', () => {
    expect(
      coverImagePath({ id: 'evento-1', imagePath: 'https://ejemplo.org/portada.jpg', eventType: { slug: 'hackathons' } }),
    ).toBe('https://ejemplo.org/portada.jpg');
  });
});
