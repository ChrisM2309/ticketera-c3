import type { Metadata } from 'next';
import Link from 'next/link';

import { CatalogFilters } from '@/components/catalog/catalog-filters';
import { EventCard } from '@/components/catalog/event-card';
import { SiteSearch } from '@/components/layout/site-search';
import { catalogOrganizers, filterCatalogEventsByFilters, hasActiveFilters, noCatalogFilters, parseCatalogFilters } from '@/features/catalog/filters';
import { getCatalogListing } from '@/features/catalog/queries';
import { parseSearchQuery, searchCatalogEvents } from '@/features/catalog/search';
import { getSiteSettings } from '@/features/settings/settings';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import type { CatalogEvent } from '@/features/catalog/types';

// Resultados de búsqueda: no se indexan (son variantes del catálogo, no categorías del árbol).
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({ title: 'Buscar eventos', description: 'Busca eventos tecnológicos publicados en Ticketera C3.', path: '/buscar/', indexable: false, indexingEnabled: settings.indexingEnabled }, siteConfig.siteUrl);
}

type SearchPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = parseSearchQuery(params.q);
  const listing = await getCatalogListing();
  const now = new Date();
  const organizers = listing.status === 'ok' ? catalogOrganizers(upcomingEvents(listing.events, now.getTime())) : [];
  const filters = listing.status === 'ok'
    ? parseCatalogFilters(params, listing.taxonomy.locations.map((location) => location.slug), listing.taxonomy.topics.map((topic) => topic.slug), organizers.map((organizer) => organizer.slug))
    : noCatalogFilters;
  const filteredEvents = listing.status === 'ok'
    ? searchCatalogEvents(filterCatalogEventsByFilters(upcomingEvents(listing.events, now.getTime()), filters, now), query)
    : [];
  const hasFilters = filters ? hasActiveFilters(filters) : false;

  return (
    <section aria-labelledby="buscar-title" className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="flex flex-col gap-4">
        <h1 id="buscar-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          {query ? `Resultados para «${query}»` : 'Todos los eventos'}
        </h1>
         <SiteSearch defaultValue={query} inputId="buscar-eventos-pagina" searchLabel="Buscar en el catálogo" />
      </header>

      {listing.status === 'unavailable' ? (
        <p role="status" className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
          No pudimos cargar los eventos. Intenta nuevamente más tarde.
        </p>
      ) : (
        <>
          <CatalogFilters
            filters={filters}
            locations={listing.taxonomy.locations}
            organizers={organizers}
            topics={listing.taxonomy.topics}
            showCiudad
            clearHref="/buscar/"
            query={query}
          />
          <SearchResults query={query} events={filteredEvents} truncated={listing.truncated} hasFilters={hasFilters} />
        </>
      )}
    </section>
  );
}

/** Eventos que todavía no empiezan; los que ya pasaron no aparecen en la búsqueda. */
function upcomingEvents(events: readonly CatalogEvent[], now = Date.now()): CatalogEvent[] {
  return events.filter((event) => new Date(event.startsAt).getTime() >= now);
}

type SearchResultsProps = Readonly<{
  query: string;
  events: ReturnType<typeof searchCatalogEvents>;
  truncated: boolean;
  hasFilters: boolean;
}>;

function SearchResults({ query, events, truncated, hasFilters }: SearchResultsProps) {
  if (events.length === 0) {
    return (
      <div role="status" className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
        <p>
          {query
            ? `No encontramos eventos para «${query}». Prueba con otra ciudad, tema o palabra.`
            : hasFilters
              ? 'Ningún evento coincide con estos filtros. Prueba quitar alguno para ver más resultados.'
              : 'Todavía no hay eventos publicados.'}
        </p>
        {!query && hasFilters ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/buscar/" className="inline-flex min-h-11 items-center rounded-md bg-azul px-4 font-titulo font-semibold text-white">Ver todos los eventos</Link>
            <Link href="/buscar/?precio=gratis" className="inline-flex min-h-11 items-center rounded-md border border-borde-fuerte px-4 font-titulo font-semibold text-enlace">Eventos gratis</Link>
            <Link href="/buscar/?fecha=mes" className="inline-flex min-h-11 items-center rounded-md border border-borde-fuerte px-4 font-titulo font-semibold text-enlace">Próximos 30 días</Link>
          </div>
        ) : null}
        {query ? <Link href="/buscar/" className="mt-3 inline-flex min-h-11 items-center font-titulo font-semibold text-enlace underline-offset-4 hover:underline">Explorar todos los eventos</Link> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="font-texto text-sm text-texto-suave">
        {events.length === 1 ? '1 evento encontrado.' : `${events.length} eventos encontrados.`}
        {truncated ? ' Mostramos solo los primeros eventos del catálogo.' : null}
      </p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </div>
  );
}
