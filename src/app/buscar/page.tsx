import type { Metadata } from 'next';

import { EventCard } from '@/components/catalog/event-card';
import { SiteSearch } from '@/components/layout/site-search';
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

  return (
    <section aria-labelledby="buscar-title" className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="flex flex-col gap-4">
        <h1 id="buscar-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          {query ? `Resultados para «${query}»` : 'Todos los eventos'}
        </h1>
        <SiteSearch defaultValue={query} />
      </header>

      {listing.status === 'unavailable' ? (
        <p role="status" className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
          No pudimos cargar los eventos. Intenta nuevamente más tarde.
        </p>
      ) : (
        <SearchResults
          query={query}
          events={searchCatalogEvents(upcomingEvents(listing.events), query)}
          truncated={listing.truncated}
        />
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
}>;

function SearchResults({ query, events, truncated }: SearchResultsProps) {
  if (events.length === 0) {
    return (
      <p role="status" className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
        {query
          ? `No encontramos eventos para «${query}». Prueba con otra ciudad, tema o palabra.`
          : 'Todavía no hay eventos publicados.'}
      </p>
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
