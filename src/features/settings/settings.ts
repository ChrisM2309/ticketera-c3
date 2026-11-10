import { createPublicClient } from '@/lib/supabase/public';

export type PackageBenefits = {
  eventsIncluded: number;
  featuredDaysIncluded: number;
  featuredDiscountPercent: number;
  personalizedFollowUp: boolean;
  advancedReport: boolean;
};

// Supuestos DEMO: el administrador puede reemplazar estos beneficios desde la configuración.
export const defaultPackageBenefits: PackageBenefits = {
  eventsIncluded: 10,
  featuredDaysIncluded: 30,
  featuredDiscountPercent: 50,
  personalizedFollowUp: true,
  advancedReport: true,
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function parsePackageBenefits(value: unknown): PackageBenefits {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return defaultPackageBenefits;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isNonNegativeInteger(candidate.eventsIncluded) ||
    !isNonNegativeInteger(candidate.featuredDaysIncluded) ||
    !isNonNegativeInteger(candidate.featuredDiscountPercent) ||
    candidate.featuredDiscountPercent > 100 ||
    typeof candidate.personalizedFollowUp !== 'boolean' ||
    typeof candidate.advancedReport !== 'boolean'
  ) {
    return defaultPackageBenefits;
  }

  return {
    eventsIncluded: candidate.eventsIncluded,
    featuredDaysIncluded: candidate.featuredDaysIncluded,
    featuredDiscountPercent: candidate.featuredDiscountPercent,
    personalizedFollowUp: candidate.personalizedFollowUp,
    advancedReport: candidate.advancedReport,
  };
}

export type SiteSettings = {
  featuredDailyRateCents: number | null;
  packageAnnualPriceCents: number | null;
  packageBenefits: PackageBenefits;
  indexingEnabled: boolean;
};

const emptySiteSettings: SiteSettings = {
  featuredDailyRateCents: null,
  packageAnnualPriceCents: null,
  packageBenefits: defaultPackageBenefits,
  indexingEnabled: false,
};

function parseCents(value: unknown): number | null {
  return isNonNegativeInteger(value) ? value : null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const client = createPublicClient();
  if (!client) {
    return emptySiteSettings;
  }

  const { data, error } = await client.from('site_settings').select('key, value');
  if (error) {
    throw error;
  }

  const settings = new Map((data ?? []).map((row) => [row.key, row.value]));
  return {
    featuredDailyRateCents: parseCents(settings.get('featured_daily_rate_cents')),
    packageAnnualPriceCents: parseCents(settings.get('package_annual_price_cents')),
    packageBenefits: parsePackageBenefits(settings.get('package_benefits')),
    indexingEnabled: settings.get('indexing_enabled') === true,
  };
}
