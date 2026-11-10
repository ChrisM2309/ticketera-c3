import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { iconForEventType } from '@/features/catalog/icons';
import { lineForEventType, type CatalogLine } from '@/features/catalog/lines';
import type { CatalogCategory } from '@/features/catalog/types';
import { cn } from '@/lib/utils';

/** Fondo de la línea con el color de texto que contrasta (blanco sobre compite y conecta, navy sobre crea). */
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
        'flex min-h-24 flex-col justify-between gap-2 rounded-md p-4 font-titulo text-lg font-bold leading-tight underline-offset-4 hover:underline',
        lineTile[line],
      )}
    >
      <Icon name={iconForEventType(category.slug)} size={24} />
      <span>{category.name}</span>
    </Link>
  );
}
