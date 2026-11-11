import { describe, expect, it } from 'vitest';

import { readPublishForm } from '../../src/features/organizers/form';
import {
  buildEventSlug,
  localDateTimeToIso,
  parsePublishInput,
  usdToCents,
} from '../../src/features/organizers/publish';

const now = new Date('2027-01-01T00:00:00Z');
const eventTypeId = '11111111-1111-4111-8111-111111111111';
const locationId = '22222222-2222-4222-8222-222222222222';

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Congreso de pruebas',
    description: 'Una descripción suficiente para validar el formulario.',
    agenda: '',
    mode: 'presencial',
    venue: 'Sede DEMO',
    locationId,
    eventTypeId,
    topicId: '',
    imageUrl: '',
    startsAt: '2027-09-01T18:00',
    endsAt: '',
    speakers: [],
    tickets: [
      { name: 'General', price: '10', quantity: '50', maxPerOrder: '4' },
      { name: '', price: '', quantity: '', maxPerOrder: '' },
    ],
    ...overrides,
  };
}

describe('usdToCents', () => {
  it('convierte dólares a centavos enteros sin errores de coma flotante', () => {
    expect(usdToCents('0')).toBe(0);
    expect(usdToCents('12.50')).toBe(1250);
    expect(usdToCents('0.1')).toBe(10);
    expect(usdToCents('99999.99')).toBe(9999999);
  });

  it('rechaza formatos que no son dinero', () => {
    expect(usdToCents('')).toBeNull();
    expect(usdToCents('1.234')).toBeNull();
    expect(usdToCents('-5')).toBeNull();
    expect(usdToCents('12,50')).toBeNull();
  });
});

describe('localDateTimeToIso', () => {
  it('interpreta la hora local de El Salvador (UTC-6, sin horario de verano)', () => {
    expect(localDateTimeToIso('2027-09-01T18:00')).toBe('2027-09-02T00:00:00.000Z');
  });

  it('rechaza valores que no son fecha y hora', () => {
    expect(localDateTimeToIso('mañana')).toBeNull();
    expect(localDateTimeToIso('2027-13-40T10:00')).toBeNull();
  });
});

describe('buildEventSlug', () => {
  it('genera un slug legible con sufijo y sin tildes', () => {
    expect(buildEventSlug('Congreso de Inteligencia Artificial', 'a1b2c3')).toBe(
      'congreso-de-inteligencia-artificial-a1b2c3',
    );
    expect(buildEventSlug('¡Ñandú & café!', 'ff00aa')).toBe('nandu-cafe-ff00aa');
  });

  it('usa un nombre por defecto cuando el título no tiene letras o números', () => {
    expect(buildEventSlug('!!!', '000000')).toBe('evento-000000');
  });
});

describe('parsePublishInput', () => {
  it('acepta un evento presencial con una entrada y calcula montos y fechas', () => {
    const result = parsePublishInput(validInput(), now);

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Congreso de pruebas',
        description: 'Una descripción suficiente para validar el formulario.',
        agenda: null,
        mode: 'presencial',
        venue: 'Sede DEMO',
        locationId,
        eventTypeId,
        topicId: null,
        imageUrl: null,
        startsAt: '2027-09-02T00:00:00.000Z',
        endsAt: null,
        speakers: [],
        includesCertificate: false,
        ticketTypes: [{ name: 'General', priceCents: 1000, quantityTotal: 50, maxPerOrder: 4 }],
      },
    });
  });

  it('un evento en línea no lleva lugar ni ciudad', () => {
    const result = parsePublishInput(validInput({ mode: 'virtual' }), now);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.venue).toMatch(/en línea/);
    }

    const online = parsePublishInput(validInput({ mode: 'virtual', venue: '', locationId: '' }), now);
    expect(online.valid).toBe(true);
    if (online.valid) {
      expect(online.data.venue).toBeNull();
      expect(online.data.locationId).toBeNull();
    }
  });

  it('exige ciudad y lugar en un evento presencial', () => {
    const result = parsePublishInput(validInput({ locationId: '', venue: '' }), now);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.locationId).toBeDefined();
      expect(result.fieldErrors.venue).toBeDefined();
    }
  });

  it('rechaza fechas pasadas y fin anterior al inicio', () => {
    const past = parsePublishInput(validInput({ startsAt: '2026-01-01T10:00' }), now);
    expect(past.valid).toBe(false);
    if (!past.valid) {
      expect(past.fieldErrors.startsAt).toMatch(/futura/);
    }

    const reversed = parsePublishInput(validInput({ endsAt: '2027-09-01T10:00' }), now);
    expect(reversed.valid).toBe(false);
    if (!reversed.valid) {
      expect(reversed.fieldErrors.endsAt).toMatch(/posterior/);
    }
  });

  it('acepta solo portadas https', () => {
    const insecure = parsePublishInput(validInput({ imageUrl: 'http://ejemplo.org/portada.jpg' }), now);
    expect(insecure.valid).toBe(false);

    const secure = parsePublishInput(validInput({ imageUrl: 'https://ejemplo.org/portada.jpg' }), now);
    expect(secure.valid).toBe(true);
  });

  it('exige al menos un tipo de entrada y no más de cuatro', () => {
    const empty = parsePublishInput(
      validInput({ tickets: [{ name: '', price: '', quantity: '', maxPerOrder: '' }] }),
      now,
    );
    expect(empty.valid).toBe(false);
    if (!empty.valid) {
      expect(empty.fieldErrors.tickets).toMatch(/al menos un tipo/);
    }

    const fifth = parsePublishInput(
      validInput({
        tickets: Array.from({ length: 5 }, (_, index) => ({
          name: `Tipo ${index}`,
          price: '0',
          quantity: '10',
          maxPerOrder: '2',
        })),
      }),
      now,
    );
    expect(fifth.valid).toBe(true);
    if (fifth.valid) {
      expect(fifth.data.ticketTypes).toHaveLength(4);
    }
  });

  it('valida cupo y máximo por orden de cada tipo', () => {
    const badQuantity = parsePublishInput(
      validInput({ tickets: [{ name: 'General', price: '0', quantity: '0', maxPerOrder: '4' }] }),
      now,
    );
    expect(badQuantity.valid).toBe(false);

    const badMax = parsePublishInput(
      validInput({ tickets: [{ name: 'General', price: '0', quantity: '5', maxPerOrder: '11' }] }),
      now,
    );
    expect(badMax.valid).toBe(false);
  });

  it('ignora datos extra que mande el navegador', () => {
    const result = parsePublishInput(validInput({ status: 'published', organizerId: 'otro', priceCents: 0 }), now);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).not.toHaveProperty('status');
      expect(result.data).not.toHaveProperty('organizerId');
    }
  });
});

describe('ponentes', () => {
  it('ignora filas de ponente vacías', () => {
    const result = parsePublishInput(
      validInput({
        speakers: [
          { name: 'Ponente DEMO 1', role: 'Rol de ejemplo (DEMO)' },
          { name: '', role: '' },
          { name: '  ', role: '  ' },
          { name: 'Ponente DEMO 2', role: '' },
        ],
      }),
      now,
    );

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.speakers).toEqual([
        { name: 'Ponente DEMO 1', role: 'Rol de ejemplo (DEMO)' },
        { name: 'Ponente DEMO 2', role: '' },
      ]);
    }
  });

  it('rechaza un nombre de más de 80 caracteres', () => {
    const result = parsePublishInput(validInput({ speakers: [{ name: 'a'.repeat(81), role: '' }] }), now);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.speakers).toMatch(/80 caracteres/);
    }
  });

  it('rechaza un rol de más de 120 caracteres y un rol sin nombre', () => {
    const longRole = parsePublishInput(
      validInput({ speakers: [{ name: 'Ponente DEMO 1', role: 'r'.repeat(121) }] }),
      now,
    );
    expect(longRole.valid).toBe(false);

    const noName = parsePublishInput(validInput({ speakers: [{ name: '', role: 'Rol de ejemplo (DEMO)' }] }), now);
    expect(noName.valid).toBe(false);
    if (!noName.valid) {
      expect(noName.fieldErrors.speakers).toBeDefined();
    }
  });

  it('sin filas de ponente el evento queda con lista vacía', () => {
    const result = parsePublishInput(validInput({ speakers: undefined }), now);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.speakers).toEqual([]);
    }
  });
});

describe('readPublishForm', () => {
  it('reúne las filas de entradas del formulario en una lista', () => {
    const formData = new FormData();
    formData.set('title', 'Congreso de pruebas');
    formData.set('ticket-0-name', 'General');
    formData.set('ticket-0-price', '10');
    formData.set('ticket-0-quantity', '50');
    formData.set('ticket-0-max', '4');

    const input = readPublishForm(formData);

    expect(input.title).toBe('Congreso de pruebas');
    expect(input.tickets).toHaveLength(4);
    expect(input.tickets).toEqual(
      expect.arrayContaining([{ name: 'General', price: '10', quantity: '50', maxPerOrder: '4' }]),
    );
  });

  it('reúne las filas de ponentes speakerName1..6 y speakerRole1..6', () => {
    const formData = new FormData();
    formData.set('speakerName1', 'Ponente DEMO 1');
    formData.set('speakerRole1', 'Rol de ejemplo (DEMO)');
    formData.set('speakerName6', 'Ponente DEMO 6');

    const input = readPublishForm(formData);

    expect(input.speakers).toHaveLength(6);
    expect(input.speakers).toEqual(
      expect.arrayContaining([
        { name: 'Ponente DEMO 1', role: 'Rol de ejemplo (DEMO)' },
        { name: 'Ponente DEMO 6', role: null },
      ]),
    );
  });
});
