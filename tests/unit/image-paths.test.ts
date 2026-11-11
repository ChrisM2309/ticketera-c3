import { describe, expect, it } from 'vitest';

import { coverImagePath, publicImagePath } from '../../src/features/catalog/images';

describe('publicImagePath', () => {
  it('acepta rutas locales de las carpetas de imágenes del sitio', () => {
    expect(publicImagePath('/images/tipos/congresos.webp')).toBe('/images/tipos/congresos.webp');
    expect(publicImagePath('/images/stock/crea-01.webp')).toBe('/images/stock/crea-01.webp');
    expect(publicImagePath('/images/events/cumbre-brujula-digital.jpg')).toBe('/images/events/cumbre-brujula-digital.jpg');
  });

  it('rechaza rutas que el navegador tomaría como otro sitio (//) o que salen de las carpetas permitidas', () => {
    expect(publicImagePath('//dominio.example/x.jpg')).toBeNull();
    expect(publicImagePath('/images/temp/evento-ceremonia.jpg')).toBeNull();
    expect(publicImagePath('/images/uploads/foto.jpg')).toBeNull();
    expect(publicImagePath('/api/checkout/orders')).toBeNull();
    expect(publicImagePath('/../../secreto.jpg')).toBeNull();
  });

  it('acepta HTTPS y rechaza otros esquemas', () => {
    expect(publicImagePath('https://ejemplo.example/foto.jpg')).toBe('https://ejemplo.example/foto.jpg');
    expect(publicImagePath('http://ejemplo.example/foto.jpg')).toBeNull();
    expect(publicImagePath('javascript:alert(1)')).toBeNull();
  });
});

describe('coverImagePath', () => {
  it('sin imagen propia usa la foto de la línea', () => {
    expect(coverImagePath({ imagePath: null, eventType: { slug: 'workshops' } })).toBe('/images/stock/stock-sala-conferencia-02.jpg');
  });
});
