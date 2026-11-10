import { describe, expect, test } from 'vitest';

import { accountNotice, submitLabel } from '../../src/features/checkout/labels';

describe('etiqueta del botón de checkout', () => {
  test('el botón dice el monto', () => {
    expect(submitLabel(0)).toBe('Confirmar registro gratuito');
    expect(submitLabel(2700)).toBe('Pagar $27 · pago de demostración');
    expect(submitLabel(1050)).toBe('Pagar $10.50 · pago de demostración');
  });
});

describe('aviso de cuenta del checkout', () => {
  test('con la cuenta, la orden aparece en Mis boletos', () => {
    expect(accountNotice(true)).toBe('Compras con tu cuenta: la orden aparecerá en Mis boletos.');
  });

  test('como invitado explica que la confirmación con sesión y el mismo correo la guarda', () => {
    const notice = accountNotice(false);

    expect(notice).toContain('como invitado');
    expect(notice).toContain('no se liga a tu cuenta al pagar');
    expect(notice).toContain('abres la confirmación con la sesión iniciada y el mismo correo');
    expect(notice).not.toContain('no se guardará');
  });
});
