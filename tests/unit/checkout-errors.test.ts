import { describe, expect, test } from 'vitest';

import { checkoutErrorView } from '../../src/features/checkout/errors';

describe('checkoutErrorView', () => {
  test('sin cupo ofrece volver al evento', () => {
    for (const code of ['sold_out', 'La cantidad supera los cupos disponibles.', 'Esta entrada ya no está disponible.']) {
      expect(checkoutErrorView(code, 400)).toMatchObject({
        title: 'Ya no hay entradas disponibles',
        action: 'back-to-event',
      });
    }
  });

  test('un evento cerrado o no publicado ofrece volver al evento', () => {
    for (const code of [
      'Este evento no está disponible para compra.',
      'Este evento ya no está disponible para confirmar la compra.',
    ]) {
      expect(checkoutErrorView(code, 400)).toMatchObject({
        title: 'Este evento ya no está disponible',
        action: 'back-to-event',
      });
    }
  });

  test('error del servidor ofrece reintentar', () => {
    for (const status of [500, 502, 503]) {
      expect(checkoutErrorView(null, status)).toMatchObject({
        title: 'No pudimos completar la compra. Intenta de nuevo',
        action: 'retry',
      });
    }

    expect(checkoutErrorView('El checkout DEMO no está configurado todavía. Intentá más tarde.', 503).action).toBe('retry');
  });

  test('un código desconocido nunca expone el mensaje técnico', () => {
    const technical = 'duplicate key value violates unique constraint "orders_pkey"';
    const view = checkoutErrorView(technical, 400);

    expect(view).toMatchObject({ title: 'No pudimos completar la compra. Intenta de nuevo', action: 'retry' });
    expect(`${view.title} ${view.detail}`).not.toContain('duplicate');
    expect(`${view.title} ${view.detail}`).not.toContain('orders_pkey');
    expect(checkoutErrorView(technical, 500).detail).not.toContain('duplicate');
  });

  test('un fallo del servidor tiene prioridad sobre un código de cupo', () => {
    expect(checkoutErrorView('sold_out', 503).action).toBe('retry');
  });
});
