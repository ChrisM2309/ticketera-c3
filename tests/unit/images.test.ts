import { describe, expect, it } from 'vitest';

import { coverImagePath, publicImagePath } from '../../src/features/catalog/images';

describe('publicImagePath', () => {
  it('acepta rutas locales y enlaces HTTPS', () => {
    expect(publicImagePath('/images/mockups/crea.jpg')).toBe('/images/mockups/crea.jpg');
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
