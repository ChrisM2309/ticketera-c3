'use client';

import { usePathname } from 'next/navigation';
import { useId, useRef, useState, type KeyboardEvent } from 'react';

import { NavLink } from '@/components/layout/nav-link';
import type { CategoryGroup, MenuItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

type CategoryNavProps = Readonly<{
  groups: readonly CategoryGroup[];
  accountLinks: readonly MenuItem[];
}>;

/**
 * Categorías en cuatro grupos (D-34).
 * Escritorio: una franja con los grupos a la vista, sin desplegables ni clics extra.
 * Móvil: botón Menú que muestra los grupos completos. Se cierra al cambiar de página y con Escape.
 */
export function CategoryNav({ groups, accountLinks }: CategoryNavProps) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const botonRef = useRef<HTMLButtonElement>(null);

  // Al cambiar de ruta, el menú móvil se cierra: no queda abierto en la página siguiente.
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname);
    setAbierto(false);
  }

  function cerrarConEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') {
      return;
    }

    setAbierto(false);
    botonRef.current?.focus();
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

      {/* Móvil: panel con los grupos completos. */}
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

      {/* Escritorio: los cuatro grupos a la vista, en columnas. */}
      <nav
        aria-label="Categorías de eventos"
        className="hidden w-full border-t border-borde/40 pt-4 md:block md:border-t-0 md:pt-0"
      >
        <div className="grid grid-cols-4 gap-6">
          {groups.map((grupo) => (
            <section key={grupo.id} aria-labelledby={`${menuId}-escritorio-${grupo.id}`}>
              <h2 id={`${menuId}-escritorio-${grupo.id}`} className="font-titulo text-sm font-bold text-texto-inverso">
                {grupo.label}
              </h2>
              <ul className="mt-2 flex flex-col">
                {grupo.items.map((categoria) => (
                  <li key={categoria.slug}>
                    <NavLink
                      href={categoria.href}
                      active={pathname.startsWith(categoria.href)}
                      className="min-h-9 px-0 font-normal"
                    >
                      {categoria.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </nav>
    </div>
  );
}
