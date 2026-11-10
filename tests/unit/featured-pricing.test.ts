import { describe, expect, it } from 'vitest';

import { provisionalFeaturedTotal } from '../../src/features/featured/pricing';

describe('provisionalFeaturedTotal', () => {
  it('7 días a $2 = $14', () => {
    expect(provisionalFeaturedTotal({ days: 7, dailyRateCents: 200 })).toBe(1400);
  });

  it('con 3 días gratis y 50 % de descuento', () => {
    expect(provisionalFeaturedTotal({ days: 7, dailyRateCents: 200, freeDays: 3, discountPercent: 50 })).toBe(400);
  });

  it('redondea mitad hacia arriba', () => {
    expect(provisionalFeaturedTotal({ days: 1, dailyRateCents: 1, discountPercent: 50 })).toBe(1);
  });
});
