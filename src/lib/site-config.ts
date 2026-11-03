export const siteConfig = {
  name: 'Ticketera C3',
  demoLabel: 'DEMO · Proyecto académico',
  currency: 'USD',
  locale: 'es-SV',
  description:
    'Descubrí eventos tecnológicos en El Salvador y encontrá tu próxima experiencia de aprendizaje.',
  /** URL pública canónica para metadatos y enlaces. Se configura con NEXT_PUBLIC_SITE_URL. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://demo.ticketera.c3.com.sv',
  /** Sitio demo: no se indexa hasta que sea un producto real (T06). */
  isDemo: true,
} as const;

export type SiteConfig = typeof siteConfig;
