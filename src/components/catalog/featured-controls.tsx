'use client';

import { useEffect, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type FeaturedControlsProps = Readonly<{
  total: number;
  listId: string;
}>;

const botonClase =
  'inline-flex size-11 cursor-pointer items-center justify-center rounded-pill border-2 border-borde-fuerte bg-superficie text-texto transition-colors hover:bg-superficie-sutil focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion disabled:cursor-default disabled:opacity-40';

/** Flechas y puntos del carrusel de destacados. Solo cambian la posición del desplazamiento. */
export function FeaturedControls({ total, listId }: FeaturedControlsProps) {
  const [indice, setIndice] = useState(0);

  // Al desplazarse (con dedo, rueda o teclado), el punto activo sigue a la diapositiva visible.
  useEffect(() => {
    const lista = document.getElementById(listId);

    if (!lista) {
      return;
    }

    function actualizar() {
      const ancho = lista?.clientWidth ?? 1;
      setIndice(Math.min(total - 1, Math.round((lista?.scrollLeft ?? 0) / ancho)));
    }

    lista.addEventListener('scroll', actualizar, { passive: true });

    return () => lista.removeEventListener('scroll', actualizar);
  }, [listId, total]);

  function irA(destino: number) {
    const lista = document.getElementById(listId);

    if (!lista) {
      return;
    }

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lista.scrollTo({ left: destino * lista.clientWidth, behavior: reducido ? 'auto' : 'smooth' });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Destacado anterior"
          disabled={indice === 0}
          onClick={() => irA(indice - 1)}
          className={botonClase}
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <button
          type="button"
          aria-label="Destacado siguiente"
          disabled={indice === total - 1}
          onClick={() => irA(indice + 1)}
          className={botonClase}
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Elegir destacado">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Mostrar destacado ${index + 1} de ${total}`}
            aria-current={index === indice ? 'true' : undefined}
            onClick={() => irA(index)}
            className="inline-flex size-11 cursor-pointer items-center justify-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                'block h-2 rounded-pill bg-borde-fuerte transition-[width,background-color]',
                index === indice ? 'w-6 bg-accion' : 'w-2',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
