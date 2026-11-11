import { describe, expect, it } from 'vitest';

import { coverImagePath, isIllustrativeCover, publicImagePath } from '../../src/features/catalog/images';

describe('publicImagePath', () => {
  it('acepta rutas locales y enlaces HTTPS', () => {
    expect(publicImagePath('/images/mockups/crea.jpg')).toBeNull();
    expect(publicImagePath('https://ejemplo.org/portada.jpg')).toBe('https://ejemplo.org/portada.jpg');
  });

  it('descarta valores vacíos, rutas relativas y otros esquemas', () => {
    expect(publicImagePath(null)).toBeNull();
    expect(publicImagePath('')).toBeNull();
    expect(publicImagePath('images/portada.jpg')).toBeNull();
    expect(publicImagePath('http://ejemplo.org/portada.jpg')).toBeNull();
  });
});

describe('coverImagePath', () => {
  it('usa la imagen propia del evento cuando es válida', () => {
    expect(coverImagePath({ imagePath: '/images/tipos/congresos.webp', eventType: { slug: 'congresos' } })).toBe(
      '/images/tipos/congresos.webp',
    );
  });

  it('usa la foto temporal de la línea de C3 cuando el evento no tiene imagen', () => {
    expect(coverImagePath({ imagePath: null, eventType: { slug: 'competencias' } })).toBe(
      '/images/stock/stock-auditorio-01.jpg',
    );
    expect(coverImagePath({ imagePath: '', eventType: { slug: 'hackathons' } })).toBe(
      '/images/stock/stock-sala-conferencia-02.jpg',
    );
    expect(coverImagePath({ imagePath: null, eventType: { slug: 'congresos' } })).toBe(
      '/images/stock/stock-salon-evento-01.jpg',
    );
  });
});

describe('isIllustrativeCover', () => {
  it('marca fotos locales de stock como imagen de referencia DEMO', () => {
    expect(isIllustrativeCover({ imagePath: '/images/stock/stock-auditorio-01.jpg' })).toBe(true);
  });
});

it('elige una ilustración local al fallar la portada y no repite el mismo intento', async () => {
  const { fallbackCoverPath } = await import('../../src/features/catalog/images');
  const event = { id: 'event-1', eventType: { slug: 'congresos' } };
  const fallback = fallbackCoverPath(event, 'https://example.test/missing.jpg');
  expect(fallback).toMatch(/^\/images\/tipos\/congresos-[12]\.webp$/);
  expect(fallbackCoverPath(event, fallback!)).toBeNull();
});
