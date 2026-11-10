import { describe, expect, test } from 'vitest';

import { submitLabel } from '../../src/features/checkout/labels';

describe('etiqueta del botón de checkout', () => {
  test('el botón dice el monto', () => {
    expect(submitLabel(0)).toBe('Confirmar registro gratuito');
    expect(submitLabel(2700)).toBe('Pagar $27 · pago de demostración');
    expect(submitLabel(1050)).toBe('Pagar $10.50 · pago de demostración');
  });
});
