import Link from 'next/link';

import { lineForEventType, type CatalogLine } from '@/features/catalog/lines';
import type { CatalogCategory } from '@/features/catalog/types';
import { cn } from '@/lib/utils';

const lineTile: Record<CatalogLine, string> = {
  compite: 'bg-compite text-texto-inverso',
  crea: 'bg-crea text-navy',
  conecta: 'bg-conecta text-texto-inverso',
};

/** Categoría sin foto: el fondo es la línea de C3 y el nombre siempre es legible. */
export function CategoryTile({ category }: Readonly<{ category: CatalogCategory }>) {
  const line = lineForEventType(category.slug);

  return (
    <Link
      href={`/${category.slug}/`}
      className={cn(
        'flex min-h-24 items-end rounded-md p-4 font-titulo text-lg font-bold leading-tight underline-offset-4 hover:underline',
        lineTile[line],
      )}
    >
      {category.name}
    </Link>
  );
}
