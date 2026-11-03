import { describe, expect, it } from 'vitest';

import { eventPath } from '../../src/features/catalog/paths';
import { lineForEventType } from '../../src/features/catalog/lines';
import {
  eventDateParts,
  isFree,
  modeLabel,
  priceLabel,
} from '../../src/features/catalog/format';

describe('líneas de C3', () => {
  it('asigna Compite a competencias y concursos, y Crea a hackathons, workshops y bootcamps', () => {
    expect(lineForEventType('competencias')).toBe('compite');
    expect(lineForEventType('concursos')).toBe('compite');
    expect(lineForEventType('hackathons')).toBe('crea');
    expect(lineForEventType('workshops')).toBe('crea');
    expect(lineForEventType('bootcamps')).toBe('crea');
  });

  it('usa Conecta para el resto de tipos', () => {
    expect(lineForEventType('congresos')).toBe('conecta');
    expect(lineForEventType('meetups')).toBe('conecta');
  });
});

describe('rutas de la ficha', () => {
  it('usa categoría, tema y evento cuando hay tema', () => {
    expect(
      eventPath({
        slug: 'congreso-demo-ia',
        eventTypeSlug: 'congresos',
        topicSlug: 'inteligencia-artificial',
      }),
    ).toBe('/congresos/inteligencia-artificial/congreso-demo-ia/');
  });

  it('omite el tema cuando el evento no tiene uno', () => {
    expect(
      eventPath({ slug: 'competencia-demo-robotica', eventTypeSlug: 'competencias', topicSlug: null }),
    ).toBe('/competencias/competencia-demo-robotica/');
  });
});

describe('precios', () => {
  it('muestra Gratis cuando todas las entradas activas cuestan cero', () => {
    const tickets = [{ priceCents: 0, isActive: true }];

    expect(priceLabel(tickets)).toBe('Gratis');
    expect(isFree(tickets)).toBe(true);
  });

  it('muestra el precio más bajo como Desde cuando hay entradas de pago', () => {
    const tickets = [
      { priceCents: 2500, isActive: true },
      { priceCents: 1000, isActive: true },
      { priceCents: 0, isActive: false },
    ];

    expect(priceLabel(tickets)).toMatch(/^Desde .*10/);
    expect(isFree(tickets)).toBe(false);
  });

  it('ignora entradas inactivas y avisa cuando no queda ninguna', () => {
    expect(priceLabel([{ priceCents: 500, isActive: false }])).toBe('Sin entradas disponibles');
  });
});

describe('fecha y modalidad', () => {
  it('convierte la fecha a la zona de El Salvador', () => {
    // 21:00 UTC es las 15:00 en El Salvador (UTC-6).
    const parts = eventDateParts('2027-03-13T21:00:00Z');

    expect(parts.day).toBe('13');
    expect(parts.time).toMatch(/3:00/);
  });

  it('describe la modalidad en español', () => {
    expect(modeLabel('virtual')).toBe('En línea');
    expect(modeLabel('presencial')).toBe('Presencial');
  });
});
