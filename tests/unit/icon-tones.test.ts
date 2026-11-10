import { describe, expect, test } from 'vitest';

import { eventCategories } from '../../src/features/catalog/categories';
import { toneForEventType } from '../../src/features/catalog/icons';
import { lineForEventType } from '../../src/features/catalog/lines';
import { contrast, lightTokens } from './helpers/contrast';

describe('tonos de icono por tipo de evento', () => {
  test('cada tipo usa el tono de su línea', () => {
    for (const { slug } of eventCategories) {
      expect(toneForEventType(slug), slug).toBe(lineForEventType(slug));
    }

    expect(toneForEventType('competencias')).toBe('compite');
    expect(toneForEventType('hackathons')).toBe('crea');
    expect(toneForEventType('congresos')).toBe('conecta');
    expect(toneForEventType('no-existe')).toBe('conecta');
  });

  test('los tonos de icono alcanzan 3:1 sobre superficie y sobre navy', () => {
    const { superficie, navy } = lightTokens;

    // Sobre la superficie clara de tarjetas: `crea` usa su variante de texto (el turquesa base no alcanza).
    expect(contrast(lightTokens.compite, superficie)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens.conecta, superficie)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens['crea-texto'], superficie)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens.crea, superficie)).toBeLessThan(3);

    // Sobre navy solo el turquesa base alcanza 3:1; compite y conecta no se dibujan como trazo sobre navy.
    expect(contrast(lightTokens.crea, navy)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens.compite, navy)).toBeLessThan(3);
    expect(contrast(lightTokens.conecta, navy)).toBeLessThan(3);
  });

  test('sobre el color de su línea el icono usa el color de texto de esa línea y alcanza 3:1', () => {
    expect(contrast(lightTokens['texto-inverso'], lightTokens.compite)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens['texto-inverso'], lightTokens.conecta)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens.navy, lightTokens.crea)).toBeGreaterThanOrEqual(3);
  });
});
