import { describe, expect, it } from 'vitest';

import { safeNextPath } from '../../src/lib/auth/next-path';

describe('destino seguro tras ingresar', () => {
  const fallback = '/mis-boletos/';

  it('acepta /checkout/', () => {
    expect(safeNextPath('/checkout/', fallback)).toBe('/checkout/');
  });

  it('conserva la consulta de una ruta interna', () => {
    expect(safeNextPath('/buscar/?q=react', fallback)).toBe('/buscar/?q=react');
  });

  it('rechaza //evil.com', () => {
    expect(safeNextPath('//evil.com', fallback)).toBe(fallback);
  });

  it('rechaza https://evil.com', () => {
    expect(safeNextPath('https://evil.com', fallback)).toBe(fallback);
  });

  it('rechaza /\\evil.com', () => {
    expect(safeNextPath('/\\evil.com', fallback)).toBe(fallback);
  });

  it('rechaza esquemas sin barra inicial y saltos de línea', () => {
    expect(safeNextPath('javascript:alert(1)', fallback)).toBe(fallback);
    expect(safeNextPath('/panel/\r\nLocation: https://evil.com', fallback)).toBe(fallback);
  });

  it('devuelve el fallback si es nulo', () => {
    expect(safeNextPath(null, fallback)).toBe(fallback);
    expect(safeNextPath(undefined, fallback)).toBe(fallback);
    expect(safeNextPath('', fallback)).toBe(fallback);
  });
});
