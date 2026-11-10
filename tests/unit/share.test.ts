import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

import { ShareButton } from '../../src/components/catalog/share-button';
import { buildWhatsAppShareUrl } from '../../src/features/ticketing/share';

const eventUrl = 'https://demo.ticketera.c3.com.sv/congresos/cloud/congreso-demo/';
const startsAt = '2027-03-13T15:00:00Z';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/features/ticketing/confirmation', () => ({
  loadOrderConfirmation: async () => ({
    status: 'ok',
    confirmation: {
      orderId: '0b0e9d2a-4a3b-4c52-8c1e-6f1f6a1d9b11',
      status: 'confirmed',
      subtotalCents: 1800,
      feeCents: 90,
      totalCents: 1890,
      buyerName: 'Ana',
      receipt: {
        orderNumber: 'C3-0B0E9D2A',
        methodLabel: 'Pago de demostración',
        status: 'approved',
        paymentId: null,
        paidAt: null,
        subtotalCents: 1800,
        feeCents: 90,
        totalCents: 1890,
      },
      event: {
        id: '7d0e9d2a-4a3b-4c52-8c1e-6f1f6a1d9b22',
        title: 'Congreso demo',
        startsAt: '2027-03-13T15:00:00Z',
        mode: 'presencial',
        venue: 'Sede DEMO',
        url: 'https://demo.ticketera.c3.com.sv/congresos/cloud/congreso-demo/',
      },
      tickets: [],
      deliveries: [],
    },
  }),
}));

describe('buildWhatsAppShareUrl', () => {
  test('el enlace empieza con https://wa.me/?text=', () => {
    const url = buildWhatsAppShareUrl({ title: 'Congreso demo', startsAt: new Date(startsAt), eventUrl });

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
  });

  test('el texto incluye título, fecha y enlace del evento', () => {
    const url = buildWhatsAppShareUrl({ title: 'Congreso demo', startsAt: new Date(startsAt), eventUrl });
    const text = decodeURIComponent(url.slice('https://wa.me/?text='.length));
    const parts = text.split(' · ');

    expect(parts[0]).toBe('Congreso demo');
    expect(parts[parts.length - 1]).toBe(eventUrl);
    // 15:00 UTC son las 09:00 en El Salvador (UTC-6, sin horario de verano).
    expect(parts[1]).toContain('2027');
    expect(parts[1]).toContain('marzo');
    expect(parts[1]).toMatch(/9:00/);
  });

  test('codifica los caracteres especiales del texto', () => {
    const url = buildWhatsAppShareUrl({ title: 'IA & Datos #1', startsAt: new Date(startsAt), eventUrl });

    expect(url).not.toContain('&Datos');
    expect(url).not.toContain('#1');
    expect(url).toContain(encodeURIComponent('IA & Datos #1'));
  });
});

describe('ShareButton', () => {
  test('es un enlace externo seguro con icono y texto', () => {
    const html = renderToStaticMarkup(createElement(ShareButton, { title: 'Congreso demo', startsAt, eventUrl }));

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('data-icon="share"');
    expect(html).toContain('Compartir por WhatsApp');
    expect(html).toContain('href="https://wa.me/?text=');
  });

  test('en la confirmación se comparte la URL del evento y no la del pedido', async () => {
    const { default: ConfirmationPage } = await import('../../src/app/confirmacion/[orderId]/[token]/page');
    const element = await ConfirmationPage({
      params: Promise.resolve({
        orderId: '0b0e9d2a-4a3b-4c52-8c1e-6f1f6a1d9b11',
        token: 'A'.repeat(43),
      }),
    });
    const html = renderToStaticMarkup(element);
    const shareHref = /href="(https:\/\/wa\.me\/[^"]*)"/.exec(html)?.[1];

    expect(shareHref).toBeDefined();
    expect(decodeURIComponent(shareHref ?? '').replace(/&amp;/g, '&')).toContain(eventUrl);

    const whatsappHrefs = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)].map((match) => match[1]);

    for (const href of whatsappHrefs) {
      expect(href).not.toContain('/confirmacion/');
      expect(decodeURIComponent(href)).not.toContain('/confirmacion/');
    }
  });
});
