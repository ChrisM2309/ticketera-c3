import { describe, expect, test } from 'vitest';

import { paymentResultTicketsHref } from '../../src/features/checkout/result-link';

const orderId = '33333333-3333-4333-8333-333333333333';
const checkoutToken = 'T'.repeat(43);

describe('destino después del pago', () => {
  test('abre la confirmación privada de esta orden con el token de la misma sesión', () => {
    const stored = JSON.stringify({ orderId, checkoutToken });

    expect(paymentResultTicketsHref(orderId, stored, false)).toBe(`/confirmacion/${orderId}/${checkoutToken}/`);
  });

  test('no usa un token guardado para otra orden', () => {
    const stored = JSON.stringify({ orderId: '44444444-4444-4444-8444-444444444444', checkoutToken });

    expect(paymentResultTicketsHref(orderId, stored, false)).toBe('/ingresar/?next=%2Fmis-boletos%2F');
  });

  test('usa Mis boletos de la cuenta cuando no hay un token de checkout', () => {
    expect(paymentResultTicketsHref(orderId, null, true)).toBe('/mis-boletos/');
  });
});
