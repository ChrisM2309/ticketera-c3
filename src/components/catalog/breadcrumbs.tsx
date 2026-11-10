import Link from 'next/link';

import type { CatalogLink } from '@/features/catalog/routes';
import { breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

type BreadcrumbsProps = Readonly<{
  items: readonly CatalogLink[];
  /** En móvil deja solo el nivel superior (la página actual ya la nombra el título) para ganar altura. */
  compactOnMobile?: boolean;
  indexingEnabled?: boolean;
}>;

/** Ruta de navegación. El último elemento es la página actual y no es enlace. */
export function Breadcrumbs({ items, compactOnMobile = false, indexingEnabled = false }: BreadcrumbsProps) {
  return (
    <>
      <nav aria-label="Ruta de navegación">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-texto text-sm text-texto-suave">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li
              key={item.label}
              className={cn(
                'flex items-center gap-2',
                compactOnMobile && index < items.length - 2 && 'hidden md:flex',
                compactOnMobile && isCurrent && 'hidden md:flex',
              )}
            >
              {compactOnMobile && index === items.length - 2 ? (
                <span aria-hidden="true" className="md:hidden">
                  ‹
                </span>
              ) : null}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className={cn(
                    'underline-offset-4 hover:underline',
                    compactOnMobile && 'inline-flex min-h-11 items-center md:min-h-0',
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              )}
              {isCurrent ? null : (
                <span
                  aria-hidden="true"
                  className={cn(compactOnMobile && index === items.length - 2 && 'hidden md:inline')}
                >
                  ›
                </span>
              )}
            </li>
          );
        })}
        </ol>
      </nav>
      {indexingEnabled ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd(items.map((item) => ({ name: item.label, path: item.href ?? '/' })), siteConfig.siteUrl)).replace(/</g, '\\u003c') }} /> : null}
    </>
  );
}
