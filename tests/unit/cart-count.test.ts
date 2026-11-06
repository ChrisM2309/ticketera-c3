import { describe, expect, it } from 'vitest';

import { cartItemCount, type CartSnapshot } from '../../src/features/checkout/cart';

function snapshotWith(quantities: number[]): CartSnapshot {
  return {
    version: 1,
    event: {} as CartSnapshot['event'],
    items: quantities.map((quantity, index) => ({ ticketTypeId: `t${index}`, quantity })),
  } as CartSnapshot;
}

describe('cartItemCount', () => {
  it('cuenta cero sin carrito guardado', () => {
    expect(cartItemCount(null)).toBe(0);
  });

  it('suma las cantidades de todos los tipos de entrada', () => {
    expect(cartItemCount(snapshotWith([2, 1, 3]))).toBe(6);
  });
});
