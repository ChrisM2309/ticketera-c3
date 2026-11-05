import { eventCategories } from '../features/catalog/categories';

export type MenuItem = {
  href: string;
  label: string;
};

export type CategoryItem = MenuItem & {
  slug: string;
};

/** Enlaces de cuenta y publicación. El logo lleva al Home; el menú no incluye «Inicio». */
export const accountLinks: readonly MenuItem[] = [
  { href: '/panel/eventos/nuevo/', label: 'Publicar evento' },
  { href: '/carrito', label: 'Carrito' },
];

export const categoryLinks: readonly CategoryItem[] = eventCategories.map(({ slug, label }) => ({
  slug,
  label,
  href: `/${slug}/`,
}));
