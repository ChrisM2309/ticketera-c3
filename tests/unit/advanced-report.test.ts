import { describe, expect, it } from 'vitest';

import { buildAdvancedCsv, toCsv } from '@/features/organizers/advanced-report';

describe('reporte superior', () => {
  it('toCsv escapa comas y comillas', () => {
    expect(toCsv([{ name: 'General, VIP', note: 'Incluye "acceso"' }])).toBe(
      'name,note\r\n"General, VIP","Incluye ""acceso"""',
    );
  });

  it('toCsv usa CRLF', () => {
    expect(toCsv([{ day: '2026-11-10', issued: 2 }, { day: '2026-11-11', issued: 3 }])).toBe(
      'day,issued\r\n2026-11-10,2\r\n2026-11-11,3',
    );
  });

  it('toCsv no agrega BOM UTF-8', () => {
    expect(toCsv([{ day: '2026-11-10' }]).startsWith('\uFEFF')).toBe(false);
  });

  it('buildAdvancedCsv entrega ambas secciones sin columnas de comprador', () => {
    const csv = buildAdvancedCsv(
      [{ day: '2026-11-10', issued: 2, checked_in: 1 }],
      [{ ticket_type_name: 'General', issued: 2, checked_in: 1, subtotal_cents: 5000 }],
    );
    expect(csv).toBe(
      'day,issued,checked_in\r\n2026-11-10,2,1\r\nticket_type_name,issued,checked_in,subtotal_cents\r\nGeneral,2,1,5000',
    );
    expect(csv).not.toMatch(/buyer|email|phone|buyer_name/i);
  });

  it('buildAdvancedCsv conserva los encabezados cuando no hay filas', () => {
    expect(buildAdvancedCsv([], [])).toBe(
      'day,issued,checked_in\r\nticket_type_name,issued,checked_in,subtotal_cents',
    );
  });
});
