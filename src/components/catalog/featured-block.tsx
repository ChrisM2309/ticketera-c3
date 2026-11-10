import { EventCard } from '@/components/catalog/event-card';
import type { CatalogEvent } from '@/features/catalog/types';

export function FeaturedBlock({ events, heading }: { events: CatalogEvent[]; heading: string }) {
  if (events.length === 0) return null;

  return (
    <section aria-labelledby="destacados-categoria" className="flex flex-col gap-6">
      <h2 id="destacados-categoria" className="font-titulo text-2xl font-bold">{heading}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => <EventCard key={event.id} event={event} featured />)}
      </div>
    </section>
  );
}
