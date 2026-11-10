import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { CatalogFilters } from '@/components/catalog/catalog-filters';
import { EventCard } from '@/components/catalog/event-card';
import { FeaturedBlock } from '@/components/catalog/featured-block';
import { CategoryIntro } from '@/components/content/category-intro';
import { OrganizerPage } from '@/components/catalog/organizer-page';
import { EventDetailPage } from '@/features/catalog/event-detail';
import {
  filterCatalogEvents,
  filtersForScope,
  noCatalogFilters,
  parseCatalogFilters,
  type SearchParams,
} from '@/features/catalog/filters';
import { CATALOG_EVENT_LIMIT, getCatalogListing, getEventDetail } from '@/features/catalog/queries';
import { getCategoryFeaturedIds } from '@/features/featured/queries';
import { getEditorialPage } from '@/features/content/queries';
import { getOrganizerPage, isOrganizerSlugAllowed, type OrganizerPageData } from '@/features/catalog/organizers';
import { getSiteSettings } from '@/features/settings/settings';
import {
  isCatalogRouteIndexable,
  resolveCatalogRoute,
  scopeBreadcrumbs,
  scopeIntro,
  scopePath,
  scopeSubcategories,
  scopeTitle,
} from '@/features/catalog/routes';
import { publicImagePath } from '@/features/catalog/images';
import { eventPathMatches } from '@/features/catalog/paths';
import { hasAvailableTickets, isEventPast } from '@/features/catalog/tickets';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

type CatalogPageProps = Readonly<{
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<SearchParams>;
}>;

type PublicRoute =
  | { kind: 'unavailable' }
  | { kind: 'catalog'; listing: Extract<Awaited<ReturnType<typeof getCatalogListing>>, { status: 'ok' }>; scope: NonNullable<ReturnType<typeof resolveCatalogRoute>> }
  | { kind: 'organizer'; organizer: OrganizerPageData }
  | { kind: 'event'; event: Extract<Awaited<ReturnType<typeof getEventDetail>>, { status: 'ok' }>['event']; related: Extract<Awaited<ReturnType<typeof getEventDetail>>, { status: 'ok' }>['related'] }
  | { kind: 'not_found' };

async function resolvePublicRoute(segments: string[]): Promise<PublicRoute> {
  const listing = await getCatalogListing();

  if (listing.status === 'unavailable') {
    return { kind: 'unavailable' };
  }

  const scope = resolveCatalogRoute(segments, listing.taxonomy);

  if (scope) {
    return { kind: 'catalog', listing, scope };
  }

  if (segments.length === 1) {
    const taxonomySlugs = [...listing.taxonomy.eventTypes, ...listing.taxonomy.topics, ...listing.taxonomy.locations].map((category) => category.slug);
    if (isOrganizerSlugAllowed(segments[0], taxonomySlugs)) {
      const organizer = await getOrganizerPage(segments[0]);
      if (organizer) return { kind: 'organizer', organizer };
    }
  }

  if (segments.length !== 2 && segments.length !== 3) {
    return { kind: 'not_found' };
  }

  const eventResult = await getEventDetail(segments[segments.length - 1]);

  if (eventResult.status === 'unavailable') {
    return { kind: 'unavailable' };
  }

  if (eventResult.status === 'not_found' || !eventPathMatches(segments, eventResult.event)) {
    return { kind: 'not_found' };
  }

  return { kind: 'event', event: eventResult.event, related: eventResult.related };
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { segments } = await params;
  const route = await resolvePublicRoute(segments);

  if (route.kind === 'unavailable' || route.kind === 'not_found') {
    return {};
  }

  if (route.kind === 'event') {
    const { event } = route;
    const canonical = eventPathMatches(segments, event)
      ? `/${segments.join('/')}/`
      : undefined;
    const settings = await getSiteSettings();
    const image = publicImagePath(event.imagePath) ?? undefined;
    const eventDate = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeZone: 'America/El_Salvador' }).format(new Date(event.startsAt));
    const place = event.mode === 'virtual' ? 'Virtual' : event.location?.name ?? event.venue ?? 'El Salvador';
    return buildPageMetadata({ title: `${event.title} · ${eventDate} · ${place}`, description: event.description, path: canonical ?? `/${segments.join('/')}/`, indexable: !isEventPast(event) && hasAvailableTickets(event), indexingEnabled: settings.indexingEnabled, image }, siteConfig.siteUrl);
  }

  if (route.kind === 'organizer') {
    const settings = await getSiteSettings();
    return buildPageMetadata({ title: `${route.organizer.name} · Organizador DEMO`, description: route.organizer.description, path: `/${segments[0]}/`, indexable: route.organizer.events.length > 0, indexingEnabled: settings.indexingEnabled }, siteConfig.siteUrl);
  }

  const { listing, scope } = route;
  const settings = await getSiteSettings();
  const hasEvents = filterCatalogEvents(listing.events, scope, noCatalogFilters, new Date()).length > 0;
  // Sin eventos próximos, o en una ruta de modalidad sin contenido, la página no se indexa (D-24, D-25).
  const indexable = isCatalogRouteIndexable(segments, listing.taxonomy) && hasEvents;
  return buildPageMetadata({ title: scopeTitle(scope), description: scopeIntro(scope), path: scopePath(scope), indexable, indexingEnabled: settings.indexingEnabled }, siteConfig.siteUrl);
}

/** Páginas de tipo, tema, ciudad y tipo + tema (SEO_ROUTES.md). Todo lo demás responde 404. */
export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { segments } = await params;
  const route = await resolvePublicRoute(segments);

  if (route.kind === 'unavailable') {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-20 md:px-6">
        <h1 className="font-titulo text-3xl font-bold">No pudimos cargar el catálogo</h1>
        <p className="text-lg text-texto-suave">Vuelve a intentarlo en unos minutos.</p>
      </section>
    );
  }

  if (route.kind === 'not_found') {
    notFound();
  }

  if (route.kind === 'event') {
    const settings = await getSiteSettings();
    return <EventDetailPage event={route.event} related={route.related} indexingEnabled={settings.indexingEnabled} />;
  }

  if (route.kind === 'organizer') {
    const settings = await getSiteSettings();
    return <OrganizerPage organizer={route.organizer} indexingEnabled={settings.indexingEnabled} />;
  }

  const { listing, scope } = route;
  const settings = await getSiteSettings();

  const now = new Date();
  const locationSlugs = listing.taxonomy.locations.map((location) => location.slug);
  const filters = filtersForScope(parseCatalogFilters(await searchParams, locationSlugs), scope);
  const scopedEvents = filterCatalogEvents(listing.events, scope, noCatalogFilters, now);
  const events = filterCatalogEvents(listing.events, scope, filters, now);
  const isTypeScope = scope.kind === 'event_type' || scope.kind === 'event_type_topic' || scope.kind === 'modality';
  const featuredIds = isTypeScope && scope.eventType.id ? await getCategoryFeaturedIds(scope.eventType.id) : [];
  const featuredSet = new Set(featuredIds);
  const featuredEvents = listing.events.filter((event) => featuredSet.has(event.id));
  const visibleEvents = events.filter((event) => !featuredSet.has(event.id));
  const subcategories = scopeSubcategories(scope, listing.taxonomy);
  const countLabel = events.length === 1 ? '1 evento' : `${events.length} eventos`;
  const editorialCategoryId = scope.kind === 'event_type' || scope.kind === 'event_type_topic' || scope.kind === 'modality'
    ? scope.eventType.id
    : scope.kind === 'topic'
      ? scope.topic.id
      : undefined;
  const editorial = editorialCategoryId ? await getEditorialPage(editorialCategoryId) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <Breadcrumbs items={scopeBreadcrumbs(scope)} indexingEnabled={settings.indexingEnabled} />

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

      {isTypeScope ? <FeaturedBlock events={featuredEvents} heading={`Destacados de ${scopeTitle(scope)}`} /> : null}

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

        {listing.truncated ? (
          <p className="font-texto text-sm text-texto-suave">
            Solo se muestran los primeros {CATALOG_EVENT_LIMIT} eventos próximos.
          </p>
        ) : null}

        {visibleEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-superficie-sutil p-6 text-texto-suave">
            {scopedEvents.length === 0 && featuredEvents.length === 0
              ? 'Todavía no hay eventos publicados aquí. Mirá otras categorías en el menú.'
              : 'Ningún evento coincide con estos filtros. Quitá alguno para ver más resultados.'}
          </p>
        )}
      </section>

      {editorial ? <CategoryIntro introMd={editorial.introMd} faq={editorial.faq} /> : null}
    </div>
  );
}
