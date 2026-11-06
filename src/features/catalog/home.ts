import { isFree } from './format';
import type { CatalogEvent } from './types';

/** Destacados de la portada: los marca el administrador, con un máximo de cuatro (D-35). */
export const maxFeaturedEvents = 4;

const upcomingLimit = 6;
const freeLimit = 3;

export type HomeSelection = {
  featured: CatalogEvent[];
  upcoming: CatalogEvent[];
  free: CatalogEvent[];
};

/**
 * Reparte los eventos de la portada sin repetir ninguno.
 * Destacados: los que marcó el administrador; si no hay ninguno, los próximos.
 * Próximos y gratuitos excluyen lo ya mostrado.
 */
export function chooseHomeEvents(input: {
  featured: readonly CatalogEvent[];
  upcoming: readonly CatalogEvent[];
}): HomeSelection {
  const featured = (input.featured.length > 0 ? input.featured : input.upcoming)
    .slice(0, maxFeaturedEvents);
  const shownAsFeatured = new Set(featured.map((item) => item.id));

  const upcoming = input.upcoming
    .filter((item) => !shownAsFeatured.has(item.id))
    .slice(0, upcomingLimit);
  const shownUpcoming = new Set(upcoming.map((item) => item.id));

  const free = input.upcoming
    .filter((item) => !shownAsFeatured.has(item.id) && !shownUpcoming.has(item.id) && isFree(item.ticketTypes))
    .slice(0, freeLimit);

  return { featured, upcoming, free };
}
