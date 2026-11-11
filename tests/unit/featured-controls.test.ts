import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const controlsSource = readFileSync('src/components/catalog/featured-controls.tsx', 'utf8');
const carouselSource = readFileSync('src/components/catalog/featured-carousel.tsx', 'utf8');

describe('controles del destacado', () => {
  it('mantiene una superficie clara y contraste para las flechas sobre el marco navy', () => {
    expect(controlsSource).toContain('bg-superficie text-texto');
    expect(controlsSource).toContain('bg-navy px-4 py-3');
  });

  it('mantiene indicadores activos y puntos navegables con contraste visible', () => {
    expect(controlsSource).toContain("index === indice ? 'w-6 bg-texto-inverso' : 'w-2'");
    expect(controlsSource).toContain('focus-visible:outline-texto-inverso');
  });

  it('mantiene el foco del área deslizable dentro del panel visible', () => {
    expect(carouselSource).toContain('focus-visible:ring-inset');
    expect(carouselSource).toContain('focus-visible:ring-texto-inverso');
  });
});
