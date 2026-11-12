import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { buildReceipt } from '../../src/features/checkout/payment-flow';
import { normalizeSvPhone } from '../../src/features/checkout/order';
import { maskEmail, maskPhone } from '../../src/features/ticketing/notifications';
import type { OrderConfirmation } from '../../src/features/ticketing/confirmation';

/**
 * La página /confirmacion/ se renderiza en servidor con la orden real de Supabase, así que el E2E
 * simulado (page.route) no la puede alcanzar. Aquí se renderiza con la carga de la orden sustituida
 * para comprobar, sin base de datos, el comprobante, «Boleto enviado… · Simulado», el enlace .ics y
 * el botón de WhatsApp. La verificación contra órdenes reales sigue en purchase-flow-real.spec.ts.
 */
const loadOrderConfirmation = vi.hoisted(() => vi.fn());

const resolveOrderAccount = vi.hoisted(() => vi.fn());
const getEventDetail = vi.hoisted(() => vi.fn());
vi.mock('../../src/features/catalog/queries', () => ({ getEventDetail }));

vi.mock('../../src/features/ticketing/confirmation', () => ({ loadOrderConfirmation }));
vi.mock('../../src/features/ticketing/claim', () => ({ resolveOrderAccount }));

const orderId = '3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b';
const eventId = '8a1c2d3e-4f5a-4b6c-9d7e-0f1a2b3c4d5e';
const token = 'A'.repeat(43);

const buyerEmail = 'e2e-real-1700000000000@example.test';
const buyerPhone = normalizeSvPhone('7777 1234');

function confirmationFixture(overrides: Partial<OrderConfirmation> = {}): OrderConfirmation {
  const order = { id: orderId, status: 'confirmed', subtotalCents: 2000, feeCents: 100, totalCents: 2100, confirmedAt: '2026-11-20T15:00:00.000Z' };

  return {
    orderId,
    publicCode: 'TC3-1042',
    status: 'confirmed',
    subtotalCents: 2000,
    feeCents: 100,
    totalCents: 2100,
    buyerName: 'Comprador DEMO',
    receipt: buildReceipt({ order, payment: { id: 'pago-demo-1', status: 'demo_approved' } }),
    event: {
      id: eventId,
      title: 'Evento DEMO',
      startsAt: '2026-12-05T15:00:00.000Z',
      mode: 'presencial',
      venue: 'San Salvador',
      url: 'https://ticketera.example.test/eventos/evento-demo/',
    },
    tickets: [{ ticketId: '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', typeName: 'General', qrToken: 'qr-token-de-prueba' }],
    deliveries: [
      { channel: 'email', destinationMasked: maskEmail(buyerEmail) },
      { channel: 'whatsapp', destinationMasked: maskPhone(buyerPhone ?? '') },
    ],
    ...overrides,
  };
}

async function renderPage(): Promise<string> {
  const { default: ConfirmationPage } = await import('../../src/app/confirmacion/[orderId]/[token]/page');
  const element = await ConfirmationPage({ params: Promise.resolve({ orderId, token }) });

  return renderToStaticMarkup(createElement(() => element));
}

describe('página de confirmación', () => {
  beforeEach(() => {
    loadOrderConfirmation.mockReset();
    resolveOrderAccount.mockReset();
    getEventDetail.mockReset();
    getEventDetail.mockResolvedValue({ status: 'unavailable' });
    resolveOrderAccount.mockResolvedValue({ signedIn: false, saved: false });
  });

  test('las máscaras que espera el E2E real coinciden con el código', () => {
    expect(maskEmail(buyerEmail)).toBe('e***@example.test');
    expect(buyerPhone).toBe('+50377771234');
    expect(maskPhone(buyerPhone ?? '')).toBe('+503 ****-1234');
  });

  test('pago aprobado: comprobante, envío simulado enmascarado, .ics y WhatsApp', async () => {
    loadOrderConfirmation.mockResolvedValue({ status: 'ok', confirmation: confirmationFixture() });

    const html = await renderPage();

    expect(html).toContain('Comprobante de prueba: no corresponde a un cobro real');
    expect(html).toContain('Imprimir comprobante');
    expect(html.match(/TC3-1042/g)).toHaveLength(2);
    expect(html).toContain('Referencia de pago');
    expect(html).toContain('Aprobado (simulado)');
    expect(html).toContain('Boleto enviado a e***@example.test · Simulado');
    expect(html).toContain('Boleto enviado por WhatsApp a +503 ****-1234 · Simulado');
    expect(html).not.toContain(buyerEmail);
    expect(html).not.toContain('77771234');
    expect(html).toContain(`href="/calendario/${eventId}/"`);
    expect(html).toContain('Compartir por WhatsApp');
    expect(html).toContain('>Calendario</span>');
    expect(html).toContain('>Compartir</span>');
    expect(html).toContain('>Encuesta</span>');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('normal-case');
    expect(html).toContain('https://wa.me/');
    expect(html).not.toMatch(/wa\.me[^"]*confirmacion/);
  });

  test('orden gratuita: comprobante «Gratuito (sin pago)» y sin referencia de pago', async () => {
    const order = { id: orderId, status: 'confirmed', subtotalCents: 0, feeCents: 0, totalCents: 0, confirmedAt: '2026-11-20T15:00:00.000Z' };
    loadOrderConfirmation.mockResolvedValue({
      status: 'ok',
      confirmation: confirmationFixture({
        subtotalCents: 0,
        feeCents: 0,
        totalCents: 0,
        receipt: buildReceipt({ order, payment: null }),
        deliveries: [{ channel: 'email', destinationMasked: maskEmail(buyerEmail) }],
      }),
    });

    const html = await renderPage();

    expect(html).toContain('Gratuito (sin pago)');
    expect(html).not.toContain('Referencia de pago');
    expect(html).toContain('Boleto enviado a e***@example.test · Simulado');
    expect(html).not.toContain('Boleto enviado por WhatsApp');
  });

  test('pago rechazado: comprobante «Rechazado (simulado)», sin boletos ni envíos ni calendario', async () => {
    const order = { id: orderId, status: 'failed', subtotalCents: 2000, feeCents: 100, totalCents: 2100, confirmedAt: null };
    loadOrderConfirmation.mockResolvedValue({
      status: 'ok',
      confirmation: confirmationFixture({
        status: 'failed',
        receipt: buildReceipt({ order, payment: { id: 'pago-demo-2', status: 'demo_rejected' } }),
        tickets: [],
        deliveries: [],
      }),
    });

    const html = await renderPage();

    expect(html).toContain('Rechazado (simulado)');
    expect(html).toContain('Comprobante de prueba: no corresponde a un cobro real');
    expect(html).not.toContain('Boleto enviado');
    expect(html).not.toContain('Tus boletos');
    expect(html).not.toContain('/calendario/');
  });

  test('invitado: invita a crear una cuenta y vuelve a esta confirmación tras registrarse', async () => {
    loadOrderConfirmation.mockResolvedValue({ status: 'ok', confirmation: confirmationFixture() });

    const html = await renderPage();

    expect(html).toContain('Crea una cuenta para ver tus boletos en Mis boletos');
    expect(html).toContain(encodeURIComponent(`/confirmacion/${orderId}/${token}/`));
    expect(html).not.toContain('Guardamos esta compra en tu cuenta');
    expect(resolveOrderAccount).toHaveBeenCalledWith(orderId, token);
  });

  test('con sesión y compra reclamada: avisa que se guardó en la cuenta y no invita a registrarse', async () => {
    loadOrderConfirmation.mockResolvedValue({ status: 'ok', confirmation: confirmationFixture() });
    resolveOrderAccount.mockResolvedValue({ signedIn: true, saved: true });

    const html = await renderPage();

    expect(html).toContain('Guardamos esta compra en tu cuenta');
    expect(html).toContain('Ver Mis boletos');
    expect(html).not.toContain('Crea una cuenta para ver tus boletos');
  });

  test('con sesión pero sin reclamo (correo distinto): no avisa ni invita a registrarse', async () => {
    loadOrderConfirmation.mockResolvedValue({ status: 'ok', confirmation: confirmationFixture() });
    resolveOrderAccount.mockResolvedValue({ signedIn: true, saved: false });

    const html = await renderPage();

    expect(html).not.toContain('Guardamos esta compra en tu cuenta');
    expect(html).not.toContain('Crea una cuenta para ver tus boletos');
  });
});


test('invita a solicitar suscripción sin afirmar que ya existe', async () => {
  loadOrderConfirmation.mockResolvedValue({ status: 'ok', confirmation: confirmationFixture() });
  resolveOrderAccount.mockResolvedValue({ signedIn: false, saved: false });
  const html = await renderPage();
  expect(html).toContain('newsletter');
  expect(html).toContain('mailto:competitivecodingclub.sv@gmail.com');
  expect(html).not.toContain('Ya estás suscrito');
});

test('recomienda hasta tres eventos públicos distintos del comprado', async () => {
  loadOrderConfirmation.mockResolvedValue({ status: 'ok', confirmation: confirmationFixture() });
  resolveOrderAccount.mockResolvedValue({ signedIn: false, saved: false });
  const eventCard = (id: string) => ({
    id, slug: id, title: `Relacionado ${id}`, startsAt: '2027-05-01T18:00:00Z',
    mode: 'virtual', venue: null, imagePath: null, eventType: { slug: 'congresos', name: 'Congresos' },
    topic: null, location: null, organizer: null, speakers: [], ticketTypes: [{ priceCents: 0, isActive: true }],
  });
  getEventDetail.mockResolvedValue({ status: 'ok', event: { id: eventId }, related: [eventCard(eventId), eventCard('uno'), eventCard('dos'), eventCard('tres'), eventCard('cuatro')] });
  const html = await renderPage();
  expect(html).toContain('Relacionado uno');
  expect(html).toContain('Relacionado tres');
  expect(html).not.toContain('Relacionado cuatro');
  expect(html).not.toContain(`Relacionado ${eventId}`);
});
