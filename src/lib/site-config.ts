function parseDemoCommissionPercent(value: string | undefined): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 5;
}

export const siteConfig = {
  name: 'Ticketera C3',
  demoLabel: 'DEMO',
  currency: 'USD',
  locale: 'es-SV',
  demoCommissionPercent: parseDemoCommissionPercent(
    process.env.NEXT_PUBLIC_DEMO_COMMISSION_PERCENT ?? process.env.DEMO_COMMISSION_PERCENT,
  ),
  description:
    'Descubrí eventos tecnológicos en El Salvador y encontrá tu próxima experiencia de aprendizaje.',
  /** URL pública canónica para metadatos y enlaces. Se configura con NEXT_PUBLIC_SITE_URL. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://demo.ticketera.c3.com.sv',
  /** Solo controla la etiqueta DEMO; la indexación la gobierna site_settings. */
  isDemo: process.env.NEXT_PUBLIC_IS_DEMO !== 'false',
} as const;

export type SiteConfig = typeof siteConfig;
