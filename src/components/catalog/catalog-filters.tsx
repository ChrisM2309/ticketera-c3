import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { hasActiveFilters, type CatalogFilters } from '@/features/catalog/filters';
import type { CatalogCategory } from '@/features/catalog/types';

const fieldClass =
  'min-h-11 w-full rounded-sm border border-borde-fuerte bg-superficie px-3 font-texto text-base text-texto';

const labelClass = 'inline-flex items-center gap-2 font-texto text-sm font-medium text-texto';

/** Etiqueta del filtro con su icono decorativo; el texto de la etiqueta siempre se muestra. */
function FilterLabel({ htmlFor, icon, children }: Readonly<{ htmlFor: string; icon: IconName; children: string }>) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      <Icon name={icon} size={16} />
      {children}
    </label>
  );
}

type CatalogFiltersProps = Readonly<{
  filters: CatalogFilters;
  locations: readonly CatalogCategory[];
  organizers: readonly { slug: string; name: string }[];
  topics: readonly CatalogCategory[];
  showCiudad: boolean;
  clearHref: string;
  query?: string;
}>;

/** Filtros con GET: la búsqueda queda en la URL y el formulario funciona sin JavaScript. */
export function CatalogFilters({ filters, locations, topics, organizers, showCiudad, clearHref, query }: CatalogFiltersProps) {
  const active = hasActiveFilters(filters);
  return (
    <details open={active} className="rounded-lg bg-superficie">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg px-4 py-3 font-titulo font-semibold text-texto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-enlace">
        <span>{active ? 'Filtros aplicados' : 'Filtrar eventos'}</span>
        <span className="text-sm font-normal text-texto-suave">Tema, ciudad, organizador, modalidad, precio y fecha</span>
      </summary>
      <form method="get" aria-label="Filtrar eventos" className="grid gap-4 p-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
      {query ? <input type="hidden" name="q" value={query} readOnly /> : null}
      <div className="flex flex-col gap-2">
        <FilterLabel htmlFor="filtro-tema" icon="tag">Tema</FilterLabel>
        <select id="filtro-tema" name="tema" defaultValue={filters.tema ?? ''} className={fieldClass}>
          <option value="">Todos los temas</option>
          {topics.map((topic) => <option key={topic.slug} value={topic.slug}>{topic.name}</option>)}
        </select>
      </div>
      {showCiudad ? (
        <div className="flex flex-col gap-2">
          <FilterLabel htmlFor="filtro-ciudad" icon="mapPin">
            Ciudad
          </FilterLabel>
          <select id="filtro-ciudad" name="ciudad" defaultValue={filters.ciudad ?? ''} className={fieldClass}>
            <option value="">Todas las ciudades</option>
            {locations.map((location) => (
              <option key={location.slug} value={location.slug}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <FilterLabel htmlFor="filtro-organizador" icon="building">Organizador</FilterLabel>
        <select id="filtro-organizador" name="organizador" defaultValue={filters.organizador ?? ''} className={fieldClass}>
          <option value="">Todos los organizadores</option>
          {organizers.map((organizer) => <option key={organizer.slug} value={organizer.slug}>{organizer.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <FilterLabel htmlFor="filtro-modalidad" icon="monitor">
          Modalidad
        </FilterLabel>
        <select id="filtro-modalidad" name="modalidad" defaultValue={filters.modalidad ?? ''} className={fieldClass}>
          <option value="">Todas las modalidades</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">En línea</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <FilterLabel htmlFor="filtro-precio" icon="tag">
          Precio
        </FilterLabel>
        <select id="filtro-precio" name="precio" defaultValue={filters.precio ?? ''} className={fieldClass}>
          <option value="">Todos los precios</option>
          <option value="gratis">Gratis</option>
          <option value="pago">De pago</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <FilterLabel htmlFor="filtro-fecha" icon="calendar">
          Fecha
        </FilterLabel>
        <select id="filtro-fecha" name="fecha" defaultValue={filters.fecha ?? ''} className={fieldClass}>
          <option value="">Todas las fechas</option>
          <option value="semana">Próximos 7 días</option>
          <option value="mes">Próximos 30 días</option>
          <option value="fin-de-semana">Este fin de semana</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button type="submit" className={buttonVariants({ variant: 'primario' })}>
          Aplicar filtros
        </button>
        {active ? (
          <Link
            href={clearHref}
            className="font-titulo font-semibold text-enlace underline-offset-4 hover:underline"
          >
            Quitar filtros
          </Link>
        ) : null}
      </div>
      </form>
    </details>
  );
}
