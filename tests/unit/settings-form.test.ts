import { describe, expect, it } from 'vitest';

import { parseSettingsForm } from '@/features/settings/form';

function form(values: Record<string, string>): FormData {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

describe('formulario de ajustes', () => {
  it('convierte $2.50 a 250 centavos', () => {
    const result = parseSettingsForm(form({ dailyRate: '2.50', packagePrice: '1200', eventsIncluded: '10', featuredDaysIncluded: '30', featuredDiscountPercent: '50' }));
    expect(result).toMatchObject({ valid: true, data: { dailyRateCents: 250, packagePriceCents: 120000 } });
  });

  it('vacío deja la tarifa por definir', () => {
    const result = parseSettingsForm(form({ dailyRate: '', packagePrice: '', eventsIncluded: '10', featuredDaysIncluded: '30', featuredDiscountPercent: '50' }));
    expect(result).toMatchObject({ valid: true, data: { dailyRateCents: null, packagePriceCents: null } });
  });

  it('rechaza descuento mayor a 100', () => {
    const result = parseSettingsForm(form({ dailyRate: '2', packagePrice: '1200', eventsIncluded: '10', featuredDaysIncluded: '30', featuredDiscountPercent: '101' }));
    expect(result).toMatchObject({ valid: false });
  });

  it('rechaza tres decimales', () => {
    const result = parseSettingsForm(form({ dailyRate: '2.505', packagePrice: '1200', eventsIncluded: '10', featuredDaysIncluded: '30', featuredDiscountPercent: '50' }));
    expect(result).toMatchObject({ valid: false });
  });
});
