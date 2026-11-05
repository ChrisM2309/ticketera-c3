import { describe, expect, it } from 'vitest';

import {
  orderStatusLabel,
  parseReviewInput,
  reviewResultMessage,
  ticketsIssuedText,
} from '../../src/features/organizers/review';

const eventId = '3f2c8a1e-6b7d-4c9e-8f10-2a4b5c6d7e8f';

describe('parseReviewInput', () => {
  it('acepta un id de evento válido con aprobar o rechazar', () => {
    expect(parseReviewInput({ eventId, decision: 'approve' })).toEqual({ valid: true, eventId, decision: 'approve' });
    expect(parseReviewInput({ eventId, decision: 'reject' })).toEqual({ valid: true, eventId, decision: 'reject' });
  });

  it('rechaza decisiones fuera de la lista', () => {
    expect(parseReviewInput({ eventId, decision: 'published' })).toEqual({ valid: false });
    expect(parseReviewInput({ eventId, decision: null })).toEqual({ valid: false });
    expect(parseReviewInput({ eventId, decision: undefined })).toEqual({ valid: false });
  });

  it('rechaza ids que no son UUID o no llegan como texto', () => {
    expect(parseReviewInput({ eventId: 'no-es-uuid', decision: 'approve' })).toEqual({ valid: false });
    expect(parseReviewInput({ eventId: null, decision: 'approve' })).toEqual({ valid: false });
    expect(parseReviewInput({ eventId: ['a', 'b'], decision: 'approve' })).toEqual({ valid: false });
  });
});

describe('reviewResultMessage', () => {
  it('muestra el resultado de aprobar y rechazar', () => {
    expect(reviewResultMessage({ revision: 'aprobado' })).toMatch(/aprobado/i);
    expect(reviewResultMessage({ revision: 'rechazado' })).toMatch(/rechazado/i);
  });

  it('traduce los códigos de error conocidos y ignora el resto', () => {
    expect(reviewResultMessage({ error: 'no-pendiente' })).toMatch(/pendiente/i);
    expect(reviewResultMessage({ error: 'vencido' })).toMatch(/terminó/i);
    expect(reviewResultMessage({ error: 'revision' })).toMatch(/intenta/i);
    expect(reviewResultMessage({ error: '<script>' })).toBeNull();
    expect(reviewResultMessage({})).toBeNull();
  });
});

describe('textos de moderación', () => {
  it('usa singular y plural en los boletos emitidos', () => {
    expect(ticketsIssuedText(0)).toBe('0 boletos emitidos');
    expect(ticketsIssuedText(1)).toBe('1 boleto emitido');
    expect(ticketsIssuedText(12)).toBe('12 boletos emitidos');
  });

  it('traduce el estado de las órdenes', () => {
    expect(orderStatusLabel('confirmed')).toBe('Confirmada');
    expect(orderStatusLabel('failed')).toBe('Fallida');
    expect(orderStatusLabel('otro')).toBe('Estado desconocido');
  });
});
