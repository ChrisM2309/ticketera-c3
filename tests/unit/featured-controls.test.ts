import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const controlsSource = readFileSync('src/components/catalog/featured-controls.tsx', 'utf8');

describe('controles del destacado', () => {
  it('mantiene una superficie clara y contraste para las flechas sobre el marco navy', () => {
    expect(controlsSource).toContain('bg-superficie text-texto');
    expect(controlsSource).toContain('bg-navy px-4 py-3');
  });
});
