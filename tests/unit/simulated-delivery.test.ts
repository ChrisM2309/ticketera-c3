import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { SimulatedDelivery } from '../../src/components/checkout/simulated-delivery';

function render(deliveries: Parameters<typeof SimulatedDelivery>[0]['deliveries']): string {
  return renderToStaticMarkup(createElement(SimulatedDelivery, { deliveries }));
}

describe('SimulatedDelivery', () => {
  test('lista el correo enmascarado marcado como simulado', () => {
    const html = render([{ channel: 'email', destinationMasked: 'a***@gmail.com' }]);

    expect(html).toContain('Boleto enviado a a***@gmail.com · Simulado');
    expect(html).not.toContain('WhatsApp a');
  });

  test('agrega WhatsApp cuando existe', () => {
    const html = render([
      { channel: 'email', destinationMasked: 'a***@gmail.com' },
      { channel: 'whatsapp', destinationMasked: '+503 ****-5678' },
    ]);

    expect(html).toContain('Boleto enviado por WhatsApp a +503 ****-5678 · Simulado');
  });

  test('sin envíos no muestra nada', () => {
    expect(render([])).toBe('');
  });
});
