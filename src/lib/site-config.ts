export const siteConfig = {
  name: 'Ticketera C3',
  demoLabel: 'DEMO · Proyecto académico',
  currency: 'USD',
  locale: 'es-SV',
  description:
    'Descubrí eventos tecnológicos en El Salvador y encontrá tu próxima experiencia de aprendizaje.',
  categorySlugs: [
    'congresos',
    'competencias',
    'networking',
    'workshops',
    'bootcamps',
    'concursos',
    'webinars',
    'conferencias',
    'hackathons',
    'meetups',
    'charlas',
    'ferias-tecnologicas',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
