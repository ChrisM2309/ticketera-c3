import { describe, expect, it } from 'vitest';

import { buttonVariants } from '../../src/components/ui/button';

describe('buttonVariants', () => {
  it('la compra usa la acción de la marca y no el turquesa de la línea Crea (D-33)', () => {
    const compra = buttonVariants({ variant: 'compra' });

    expect(compra).toContain('bg-accion');
    expect(compra).toContain('text-texto-inverso');
    expect(compra).not.toContain('bg-compra');
    expect(compra).not.toContain('text-navy');
  });

  it('la etiqueta del botón usa los tokens de etiqueta, no valores sueltos', () => {
    const base = buttonVariants();

    expect(base).toContain('text-etiqueta');
    expect(base).toContain('tracking-etiqueta');
    expect(base).not.toContain('text-[13px]');
    expect(base).not.toContain('tracking-[0.08em]');
  });
});
