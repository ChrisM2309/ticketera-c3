import type { IconName } from '@/components/ui/icon';
import { eventCategories } from '../features/catalog/categories';

export type MenuItem = {
  href: string;
  label: string;
  /** Icono decorativo junto al texto; el texto del enlace siempre se muestra. */
  icon?: IconName;
};

export type CategoryItem = MenuItem & {
  slug: string;
};

export type CategoryGroup = {
  id: string;
  label: string;
  items: readonly CategoryItem[];
};

/**
 * Acciones de la cuenta y de la publicación. El logo lleva al Home; el menú no incluye «Inicio».
 * El carrito tiene su propio control en la cabecera (con contador), no aquí.
 */
export const accountLinks: readonly MenuItem[] = [
  { href: '/panel/eventos/nuevo/', label: 'Publicar evento', icon: 'calendarPlus' },
  { href: '/ingresar/', label: 'Ingresar', icon: 'logIn' },
];

export const categoryLinks: readonly CategoryItem[] = eventCategories.map(({ slug, label }) => ({
  slug,
  label,
  href: `/${slug}/`,
}));

const categoryBySlug = new Map(categoryLinks.map((item) => [item.slug, item]));

function itemsFor(slugs: readonly string[]): readonly CategoryItem[] {
  return slugs.map((slug) => {
    const item = categoryBySlug.get(slug);

    if (!item) {
      throw new Error(`Categoría desconocida en el menú: ${slug}`);
    }

    return item;
  });
}

/**
 * Grupos del menú (D-34), según la investigación de palabras clave del equipo (docs/architecture/SEO_ROUTES.md).
 * Cada grupo usa el nombre que busca la gente y el orden sigue el volumen de búsqueda total del grupo:
 * Congresos y ferias 50 610; Competencias y hackathons 45 800; Formación 44 600; Comunidad 26 600.
 */
export const categoryGroups: readonly CategoryGroup[] = [
  {
    id: 'congresos-y-ferias',
    label: 'Congresos y ferias',
    items: itemsFor(['congresos', 'conferencias', 'ferias-tecnologicas']),
  },
  {
    id: 'competencias-y-hackathons',
    label: 'Competencias y hackathons',
    items: itemsFor(['competencias', 'concursos', 'hackathons']),
  },
  {
    id: 'formacion',
    label: 'Formación',
    items: itemsFor(['workshops', 'bootcamps', 'webinars', 'charlas']),
  },
  {
    id: 'comunidad',
    label: 'Comunidad',
    items: itemsFor(['networking', 'meetups']),
  },
];
