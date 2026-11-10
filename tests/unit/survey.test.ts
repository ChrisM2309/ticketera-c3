import { describe, expect, it } from 'vitest';

import { validateSurvey } from '@/features/ticketing/survey';

describe('validateSurvey', () => {
  it('acepta calificaciones enteras de 1 a 5', () => {
    for (const rating of [1, 2, 3, 4, 5]) expect(validateSurvey({ rating, comment: '' }).valid).toBe(true);
  });

  it('recorta comentarios y rechaza más de 500 caracteres', () => {
    expect(validateSurvey({ rating: 5, comment: '  Buena experiencia  ' })).toMatchObject({
      valid: true,
      data: { rating: 5, comment: 'Buena experiencia' },
    });
    expect(validateSurvey({ rating: 5, comment: 'x'.repeat(501) }).valid).toBe(false);
  });

  it('rechaza calificaciones fuera del rango y valores no enteros', () => {
    expect(validateSurvey({ rating: 0, comment: null }).valid).toBe(false);
    expect(validateSurvey({ rating: 6, comment: null }).valid).toBe(false);
    expect(validateSurvey({ rating: 2.5, comment: null }).valid).toBe(false);
  });
});
