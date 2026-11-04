import { describe, expect, it } from 'vitest';

import {
  eventStatusLabel,
  formatEventStart,
  pendingReviewText,
} from '../../src/features/organizers/panel';

describe('textos del panel', () => {
  it('traduce cada estado de evento y no inventa uno desconocido', () => {
    expect(eventStatusLabel('draft')).toBe('Borrador');
    expect(eventStatusLabel('pending')).toBe('En revisión');
    expect(eventStatusLabel('published')).toBe('Publicado');
    expect(eventStatusLabel('rejected')).toBe('Rechazado');
    expect(eventStatusLabel('archived')).toBe('Archivado');
    expect(eventStatusLabel('toString')).toBe('Estado desconocido');
  });

  it('muestra la fecha en la zona horaria de El Salvador', () => {
    // 2027-09-01 00:30 UTC es el 31 de agosto a las 18:30 en El Salvador (UTC-6).
    const text = formatEventStart('2027-09-01T00:30:00Z');

    expect(text).toContain('31');
    expect(text).toContain('18:30');
  });

  it('pluraliza el aviso de revisión pendiente', () => {
    expect(pendingReviewText(0)).toBe('Hay 0 eventos pendientes de revisión.');
    expect(pendingReviewText(1)).toBe('Hay 1 evento pendiente de revisión.');
    expect(pendingReviewText(3)).toBe('Hay 3 eventos pendientes de revisión.');
  });
});
