import { describe, expect, it } from 'vitest';

import { validateFeaturedRequest } from '../../src/features/featured/request';

const eventId = '123e4567-e89b-42d3-a456-426614174000';
const today = new Date('2027-09-02T12:00:00-06:00');

describe('validateFeaturedRequest', () => {
  it('rechaza 0 y 31 días', () => {
    expect(validateFeaturedRequest({ eventId, startsOn: '2027-09-03', days: '0' }, today).valid).toBe(false);
    expect(validateFeaturedRequest({ eventId, startsOn: '2027-09-03', days: '31' }, today).valid).toBe(false);
  });

  it('rechaza fecha pasada', () => {
    const result = validateFeaturedRequest({ eventId, startsOn: '2027-09-01', days: '1' }, today);
    expect(result).toEqual({ valid: false, errors: { startsOn: 'La fecha de inicio no puede estar en el pasado.' } });
  });

  it('rechaza eventId inválido', () => {
    const result = validateFeaturedRequest({ eventId: 'no-es-uuid', startsOn: '2027-09-03', days: '7' }, today);
    expect(result.valid).toBe(false);
  });

  it('acepta 7 días desde mañana', () => {
    expect(validateFeaturedRequest({ eventId, startsOn: '2027-09-03', days: '7' }, today)).toEqual({
      valid: true,
      data: { eventId, startsOn: '2027-09-03', days: 7 },
    });
  });
});
