import { describe, expect, it } from 'vitest';

import { formatNoShow, noShowPercent } from '@/features/organizers/report';

describe('reporte de evento', () => {
  it('no-show es null antes de que termine el evento', () => {
    expect(noShowPercent({ issued: 8, checkedIn: 7, eventEnded: false })).toBeNull();
  });

  it('no-show es null sin boletos', () => {
    expect(noShowPercent({ issued: 0, checkedIn: 0, eventEnded: true })).toBeNull();
  });

  it('calcula 12.5 con 8 emitidos y 7 ingresos', () => {
    expect(noShowPercent({ issued: 8, checkedIn: 7, eventEnded: true })).toBe(12.5);
  });

  it('formatNoShow muestra raya o porcentaje con un decimal', () => {
    expect(formatNoShow(null)).toBe('—');
    expect(formatNoShow(12.5)).toBe('12.5 %');
  });
});
