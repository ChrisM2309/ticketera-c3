import { describe, expect, test } from 'vitest';

import { eventCategories } from '../../src/features/catalog/categories';
import { toneForEventType } from '../../src/features/catalog/icons';
import { lineForEventType } from '../../src/features/catalog/lines';
import { contrast, darkTokens, lightTokens } from './helpers/contrast';

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
    const lineas = ['compite', 'crea', 'conecta'] as const;

    // Tema claro (tarjetas): el trazo de cada línea es su variante `-texto` sobre la superficie clara.
    for (const linea of lineas) {
      expect(contrast(lightTokens[`${linea}-texto`], lightTokens.superficie), `${linea} sobre superficie`).toBeGreaterThanOrEqual(3);
    }

    // Tema oscuro (cabecera, menú): la misma variante `-texto` sobre navy y sobre las superficies oscuras.
    for (const linea of lineas) {
      const trazo = darkTokens[`${linea}-texto`];

      expect(trazo, `${linea}-texto definido en el tema oscuro`).toBeDefined();
      expect(contrast(trazo, lightTokens.navy), `${linea} sobre navy`).toBeGreaterThanOrEqual(3);
      expect(contrast(trazo, darkTokens.fondo), `${linea} sobre fondo oscuro`).toBeGreaterThanOrEqual(3);
      expect(contrast(trazo, darkTokens.superficie), `${linea} sobre superficie oscura`).toBeGreaterThanOrEqual(3);
      expect(contrast(trazo, darkTokens['superficie-sutil']), `${linea} sobre superficie sutil oscura`).toBeGreaterThanOrEqual(3);
    }

    // El color base de compite y conecta no sirve como trazo sobre navy: por eso existen las variantes oscuras.
    expect(contrast(lightTokens.compite, lightTokens.navy)).toBeLessThan(3);
    expect(contrast(lightTokens.conecta, lightTokens.navy)).toBeLessThan(3);
  });

  test('en la tarjeta de categoría, sobre el color de su línea, el icono usa el color de texto de esa línea y alcanza 3:1', () => {
    expect(contrast(lightTokens['texto-inverso'], lightTokens.compite)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens['texto-inverso'], lightTokens.conecta)).toBeGreaterThanOrEqual(3);
    expect(contrast(lightTokens.navy, lightTokens.crea)).toBeGreaterThanOrEqual(3);
  });
});
