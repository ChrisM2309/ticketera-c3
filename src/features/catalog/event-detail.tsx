import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { EventCard } from '@/components/catalog/event-card';
import { MobileBuyBar } from '@/components/catalog/mobile-buy-bar';
import { ShareButton } from '@/components/catalog/share-button';
import { SpeakersList } from '@/components/catalog/speakers-list';
import { TicketSelector } from '@/components/catalog/ticket-selector';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { modeLabel, priceFromLabel } from '@/features/catalog/format';
import { coverImagePath, isIllustrativeCover, publicImagePath } from '@/features/catalog/images';
import { eventPath } from '@/features/catalog/paths';
import { getAvailableQuantity, hasAvailableTickets, isEventPast } from '@/features/catalog/tickets';
import type { CatalogEvent, CatalogEventDetail } from '@/features/catalog/types';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

type EventDetailPageProps = Readonly<{
  event: CatalogEventDetail;
  related: CatalogEvent[];
  indexingEnabled?: boolean;
}>;

const dateFormatter = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/El_Salvador',
});

const dayFormatter = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'full',
  timeZone: 'America/El_Salvador',
});

const timeFormatter = new Intl.DateTimeFormat('es-SV', {
  timeStyle: 'short',
  timeZone: 'America/El_Salvador',
});

/** Día del evento, sin la hora (la hora tiene su propio dato con su icono). */
function eventDayLabel(event: CatalogEventDetail): string {
  return dayFormatter.format(new Date(event.startsAt));
}

/** Hora de inicio; si hay fin, la hora de fin el mismo día o la fecha completa de término si es otro día. */
function eventTimeLabel(event: CatalogEventDetail): string {
  const start = new Date(event.startsAt);
  const time = timeFormatter.format(start);

  if (!event.endsAt) {
    return time;
  }

  const end = new Date(event.endsAt);
  const sameDay = dayFormatter.format(start) === dayFormatter.format(end);

  return sameDay
    ? `${time} a ${timeFormatter.format(end)}`
    : `${time} · termina ${dateFormatter.format(end)}`;
}

/** Precio corto de las entradas con cupo: el mínimo de pago, o «Gratis» si todas son gratuitas. */
function buyBarLabel(event: CatalogEventDetail): string {
  const prices = event.ticketTypes
    .filter((ticket) => ticket.isActive && getAvailableQuantity(ticket) > 0)
    .map((ticket) => ticket.priceCents);

  if (prices.length === 0) {
    return '';
  }

  const paid = prices.filter((price) => price > 0);

  return priceFromLabel(paid.length > 0 ? Math.min(...paid) : 0, prices.includes(0));
}

/** En móvil cada dato va en una fila (término a la izquierda, valor a la derecha) para ganar altura. */
const detailItemClass = 'flex items-start justify-between gap-4 sm:block';
const detailValueClass =
  'text-right font-texto text-sm leading-6 text-texto-suave sm:mt-1 sm:text-left';
const detailTermClass = 'flex items-center gap-2 font-titulo text-sm font-semibold text-texto';

/** URL pública absoluta de la ficha; es la que se comparte y la que declara el JSON-LD. */
function eventUrl(event: CatalogEventDetail): string {
  return new URL(
    eventPath({
      slug: event.slug,
      eventTypeSlug: event.eventType.slug,
      topicSlug: event.topic?.slug ?? null,
    }),
    siteConfig.siteUrl,
  ).toString();
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
    url: eventUrl(event),
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

export function EventDetailPage({ event, related, indexingEnabled = false }: EventDetailPageProps) {
  const past = isEventPast(event);
  const soldOut = !hasAvailableTickets(event);
  const canPurchase = !past && !soldOut;
  const showSoldOut = soldOut && !past && event.status === 'published';
  const breadcrumbs = [
    { label: 'Ticketera C3', href: '/' },
    { label: event.eventType.name, href: `/${event.eventType.slug}/` },
    ...(event.topic
      ? [{ label: event.topic.name, href: `/${event.eventType.slug}/${event.topic.slug}/` }]
      : []),
    { label: event.title },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-28 pt-3 md:gap-8 md:px-6 md:pb-20 md:pt-14">
      <Breadcrumbs items={breadcrumbs} compactOnMobile indexingEnabled={indexingEnabled} />

      {/* En móvil el orden es resumen, entradas, descripción, agenda y ponentes; en escritorio, dos columnas. */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:gap-8">
          <div className="relative aspect-video max-h-20 overflow-hidden rounded-lg bg-navy shadow-sm md:max-h-none md:aspect-[16/8]">
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

          <header className="flex flex-col gap-2 md:gap-4">
            <h1 className="font-titulo text-2xl font-bold leading-tight tracking-tight md:text-5xl">
              {event.title}
            </h1>
            <p className="hidden font-texto text-sm font-medium text-texto-suave md:block">{event.eventType.name}</p>
            {past ? (
              <p className="inline-flex w-fit rounded-full bg-superficie-sutil px-3 py-1 font-titulo text-sm font-semibold text-texto-suave">
                Evento finalizado
              </p>
            ) : null}
            {showSoldOut ? (
              <p className="inline-flex w-fit rounded-full bg-superficie-sutil px-3 py-1 font-titulo text-sm font-semibold text-texto-suave">
                Agotado
              </p>
            ) : null}
          </header>

          <dl className="grid gap-1.5 rounded-lg bg-superficie p-3 shadow-sm sm:grid-cols-2 sm:gap-4 sm:p-5">
            <div className={detailItemClass}>
              <dt className={detailTermClass}>
                <Icon name="calendar" size={16} />
                Fecha
              </dt>
              <dd className={detailValueClass}>{eventDayLabel(event)}</dd>
            </div>
            <div className={detailItemClass}>
              <dt className={detailTermClass}>
                <Icon name="clock" size={16} />
                Hora
              </dt>
              <dd className={detailValueClass}>{eventTimeLabel(event)}</dd>
            </div>
            <div className={detailItemClass}>
              <dt className={detailTermClass}>
                <Icon name={event.mode === 'virtual' ? 'monitor' : 'mapPin'} size={16} />
                Modalidad
              </dt>
              <dd className={detailValueClass}>
                {modeLabel(event.mode)}
                {event.location ? ` · ${event.location.name}` : ''}
                {event.venue ? ` · ${event.venue}` : ''}
              </dd>
            </div>
            {event.organizer ? (
              <div className={detailItemClass}>
                <dt className={detailTermClass}>
                  <Icon name="building" size={16} />
                  Organiza
                </dt>
                <dd className={detailValueClass}>{event.organizer.name}</dd>
              </div>
            ) : null}
            <div className="hidden sm:block">
              <dt className={detailTermClass}>
                <Icon name="ticket" size={16} />
                Entradas
              </dt>
              <dd className={detailValueClass}>
                {event.ticketTypes.filter((ticket) => ticket.isActive).length > 0
                  ? `${event.ticketTypes.filter((ticket) => ticket.isActive).length} tipos disponibles`
                  : 'Sin entradas disponibles'}
              </dd>
            </div>
          </dl>
        </div>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-6">
          <TicketSelector event={event} disabled={!canPurchase} />
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-2">
          <section aria-labelledby="descripcion" className="flex flex-col gap-3">
            <h2 id="descripcion" className="font-titulo text-2xl font-bold">
              Sobre el evento
            </h2>
            <p className="max-w-3xl whitespace-pre-line font-texto text-base leading-7 text-texto-suave">
              {event.description}
            </p>
            {past ? null : (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={`/calendario/${event.id}/`}
                  className={cn(buttonVariants({ variant: 'secundario' }), 'w-fit')}
                >
                  <Icon name="calendarPlus" />
                  Agregar al calendario
                </a>
                <ShareButton title={event.title} startsAt={event.startsAt} eventUrl={eventUrl(event)} />
              </div>
            )}
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

          <SpeakersList speakers={event.speakers} />
        </div>
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

      <MobileBuyBar label={buyBarLabel(event)} available={canPurchase} anchorId="entradas" />

      {indexingEnabled ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(event) }} />
      ) : null}
    </div>
  );
}
