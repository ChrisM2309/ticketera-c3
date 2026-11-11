import type { Metadata } from 'next';
import Link from 'next/link';

import { CategoryTile } from '@/components/catalog/category-tile';
import { DiscoveryShortcuts } from '@/components/catalog/discovery-shortcuts';
import { EventCard } from '@/components/catalog/event-card';
import { FeaturedCarousel } from '@/components/catalog/featured-carousel';
import { SiteSearch } from '@/components/layout/site-search';
import { buttonVariants } from '@/components/ui/button';
import { getHomeCatalog } from '@/features/catalog/queries';
import { getSiteSettings } from '@/features/settings/settings';
import { webSiteJsonLd } from '@/lib/seo/jsonld';
import type { CatalogEvent } from '@/features/catalog/types';
import { robotsMetadata } from '@/lib/seo/indexing';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 60;

/** Palabra clave del Excel «boletos para el salvador» (SEO_ROUTES.md, sección 5). */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `Boletos para eventos tecnológicos en El Salvador · ${siteConfig.name} · ${siteConfig.demoLabel}`;
  const description = siteConfig.description;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      title,
      description,
      url: '/',
      siteName: siteConfig.name,
      locale: siteConfig.locale.replace('-', '_'),
    },
    twitter: { card: 'summary', title, description },
    robots: robotsMetadata({ indexingEnabled: settings.indexingEnabled, pageIndexable: true }),
  };
}

function EventGrid({ events, empty }: Readonly<{ events: CatalogEvent[]; empty: string }>) {
  if (events.length === 0) {
    return <p className="rounded-lg bg-superficie-sutil p-6 text-texto-suave">{empty}</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

export default async function Home() {
  const [catalog, settings] = await Promise.all([getHomeCatalog(), getSiteSettings()]);

  if (catalog.status === 'unavailable') {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-20 md:px-6">
        <h1 className="font-titulo text-3xl font-bold">No pudimos cargar el catálogo</h1>
        <p className="text-lg text-texto-suave">
          Vuelve a intentarlo en unos minutos.
        </p>
      </section>
    );
  }

  const { featured, upcoming, free, categories } = catalog;
  return (
    <div className="flex flex-col gap-20 pb-20">
      {settings.indexingEnabled ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd(siteConfig.siteUrl)).replace(/</g, '\\u003c') }} /> : null}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:px-6 md:pt-16">
        <div className="flex flex-col gap-6">
          <h1 className="max-w-2xl font-titulo text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Encontrá tu próximo evento tecnológico
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-texto-suave">
            Descubrí congresos, hackathons y workshops en El Salvador. Buscá por tema, ciudad o modalidad y elegí cómo participar.
          </p>
          <SiteSearch inputId="buscar-eventos-home" searchLabel="Buscar eventos desde la portada" className="md:max-w-xl" />
          <DiscoveryShortcuts />
        </div>

        <div className="min-w-0 rounded-lg bg-navy p-2 shadow-md sm:p-3">
          {featured.length > 0 ? (
            <FeaturedCarousel events={featured} />
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-lg bg-superficie-sutil p-8 text-center text-texto-suave">
              Todavía no hay eventos publicados.
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="proximos" className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="proximos" className="font-titulo text-3xl font-bold">
            Próximos eventos
          </h2>
          <Link href="/buscar/" className="font-titulo font-semibold text-enlace underline-offset-4 hover:underline">
            Ver todos los eventos
          </Link>
        </div>
        <EventGrid events={upcoming} empty="Pronto habrá más eventos publicados." />
      </section>

      <section aria-labelledby="gratuitos" className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-8">
          <h2 id="gratuitos" className="font-titulo text-3xl font-bold">
            Eventos gratuitos
          </h2>
          <p className="mt-2 text-texto-suave">Reserva tu lugar sin pagar.</p>
        </div>
        <EventGrid events={free} empty="Por ahora no hay eventos gratuitos publicados." />
      </section>

      <section aria-labelledby="categorias" className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-8">
          <h2 id="categorias" className="font-titulo text-3xl font-bold">
            Explorá por tipo de evento
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryTile key={category.slug} category={category} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-start gap-6 rounded-lg bg-navy p-8 text-texto-inverso md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-2xl">
            <h2 className="font-titulo text-2xl font-bold">¿Organizás un evento?</h2>
            <p className="mt-2">
              Proponé tu evento y lo revisamos antes de publicarlo.
            </p>
          </div>
          <Link href="/panel/eventos/nuevo/" className={buttonVariants({ variant: 'compra' })}>
            Publicar evento
          </Link>
        </div>
      </section>
    </div>
  );
}
