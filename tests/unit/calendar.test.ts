import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { buildEventIcs } from '../../src/features/ticketing/calendar';

const baseEvent = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Congreso demo',
  startsAt: new Date('2027-03-13T15:00:00Z'),
  endsAt: new Date('2027-03-13T18:30:00Z') as Date | null,
  location: 'Sede DEMO' as string | null,
  url: 'https://demo.ticketera.c3.com.sv/congresos/cloud/congreso-demo/',
};

function lines(ics: string): string[] {
  return ics.split('\r\n');
}

describe('archivo .ics del evento', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-03-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('empieza y termina con VCALENDAR y usa CRLF', () => {
    const ics = buildEventIcs(baseEvent);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(lines(ics)).toEqual(
      expect.arrayContaining([
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:11111111-1111-4111-8111-111111111111@ticketera.c3.com.sv',
        'DTSTAMP:20270301T120000Z',
        'DTSTART:20270313T150000Z',
        'DTEND:20270313T183000Z',
        'SUMMARY:Congreso demo',
        'LOCATION:Sede DEMO',
        'URL:https://demo.ticketera.c3.com.sv/congresos/cloud/congreso-demo/',
        'END:VEVENT',
      ]),
    );
  });

  test('escapa comas, punto y coma y saltos de línea del título', () => {
    const ics = buildEventIcs({ ...baseEvent, title: 'Cloud, IA; datos\\ruta\nsegunda línea' });

    expect(ics).toContain('SUMMARY:Cloud\\, IA\\; datos\\\\ruta\\nsegunda línea\r\n');
  });

  test('un título con salto de línea no crea una propiedad nueva', () => {
    const ics = buildEventIcs({
      ...baseEvent,
      title: 'Título\r\nATTENDEE:mailto:intruso@example.com\nEND:VEVENT',
    });
    const properties = lines(ics).filter((line) => line !== '');

    expect(properties.some((line) => line.startsWith('ATTENDEE'))).toBe(false);
    expect(properties.filter((line) => line === 'END:VEVENT')).toHaveLength(1);
    expect(properties.filter((line) => line.startsWith('SUMMARY:'))).toHaveLength(1);
  });

  test('sin hora de fin dura una hora', () => {
    const ics = buildEventIcs({ ...baseEvent, endsAt: null });

    expect(lines(ics)).toContain('DTSTART:20270313T150000Z');
    expect(lines(ics)).toContain('DTEND:20270313T160000Z');
  });

  test('omite el lugar cuando el evento no tiene uno', () => {
    const ics = buildEventIcs({ ...baseEvent, location: null });

    expect(ics).not.toContain('LOCATION');
  });

  test('pliega líneas de más de 75 octetos', () => {
    const ics = buildEventIcs({ ...baseEvent, title: `Congreso ${'ñandú '.repeat(40)}final` });
    const encoder = new TextEncoder();
    const physical = lines(ics);

    expect(physical.some((line) => line.startsWith(' '))).toBe(true);

    for (const line of physical) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }

    // Desplegar (quitar CRLF + espacio) devuelve el título completo y sin caracteres partidos.
    const unfolded = ics.replace(/\r\n /g, '');

    expect(unfolded).toContain(`SUMMARY:Congreso ${'ñandú '.repeat(40)}final\r\n`);
    expect(unfolded).not.toContain('�');
  });
});
