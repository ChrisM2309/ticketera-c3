import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { CatalogFilters } from '@/components/catalog/catalog-filters';
import { EventCard } from '@/components/catalog/event-card';
import {
  filterCatalogEvents,
  filtersForScope,
  noCatalogFilters,
  parseCatalogFilters,
  type SearchParams,
} from '@/features/catalog/filters';
import { getCatalogListing } from '@/features/catalog/queries';
import {
  resolveCatalogRoute,
  scopeBreadcrumbs,
  scopeIntro,
  scopePath,
  scopeSubcategories,
  scopeTitle,
} from '@/features/catalog/routes';

type CatalogPageProps = Readonly<{
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<SearchParams>;
}>;

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { segments } = await params;
  const listing = await getCatalogListing();

  if (listing.status === 'unavailable') {
    return {};
  }

  const scope = resolveCatalogRoute(segments, listing.taxonomy);

  if (!scope) {
    return {};
  }

  return {
    title: scopeTitle(scope),
    description: scopeIntro(scope),
    alternates: { canonical: scopePath(scope) },
  };
}

/** Páginas de tipo, tema, ciudad y tipo + tema (SEO_ROUTES.md). Todo lo demás responde 404. */
export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { segments } = await params;
  const listing = await getCatalogListing();

  if (listing.status === 'unavailable') {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-20 md:px-6">
        <h1 className="font-titulo text-3xl font-bold">No pudimos cargar el catálogo</h1>
        <p className="text-lg text-texto-suave">Vuelve a intentarlo en unos minutos.</p>
      </section>
    );
  }

  const scope = resolveCatalogRoute(segments, listing.taxonomy);

  if (!scope) {
    notFound();
  }

  const now = new Date();
  const locationSlugs = listing.taxonomy.locations.map((location) => location.slug);
  const filters = filtersForScope(parseCatalogFilters(await searchParams, locationSlugs), scope);
  const scopedEvents = filterCatalogEvents(listing.events, scope, noCatalogFilters, now);
  const events = filterCatalogEvents(listing.events, scope, filters, now);
  const subcategories = scopeSubcategories(scope, listing.taxonomy);
  const countLabel = events.length === 1 ? '1 evento' : `${events.length} eventos`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <Breadcrumbs items={scopeBreadcrumbs(scope)} />

      <header className="flex max-w-3xl flex-col gap-4">
        <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">
          {scopeTitle(scope)}
        </h1>
        <p className="text-lg leading-relaxed text-texto-suave">{scopeIntro(scope)}</p>
      </header>

      {subcategories.length > 0 ? (
        <nav aria-label="Explorá también">
          <ul className="flex flex-wrap gap-2">
            {subcategories.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full border border-borde-fuerte px-4 font-titulo text-sm font-semibold text-texto hover:bg-superficie-sutil"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <section aria-labelledby="resultados" className="flex flex-col gap-6">
        <CatalogFilters
          filters={filters}
          locations={listing.taxonomy.locations}
          showCiudad={scope.kind !== 'location'}
          clearHref={scopePath(scope)}
        />

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="resultados" className="font-titulo text-2xl font-bold">
            Próximos eventos
          </h2>
          <p className="font-texto text-sm text-texto-suave">{countLabel}</p>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-superficie-sutil p-6 text-texto-suave">
            {scopedEvents.length === 0
              ? 'Todavía no hay eventos publicados aquí. Mirá otras categorías en el menú.'
              : 'Ningún evento coincide con estos filtros. Quitá alguno para ver más resultados.'}
          </p>
        )}
      </section>
    </div>
  );
}
