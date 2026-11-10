import { afterEach, describe, expect, it, vi } from 'vitest';

import { defaultPackageBenefits, getSiteSettings, parsePackageBenefits } from '../../src/features/settings/settings';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('settings', () => {
  it('parsePackageBenefits cae al default con valores inválidos', () => {
    expect(parsePackageBenefits(null)).toEqual(defaultPackageBenefits);
    expect(
      parsePackageBenefits({
        eventsIncluded: 10,
        featuredDaysIncluded: -1,
        featuredDiscountPercent: 50,
        personalizedFollowUp: true,
        advancedReport: true,
      }),
    ).toEqual(defaultPackageBenefits);
    expect(parsePackageBenefits('muchos')).toEqual(defaultPackageBenefits);
  });

  it('ausencia de tarifa devuelve null', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    await expect(getSiteSettings()).resolves.toEqual({
      featuredDailyRateCents: null,
      packageAnnualPriceCents: null,
      packageBenefits: defaultPackageBenefits,
      indexingEnabled: false,
    });
  });
});
