import { parsePackageBenefits, type PackageBenefits } from './settings';

export function valueFromCents(cents: number | null): string {
  return cents === null ? '' : (cents / 100).toFixed(2);
}

export type SettingsFormResult =
  | { valid: true; data: { dailyRateCents: number | null; packagePriceCents: number | null; benefits: PackageBenefits } }
  | { valid: false; errors: Record<string, string> };

function parseUsdCents(value: FormDataEntryValue | null, field: string, errors: Record<string, string>): number | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) {
    errors[field] = 'Usa un importe en USD con hasta dos decimales.';
    return null;
  }
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents)) errors[field] = 'El importe es demasiado grande.';
  return cents;
}

function parseInteger(formData: FormData, field: string, label: string, errors: Record<string, string>): number {
  const value = formData.get(field);
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    errors[field] = `${label} debe ser un entero no negativo.`;
    return 0;
  }
  return Number(value);
}

export function parseSettingsForm(formData: FormData): SettingsFormResult {
  const errors: Record<string, string> = {};
  const dailyRateCents = parseUsdCents(formData.get('dailyRate'), 'dailyRate', errors);
  const packagePriceCents = parseUsdCents(formData.get('packagePrice'), 'packagePrice', errors);
  const eventsIncluded = parseInteger(formData, 'eventsIncluded', 'Los eventos', errors);
  const featuredDaysIncluded = parseInteger(formData, 'featuredDaysIncluded', 'Los días', errors);
  const featuredDiscountPercent = parseInteger(formData, 'featuredDiscountPercent', 'El descuento', errors);

  if (featuredDiscountPercent > 100) errors.featuredDiscountPercent = 'El descuento debe estar entre 0 y 100.';
  if (!Number.isSafeInteger(eventsIncluded) || !Number.isSafeInteger(featuredDaysIncluded) || !Number.isSafeInteger(featuredDiscountPercent)) {
    errors.benefits = 'Los beneficios son demasiado grandes.';
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      dailyRateCents,
      packagePriceCents,
      benefits: parsePackageBenefits({
        eventsIncluded,
        featuredDaysIncluded,
        featuredDiscountPercent,
        personalizedFollowUp: formData.get('personalizedFollowUp') === 'true',
        advancedReport: formData.get('advancedReport') === 'true',
      }),
    },
  };
}
