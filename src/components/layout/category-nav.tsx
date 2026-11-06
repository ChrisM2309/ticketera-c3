'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { NavLink } from '@/components/layout/nav-link';
import type { CategoryGroup, MenuItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

type CategoryNavProps = Readonly<{
  groups: readonly CategoryGroup[];
  accountLinks: readonly MenuItem[];
}>;

/**
 * Navegación de categorías en tres grupos (D-34).
 * Escritorio: un desplegable por grupo. Móvil: botón Menú que muestra los grupos completos.
 * Se cierra al navegar, con Escape y al tocar fuera.
 */
export function CategoryNav({ groups, accountLinks }: CategoryNavProps) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const botonRef = useRef<HTMLButtonElement>(null);
  const desplegablesRef = useRef<HTMLElement>(null);

  // Al cambiar de ruta, el menú móvil se cierra: no queda abierto en la página siguiente.
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname);
    setAbierto(false);
  }

  // Al tocar fuera de un desplegable de escritorio, se cierra.
  useEffect(() => {
    function cerrarFuera(event: MouseEvent) {
      const destino = event.target as Node;
      desplegablesRef.current?.querySelectorAll('details[open]').forEach((detalle) => {
        if (!detalle.contains(destino)) {
          detalle.removeAttribute('open');
        }
      });
    }

    document.addEventListener('mousedown', cerrarFuera);

    return () => document.removeEventListener('mousedown', cerrarFuera);
  }, []);

  function cerrarConEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') {
      return;
    }

    setAbierto(false);
    botonRef.current?.focus();
    desplegablesRef.current?.querySelectorAll('details[open]').forEach((detalle) => detalle.removeAttribute('open'));
  }

  return (
    <div className="contents" onKeyDown={cerrarConEscape}>
      <button
        ref={botonRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={menuId}
        onClick={() => setAbierto((valor) => !valor)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border-2 border-borde-fuerte px-4 font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto-inverso md:hidden"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menú
      </button>

      {/* Móvil: panel completo, con los tres grupos a la vista. */}
      <div id={menuId} className={cn('w-full border-t border-borde pt-3 md:hidden', abierto ? 'block' : 'hidden')}>
        <nav aria-label="Cuenta" className="mb-4">
          <ul className="flex flex-col gap-1">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Categorías de eventos" className="flex flex-col gap-4">
          {groups.map((grupo) => (
            <section key={grupo.id} aria-labelledby={`${menuId}-${grupo.id}`}>
              <h2 id={`${menuId}-${grupo.id}`} className="px-3 font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto-suave">
                {grupo.label}
              </h2>
              <ul className="mt-1 flex flex-col">
                {grupo.items.map((categoria) => (
                  <li key={categoria.slug}>
                    <NavLink href={categoria.href} active={pathname.startsWith(categoria.href)}>
                      {categoria.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>

      {/* Escritorio: un desplegable por grupo, en una sola fila. */}
      <nav
        ref={desplegablesRef}
        aria-label="Categorías de eventos"
        className="hidden w-full border-t border-borde pt-2 [color-scheme:dark] md:block md:border-t-0 md:pt-0"
      >
        <ul className="flex flex-wrap items-center gap-1">
          {groups.map((grupo) => (
            <li key={grupo.id} className="relative">
              <details className="group">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm px-3 text-sm font-medium text-texto-inverso hover:underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                  {grupo.label}
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="transition-transform group-open:rotate-180">
                    <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </summary>
                <ul className="absolute left-0 top-full z-20 mt-2 grid w-72 gap-1 rounded-md bg-superficie p-3 text-texto shadow-md">
                  {grupo.items.map((categoria) => (
                    <li key={categoria.slug}>
                      <Link
                        href={categoria.href}
                        aria-current={pathname.startsWith(categoria.href) ? 'page' : undefined}
                        className="flex min-h-11 items-center rounded-sm px-3 font-texto text-sm font-medium text-texto underline-offset-4 hover:underline aria-[current=page]:bg-superficie-sutil"
                      >
                        {categoria.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
