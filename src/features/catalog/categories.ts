export type EventCategory = {
  slug: string;
  label: string;
};

/** Las 12 categorías del menú primario, en el orden del Excel (docs/architecture/SEO_ROUTES.md). */
export const eventCategories: readonly EventCategory[] = [
  { slug: 'congresos', label: 'Congresos' },
  { slug: 'competencias', label: 'Competencias' },
  { slug: 'networking', label: 'Networking' },
  { slug: 'workshops', label: 'Workshops' },
  { slug: 'bootcamps', label: 'Bootcamps' },
  { slug: 'concursos', label: 'Concursos' },
  { slug: 'webinars', label: 'Webinars' },
  { slug: 'conferencias', label: 'Conferencias' },
  { slug: 'hackathons', label: 'Hackathons' },
  { slug: 'meetups', label: 'Meetups' },
  { slug: 'charlas', label: 'Charlas' },
  { slug: 'ferias-tecnologicas', label: 'Ferias tecnológicas' },
];
