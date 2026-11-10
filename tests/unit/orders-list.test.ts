import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { OrdersList } from '../../src/components/accounts/orders-list';
import type { AccountOrder } from '../../src/features/accounts/orders';

const token = 'T'.repeat(43);

function order(overrides: Partial<AccountOrder> = {}): AccountOrder {
  return {
    orderId: '3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b',
    status: 'confirmed',
    totalCents: 2100,
    createdAt: '2026-11-20T15:00:00.000Z',
    eventTitle: 'Congreso DEMO de IA',
    eventStartsAt: '2026-12-05T14:00:00.000Z',
    confirmationPath: `/confirmacion/3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b/${token}/`,
    ...overrides,
  };
}

const render = (orders: AccountOrder[]) => renderToStaticMarkup(createElement(OrdersList, { orders }));

describe('OrdersList', () => {
  test('sin compras muestra el estado vacío con el botón Ver eventos', () => {
    const html = render([]);

    expect(html).toContain('Aún no tienes compras');
    expect(html).toContain('Ver eventos');
    expect(html).toContain('href="/"');
  });

  test('una orden confirmada enlaza a sus boletos y marca el total como simulado', () => {
    const html = render([order()]);

    expect(html).toContain('Congreso DEMO de IA');
    expect(html).toContain('Confirmada');
    expect(html).toContain('Total · Simulado');
    expect(html).toContain('Ver boletos');
    // Link no agrega la barra final fuera de Next (trailingSlash vive en next.config.ts); el enlace conserva la ruta.
    expect(html).toContain(`href="/confirmacion/3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b/${token}`);
  });

  test('una orden fallida se muestra con su estado y sin pedir boletos', () => {
    const html = render([order({ status: 'failed' })]);

    expect(html).toContain('Fallida');
    expect(html).toContain('Ver detalle');
    expect(html).not.toContain('Ver boletos');
  });

  test('una orden sin enlace no genera un href de confirmación', () => {
    const html = render([order({ confirmationPath: '' })]);

    expect(html).not.toContain('/confirmacion/');
    expect(html).toContain('No hay un enlace de boletos disponible');
  });
});
