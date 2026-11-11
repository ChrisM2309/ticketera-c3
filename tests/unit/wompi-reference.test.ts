import { describe, expect, it } from 'vitest';

import { paymentReference, parsePaymentReference } from '@/features/checkout/wompi/reference';

const id = '33333333-3333-4333-8333-333333333333';

describe('referencia del pago de Wompi', () => {
  it('reconoce una orden de entradas por su uuid', () => {
    expect(parsePaymentReference(id)).toEqual({ kind: 'order', id });
  });

  it('reconoce destacados y paquetes por su prefijo', () => {
    expect(parsePaymentReference(`featured:${id}`)).toEqual({ kind: 'featured', id });
    expect(parsePaymentReference(`package:${id}`)).toEqual({ kind: 'package', id });
  });

  it('rechaza referencias sin formato reconocible', () => {
    expect(parsePaymentReference('')).toBeNull();
    expect(parsePaymentReference('abc')).toBeNull();
    expect(parsePaymentReference(`featured:abc`)).toBeNull();
    expect(parsePaymentReference(`unknown:${id}`)).toBeNull();
    expect(parsePaymentReference(`${id}x`)).toBeNull();
  });

  it('construye la misma referencia que se envía al enlace de pago', () => {
    expect(paymentReference({ kind: 'order', id })).toBe(id);
    expect(paymentReference({ kind: 'featured', id })).toBe(`featured:${id}`);
    expect(parsePaymentReference(paymentReference({ kind: 'package', id }))).toEqual({ kind: 'package', id });
  });
});
