import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { EventDetailPage } from '../../src/features/catalog/event-detail';
import type { CatalogEventDetail } from '../../src/features/catalog/types';

/** Fecha fija para que «futuro» y «pasado» no dependan del reloj de quien ejecuta la prueba. */
const now = new Date('2027-03-01T12:00:00Z');

function event(overrides: Partial<CatalogEventDetail> = {}): CatalogEventDetail {
  return {
    id: 'event-1',
    slug: 'congreso-demo',
    title: 'Congreso demo',
    description: 'Descripción almacenada del evento.',
    includesCertificate: false,
    agenda: '09:00 Bienvenida',
    startsAt: '2027-03-13T15:00:00Z',
    endsAt: '2027-03-13T18:00:00Z',
    mode: 'presencial',
    venue: 'Sede DEMO',
    imagePath: null,
    status: 'published',
    eventType: { slug: 'congresos', name: 'Congresos' },
    topic: { slug: 'cloud', name: 'Cloud' },
    location: { slug: 'san-salvador', name: 'San Salvador' },
    organizer: { name: 'Organizador DEMO' },
    speakers: [],
    ticketTypes: [
      {
        id: 'ticket-general',
        name: 'General',
        priceCents: 1800,
        isActive: true,
        quantityTotal: 10,
        quantitySold: 3,
        maxPerOrder: 4,
      },
    ],
    ...overrides,
  };
}

function render(detail: CatalogEventDetail): string {
  return renderToStaticMarkup(createElement(EventDetailPage, { event: detail, related: [] }));
}

const soldOutTickets: CatalogEventDetail['ticketTypes'] = [
  {
    id: 'ticket-general',
    name: 'General',
    priceCents: 1800,
    isActive: true,
    quantityTotal: 10,
    quantitySold: 10,
    maxPerOrder: 4,
  },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ficha de evento: caja de compra', () => {
  test('con cupo muestra la barra de compra móvil con el precio y no la insignia Agotado', () => {
    const html = render(event());

    expect(html).toContain('Elegir entradas');
    expect(html).toContain('Desde $18');
    expect(html).toContain('href="#entradas"');
    expect(html).not.toContain('>Agotado<');
  });

  test('un evento publicado, futuro y sin cupos muestra Agotado, sin barra y con el selector deshabilitado', () => {
    const html = render(event({ ticketTypes: soldOutTickets }));

    expect(html).toContain('>Agotado<');
    expect(html).not.toContain('Elegir entradas');
    expect(html).not.toContain('href="#entradas"');
    expect(html).toContain('No hay cupos disponibles para este evento.');
    // El selector no deja cambiar cantidades ni continuar al carrito.
    expect(html).toMatch(/<input[^>]*id="entrada-ticket-general"[^>]*disabled/);
    expect(html).toMatch(/<a[^>]*aria-disabled="true"[^>]*>Continuar al carrito/);
  });

  test('un evento finalizado no muestra la barra ni la insignia Agotado', () => {
    const html = render(
      event({ startsAt: '2027-02-01T15:00:00Z', endsAt: '2027-02-01T18:00:00Z' }),
    );

    expect(html).toContain('Evento finalizado');
    expect(html).not.toContain('Elegir entradas');
    expect(html).not.toContain('>Agotado<');
  });

  test('un evento sin publicar sin cupos no se anuncia como Agotado', () => {
    const html = render(event({ status: 'pending', ticketTypes: soldOutTickets }));

    expect(html).not.toContain('>Agotado<');
    expect(html).not.toContain('Elegir entradas');
  });
});

describe('ficha de evento: ponentes', () => {
  test('sin ponentes no existe el encabezado Ponentes', () => {
    const html = render(event({ speakers: [] }));

    expect(html).not.toContain('Ponentes');
    expect(html).toContain('Sobre el evento');
  });

  test('con ponentes los muestra después de la agenda', () => {
    const html = render(
      event({ speakers: [{ name: 'Ponente DEMO 1', role: 'Rol de ejemplo (DEMO)' }] }),
    );

    expect(html).toContain('>Ponentes<');
    expect(html).toContain('Ponente DEMO 1');
    expect(html.indexOf('>Agenda<')).toBeLessThan(html.indexOf('>Ponentes<'));
  });
});

describe('ficha de evento: acciones sociales', () => {
  test('deja compartir y calendario para la confirmación después de la compra', () => {
    const html = render(event());

    expect(html).not.toContain('/calendario/');
    expect(html).not.toContain('wa.me/');
    expect(html).not.toContain('Compartir por WhatsApp');
  });
});

test('muestra Wompi sandbox y enlace a los términos debajo de la compra', () => {
  const html = render(event());
  expect(html).toContain('Wompi');
  expect(html).toContain('modo de prueba');
  expect(html).toMatch(/href="\/terminos\/?"/);
  expect(html).not.toContain('Incluye certificado');
});

test('muestra certificado solo si el evento lo declara', () => {
  expect(render(event({ includesCertificate: true }))).toContain('Incluye certificado');
  expect(render(event({ includesCertificate: false }))).not.toContain('Incluye certificado');
});
