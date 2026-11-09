import { describe, expect, test } from 'vitest';

import { privacySections, termsSections } from '@/features/legal/content';

describe('contenido legal DEMO', () => {
  test('la política de privacidad cubre los ocho apartados', () => {
    expect(privacySections.map((section) => section.id)).toEqual([
      'datos',
      'finalidad',
      'analitica',
      'cookies',
      'conservacion',
      'derechos',
      'contacto',
      'demo',
    ]);
    for (const section of privacySections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });

  test('los términos incluyen pagos simulados y no servicio oficial de C3', () => {
    expect(termsSections.map((section) => section.id)).toEqual([
      'alcance',
      'pagos-simulados',
      'contenido',
      'responsabilidad',
      'demo',
    ]);
    const demo = termsSections.find((section) => section.id === 'demo');
    expect(demo?.paragraphs.join(' ')).toContain('no es un servicio oficial de C3');
  });
});
