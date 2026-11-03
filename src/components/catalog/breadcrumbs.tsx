import Link from 'next/link';

import type { CatalogLink } from '@/features/catalog/routes';

/** Ruta de navegación. El último elemento es la página actual y no es enlace. */
export function Breadcrumbs({ items }: Readonly<{ items: readonly CatalogLink[] }>) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-texto text-sm text-texto-suave">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.href && !isCurrent ? (
                <Link href={item.href} className="underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              )}
              {isCurrent ? null : <span aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
