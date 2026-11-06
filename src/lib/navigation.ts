import { eventCategories } from '../features/catalog/categories';

export type MenuItem = {
  href: string;
  label: string;
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
export const accountLinks: readonly MenuItem[] = [{ href: '/panel/eventos/nuevo/', label: 'Publicar evento' }];

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
 * Grupos del menú según lo que busca el visitante (decisión del 6-nov-2026). No usan nombres de marca.
 * Cada categoría aparece una vez; el orden dentro de cada grupo sigue el Excel.
 */
export const categoryGroups: readonly CategoryGroup[] = [
  {
    id: 'aprender',
    label: 'Aprender',
    items: itemsFor(['workshops', 'bootcamps', 'webinars', 'charlas']),
  },
  {
    id: 'conocer-y-conectar',
    label: 'Conocer y conectar',
    items: itemsFor(['congresos', 'networking', 'conferencias', 'meetups', 'ferias-tecnologicas']),
  },
  {
    id: 'competir',
    label: 'Competir',
    items: itemsFor(['competencias', 'concursos', 'hackathons']),
  },
];
