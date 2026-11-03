import Link from 'next/link';

import { eventDateParts, modeLabel, priceLabel } from '@/features/catalog/format';
import { lineForEventType, type CatalogLine } from '@/features/catalog/lines';
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
}>;

/** Tarjeta de evento. La fecha va en una «entrada» recortada, como un boleto. */
export function EventCard({ event, featured = false }: EventCardProps) {
  const date = eventDateParts(event.startsAt);
  const line = lineForEventType(event.eventType.slug);
  const href = eventPath({
    slug: event.slug,
    eventTypeSlug: event.eventType.slug,
    topicSlug: event.topic?.slug ?? null,
  });

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg bg-superficie shadow-sm',
      )}
    >
      <div className={cn('h-1.5', lineStripe[line])} aria-hidden="true" />
      <div className={cn('flex flex-1', featured ? 'flex-col md:flex-row' : 'flex-row')}>
        <div
          className={cn(
            'flex shrink-0 flex-col items-center justify-center gap-0.5 bg-navy px-5 py-4 text-texto-inverso',
            'border-r border-dashed border-borde-fuerte',
            featured ? 'md:w-44' : 'w-24',
          )}
        >
          <span
            className={cn(
              'font-titulo font-extrabold leading-none',
              featured ? 'text-6xl' : 'text-3xl',
            )}
          >
            {date.day}
          </span>
          <span className="font-texto text-sm font-medium">{date.month}</span>
          <span className="font-texto text-xs font-medium text-compite-claro">{date.time}</span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className={cn('font-titulo font-bold leading-snug', featured ? 'text-2xl' : 'text-lg')}>
            <Link href={href} className="hover:underline underline-offset-4">
              {event.title}
            </Link>
          </h3>
          <div className="font-texto text-sm text-texto-suave">
            <p>{event.eventType.name}</p>
            <p>{modeLabel(event.mode)}{event.location ? `, ${event.location.name}` : ''}</p>
            {event.organizer ? <p>{event.organizer.name}</p> : null}
          </div>
          <p className="mt-auto pt-2 font-titulo text-lg font-bold">{priceLabel(event.ticketTypes)}</p>
        </div>
      </div>
    </article>
  );
}
