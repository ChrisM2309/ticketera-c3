import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { EventCard } from '@/components/catalog/event-card';
import { TicketSelector } from '@/components/catalog/ticket-selector';
import { buttonVariants } from '@/components/ui/button';
import { modeLabel, priceLabel } from '@/features/catalog/format';
import { coverImagePath, isIllustrativeCover, publicImagePath } from '@/features/catalog/images';
import { eventPath } from '@/features/catalog/paths';
import { getAvailableQuantity, hasAvailableTickets, isEventPast } from '@/features/catalog/tickets';
import type { CatalogEvent, CatalogEventDetail } from '@/features/catalog/types';
import { siteConfig } from '@/lib/site-config';

type EventDetailPageProps = Readonly<{
  event: CatalogEventDetail;
  related: CatalogEvent[];
}>;

const dateFormatter = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/El_Salvador',
});

function eventDateLabel(event: CatalogEventDetail): string {
  const date = new Date(event.startsAt);
  const end = event.endsAt ? ` · termina ${dateFormatter.format(new Date(event.endsAt))}` : '';

  return `${dateFormatter.format(date)}${end}`;
}

function structuredEvent(event: CatalogEventDetail) {
  const imagePath = publicImagePath(event.imagePath);
  const activeTickets = event.ticketTypes.filter((ticket) => ticket.isActive);
  const structured: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    url: new URL(
      eventPath({
        slug: event.slug,
        eventTypeSlug: event.eventType.slug,
        topicSlug: event.topic?.slug ?? null,
      }),
      siteConfig.siteUrl,
    ).toString(),
    eventAttendanceMode:
      event.mode === 'virtual'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    offers: activeTickets.map((ticket) => ({
      '@type': 'Offer',
      name: ticket.name,
      price: (ticket.priceCents / 100).toFixed(2),
      priceCurrency: siteConfig.currency,
      availability:
        getAvailableQuantity(ticket) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
    })),
  };

  if (event.endsAt) {
    structured.endDate = event.endsAt;
  }

  if (imagePath) {
    structured.image = [new URL(imagePath, siteConfig.siteUrl).toString()];
  }

  if (event.mode === 'presencial' && (event.venue || event.location)) {
    structured.location = {
      '@type': 'Place',
      name: event.venue ?? event.location?.name,
    };
  }

  if (event.organizer) {
    structured.organizer = { '@type': 'Organization', name: event.organizer.name };
  }

  return structured;
}

function jsonLdScript(event: CatalogEventDetail) {
  return JSON.stringify(structuredEvent(event)).replace(/</g, '\\u003c');
}

export function EventDetailPage({ event, related }: EventDetailPageProps) {
  const past = isEventPast(event);
  const soldOut = !hasAvailableTickets(event);
  const canPurchase = !past && !soldOut;
  const breadcrumbs = [
    { label: 'Ticketera C3', href: '/' },
    { label: event.eventType.name, href: `/${event.eventType.slug}/` },
    ...(event.topic
      ? [{ label: event.topic.name, href: `/${event.eventType.slug}/${event.topic.slug}/` }]
      : []),
    { label: event.title },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-start">
        <article className="flex min-w-0 flex-col gap-8">
          <div className="relative aspect-[16/8] overflow-hidden rounded-lg bg-navy shadow-sm">
            <Image
              src={coverImagePath(event)}
              alt={`Portada de ${event.title}`}
              fill
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover"
              unoptimized={!coverImagePath(event).startsWith('/')}
              priority
            />
            {isIllustrativeCover(event) ? (
              <span className="absolute bottom-3 left-3 rounded-sm bg-navy/85 px-2 py-1 font-texto text-xs font-medium text-texto-inverso">
                Imagen ilustrativa, no es una foto del evento
              </span>
            ) : null}
          </div>

          <header className="flex flex-col gap-4">
            <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {event.title}
            </h1>
            <p className="font-texto text-sm font-medium text-texto-suave">{event.eventType.name}</p>
            {past ? (
              <p className="inline-flex w-fit rounded-full bg-superficie-sutil px-3 py-1 font-titulo text-sm font-semibold text-texto-suave">
                Evento finalizado
              </p>
            ) : null}
            {canPurchase ? (
              <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
                <p className="font-titulo text-lg font-bold text-texto">{priceLabel(event.ticketTypes)}</p>
                <Link href="#entradas" className={buttonVariants({ variant: 'secundario' })}>
                  Elegir entradas
                </Link>
              </div>
            ) : null}
          </header>

          <dl className="grid gap-4 rounded-lg bg-superficie p-5 shadow-sm sm:grid-cols-2">
            <div>
              <dt className="font-titulo text-sm font-semibold text-texto">Fecha y horario</dt>
              <dd className="mt-1 font-texto text-sm leading-6 text-texto-suave">{eventDateLabel(event)}</dd>
            </div>
            <div>
              <dt className="font-titulo text-sm font-semibold text-texto">Modalidad</dt>
              <dd className="mt-1 font-texto text-sm leading-6 text-texto-suave">
                {modeLabel(event.mode)}
                {event.location ? ` · ${event.location.name}` : ''}
                {event.venue ? ` · ${event.venue}` : ''}
              </dd>
            </div>
            {event.organizer ? (
              <div>
                <dt className="font-titulo text-sm font-semibold text-texto">Organiza</dt>
                <dd className="mt-1 font-texto text-sm leading-6 text-texto-suave">{event.organizer.name}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-titulo text-sm font-semibold text-texto">Entradas</dt>
              <dd className="mt-1 font-texto text-sm leading-6 text-texto-suave">
                {event.ticketTypes.filter((ticket) => ticket.isActive).length > 0
                  ? `${event.ticketTypes.filter((ticket) => ticket.isActive).length} tipos disponibles`
                  : 'Sin entradas disponibles'}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="descripcion" className="flex flex-col gap-3">
            <h2 id="descripcion" className="font-titulo text-2xl font-bold">
              Sobre el evento
            </h2>
            <p className="max-w-3xl whitespace-pre-line font-texto text-base leading-7 text-texto-suave">
              {event.description}
            </p>
          </section>

          {event.agenda ? (
            <section aria-labelledby="agenda" className="flex flex-col gap-3">
              <h2 id="agenda" className="font-titulo text-2xl font-bold">
                Agenda
              </h2>
              <p className="max-w-3xl whitespace-pre-line rounded-lg bg-superficie p-5 font-texto text-base leading-7 text-texto-suave shadow-sm">
                {event.agenda}
              </p>
            </section>
          ) : null}
        </article>

        <aside className="lg:sticky lg:top-6">
          <TicketSelector event={event} disabled={!canPurchase} />
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="relacionados" className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="relacionados" className="font-titulo text-2xl font-bold">
              También podría interesarte
            </h2>
            <Link href={`/${event.eventType.slug}/`} className="font-titulo text-sm font-semibold text-enlace underline-offset-4 hover:underline">
              Ver más eventos
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((relatedEvent) => (
              <EventCard key={relatedEvent.id} event={relatedEvent} />
            ))}
          </div>
        </section>
      ) : null}

      {!siteConfig.isDemo ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(event) }} />
      ) : null}
    </div>
  );
}
