import { EventCard } from '@/components/catalog/event-card';
import { FeaturedControls } from '@/components/catalog/featured-controls';
import type { CatalogEvent } from '@/features/catalog/types';

export const featuredListId = 'destacados-lista';

type FeaturedCarouselProps = Readonly<{
  events: readonly CatalogEvent[];
}>;

/**
 * Destacados de la portada (D-35). Sin JavaScript se desliza con el dedo o la rueda: el scroll-snap
 * hace el trabajo. Los controles son una mejora progresiva (FeaturedControls).
 * Sin avance automático: el usuario decide cuándo cambiar (DESIGN.md; WCAG 2.2.2).
 */
export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  if (events.length === 0) {
    return null;
  }

  const total = events.length;

  return (
    <section aria-label="Eventos destacados" aria-roledescription="carrusel" className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-navy shadow-lg">
      <div
        id={featuredListId}
        tabIndex={0}
        role="region"
        aria-label="Destacados"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-texto-inverso [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${total}`}
            className="w-full shrink-0 snap-start"
          >
            <EventCard event={event} featured showOrganizer />
          </div>
        ))}
      </div>

      {total > 1 ? <FeaturedControls total={total} listId={featuredListId} /> : null}
    </section>
  );
}
