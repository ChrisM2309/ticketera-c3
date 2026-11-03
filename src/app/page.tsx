import type { Metadata } from 'next';
import Link from 'next/link';

import { CategoryTile } from '@/components/catalog/category-tile';
import { EventCard } from '@/components/catalog/event-card';
import { buttonVariants } from '@/components/ui/button';
import { getHomeCatalog } from '@/features/catalog/queries';
import type { CatalogEvent } from '@/features/catalog/types';
import { eventPath } from '@/features/catalog/paths';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 60;

/** Palabra clave del Excel «boletos para el salvador» (SEO_ROUTES.md, sección 5). */
export const metadata: Metadata = {
  title: siteConfig.isDemo
    ? 'Boletos para eventos tecnológicos en El Salvador · Ticketera C3 · DEMO'
    : 'Boletos para eventos tecnológicos en El Salvador',
  alternates: { canonical: '/' },
};

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
  const catalog = await getHomeCatalog();

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
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-center md:px-6 md:pt-16">
        <div className="flex flex-col gap-6">
          <h1 className="font-titulo text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Boletos para eventos tecnológicos en El Salvador
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-texto-suave">
            Congresos, hackathons y workshops, presenciales o en línea. Compra tu entrada en pocos pasos.
          </p>
          <div className="flex flex-wrap gap-3">
            {featured ? (
              <Link
                href={eventPath({
                  slug: featured.slug,
                  eventTypeSlug: featured.eventType.slug,
                  topicSlug: featured.topic?.slug ?? null,
                })}
                className={buttonVariants({ variant: 'compra', size: 'lg' })}
              >
                Ver evento destacado
              </Link>
            ) : null}
            <Link href="/publicar" className={buttonVariants({ variant: 'secundario', size: 'lg' })}>
              Publicar evento
            </Link>
          </div>
        </div>

        <div>
          {featured ? (
            <EventCard event={featured} featured />
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
          <Link href="/buscar" className="font-titulo font-semibold text-enlace underline-offset-4 hover:underline">
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
            <h2 className="font-titulo text-2xl font-bold">¿Organizas un evento?</h2>
            <p className="mt-2 text-compite-claro">
              Propón tu evento y lo revisamos antes de publicarlo.
            </p>
          </div>
          <Link href="/publicar" className={buttonVariants({ variant: 'compra' })}>
            Publicar evento
          </Link>
        </div>
      </section>
    </div>
  );
}
