import Link from 'next/link';

import { EventImage } from '@/components/catalog/event-image';
import { Icon } from '@/components/ui/icon';
import { eventDateParts, modeLabel, priceLabel } from '@/features/catalog/format';
import { coverImagePath } from '@/features/catalog/images';
import { lineForEventType, type CatalogLine } from '@/features/catalog/lines';
import { iconForEventType, toneForEventType } from '@/features/catalog/icons';
import { eventPath } from '@/features/catalog/paths';
import type { CatalogEvent } from '@/features/catalog/types';
import { cn } from '@/lib/utils';

const lineStripe: Record<CatalogLine, string> = {
  compite: 'bg-compite',
  crea: 'bg-crea',
  conecta: 'bg-conecta',
};

type EventCardProps = Readonly<{
  event: CatalogEvent;
  featured?: boolean;
  showOrganizer?: boolean;
}>;

/**
 * Tarjeta de evento: foto arriba, fecha en una «entrada» recortada como boleto.
 * Todo el recuadro enlaza a la ficha; el título es el enlace accesible.
 */
export function EventCard({ event, featured = false, showOrganizer = false }: EventCardProps) {
  const date = eventDateParts(event.startsAt);
  const line = lineForEventType(event.eventType.slug);
  const href = eventPath({
    slug: event.slug,
    eventTypeSlug: event.eventType.slug,
    topicSlug: event.topic?.slug ?? null,
  });

  return (
    <article className={cn('relative flex h-full flex-col overflow-hidden bg-superficie', featured ? 'rounded-none shadow-none' : 'rounded-md shadow-sm')}>
      <div className={cn('relative bg-navy', featured ? 'aspect-[2/1]' : 'aspect-[16/10]')}>
        <EventImage key={`${event.id}:${event.imagePath}`} event={event} src={coverImagePath(event)}
          sizes={featured ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'} />
      </div>
      <div className={cn('h-1.5', lineStripe[line])} aria-hidden="true" />

      <div className={cn('flex flex-1', featured ? 'flex-col md:flex-row' : 'flex-row')}>
        <div
          className={cn(
            'flex shrink-0 flex-col items-center justify-center gap-0.5 bg-navy px-4 py-4 text-texto-inverso',
            'border-r border-dashed border-borde-fuerte',
            featured ? 'md:w-36' : 'w-24',
          )}
        >
          <Icon name="calendar" size={16} />
          <span
            className={cn(
              'font-titulo font-extrabold leading-none',
              featured ? 'text-5xl' : 'text-3xl',
            )}
          >
            {date.day}
          </span>
          <span className="font-texto text-sm font-medium">{date.month}</span>
          <span className="inline-flex items-center gap-1 font-texto text-xs font-medium">
            <Icon name="clock" size={16} />
            {date.time}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
          <h3 className={cn('font-titulo font-bold leading-snug', featured ? 'text-xl md:text-2xl' : 'text-lg')}>
            <Link href={href} className="after:absolute after:inset-0 underline-offset-4 hover:underline">
              {event.title}
            </Link>
          </h3>
          <div className="flex flex-col gap-1 font-texto text-sm text-texto-suave">
            <p className="flex items-center gap-2">
              <Icon name={iconForEventType(event.eventType.slug)} size={16} tone={toneForEventType(event.eventType.slug)} />
              <span>{event.eventType.name}</span>
            </p>
            <p className="flex items-center gap-2">
              <Icon name={event.mode === 'virtual' ? 'monitor' : 'mapPin'} size={16} />
              <span>{modeLabel(event.mode)}{event.location ? `, ${event.location.name}` : ''}</span>
            </p>
            {showOrganizer && event.organizer ? (
              <p className="flex items-center gap-2">
                <Icon name="building" size={16} />
                <span>{event.organizer.name}</span>
              </p>
            ) : null}
          </div>
          <p className="mt-auto flex items-center gap-2 rounded-sm bg-superficie-sutil px-3 py-2 pt-2 font-titulo text-xl font-extrabold text-accion">
            <Icon name="tag" size={20} />
            {priceLabel(event.ticketTypes)}
          </p>
        </div>
      </div>
    </article>
  );
}
