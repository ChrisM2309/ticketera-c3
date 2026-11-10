'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { NavLink } from '@/components/layout/nav-link';
import { useAccountLinks } from '@/components/layout/use-account-links';
import { Icon } from '@/components/ui/icon';
import { iconForEventType, toneForEventType } from '@/features/catalog/icons';
import type { CategoryGroup } from '@/lib/navigation';
import { cn } from '@/lib/utils';

type CategoryNavProps = Readonly<{
  groups: readonly CategoryGroup[];
}>;

const disparador =
  'flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm px-3 text-sm font-medium text-texto-inverso underline-offset-4 hover:underline focus-visible:outline-3 [&::-webkit-details-marker]:hidden';

/**
 * Icono del tipo de evento en el menú, con el trazo del tono de su línea. Las variantes `-texto` del tema oscuro
 * alcanzan 3:1 sobre navy y sobre la superficie oscura del desplegable. Es decorativo: el nombre va siempre al lado.
 */
function TypeIcon({ slug }: Readonly<{ slug: string }>) {
  return <Icon name={iconForEventType(slug)} size={20} tone={toneForEventType(slug)} />;
}

/**
 * Categorías en cuatro grupos desplegables (D-34).
 * Escritorio: una fila de desplegables; cada grupo abre un panel con sus categorías.
 * Móvil: botón Menú que muestra los grupos como acordeones. Se cierra al navegar, con Escape
 * y al tocar fuera de un desplegable.
 */
export function CategoryNav({ groups }: CategoryNavProps) {
  const accountLinks = useAccountLinks();
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const botonRef = useRef<HTMLButtonElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Al cambiar de ruta, el menú móvil se cierra: no queda abierto en la página siguiente.
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname);
    setAbierto(false);
  }

  // Cierra los desplegables de escritorio al cambiar de ruta y al tocar fuera de ellos.
  useEffect(() => {
    contenedorRef.current?.querySelectorAll('details[open]').forEach((detalle) => detalle.removeAttribute('open'));
  }, [pathname]);

  useEffect(() => {
    function cerrarFuera(event: PointerEvent) {
      contenedorRef.current?.querySelectorAll('details[open]').forEach((detalle) => {
        if (!detalle.contains(event.target as Node)) {
          detalle.removeAttribute('open');
        }
      });
    }

    document.addEventListener('pointerdown', cerrarFuera);

    return () => document.removeEventListener('pointerdown', cerrarFuera);
  }, []);

  function cerrarConEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }

    setAbierto(false);
    contenedorRef.current?.querySelectorAll('details[open]').forEach((detalle) => detalle.removeAttribute('open'));
    botonRef.current?.focus();
  }

  return (
    <div ref={contenedorRef} className="contents" onKeyDown={cerrarConEscape}>
      <button
        ref={botonRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={menuId}
        onClick={() => setAbierto((valor) => !valor)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border-2 border-borde-fuerte px-4 font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto-inverso md:hidden"
      >
        <Icon name={abierto ? 'close' : 'menu'} />
        Menú
      </button>

      {/* Móvil: acordeones por grupo, dentro del panel Menú. */}
      <div id={menuId} className={cn('w-full border-t border-borde pt-3 md:hidden', abierto ? 'block' : 'hidden')}>
        <nav aria-label="Cuenta" className="mb-3">
          <ul className="flex flex-col gap-1">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} className="gap-2">
                  {link.icon ? <Icon name={link.icon} /> : null}
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Categorías de eventos" className="flex flex-col gap-1">
          {groups.map((grupo) => (
            <details key={grupo.id} className="group rounded-md" open={grupo.items.some((item) => pathname.startsWith(item.href))}>
              <summary className={cn(disparador, 'w-full justify-between px-3 font-titulo text-etiqueta font-bold uppercase tracking-etiqueta')}>
                {grupo.label}
                <Icon name="chevronDown" size={16} className="transition-transform group-open:rotate-180" />
              </summary>
              <ul className="flex flex-col pb-2">
                {grupo.items.map((categoria) => (
                  <li key={categoria.slug}>
                    <NavLink href={categoria.href} active={pathname.startsWith(categoria.href)} className="gap-2">
                      <TypeIcon slug={categoria.slug} />
                      {categoria.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
      </div>

      {/* Escritorio: una fila de desplegables, uno por grupo. */}
      <nav aria-label="Categorías de eventos" className="hidden w-full border-t border-borde/40 md:block md:border-t-0">
        <ul className="flex items-center gap-1">
          {groups.map((grupo) => (
            <li key={grupo.id} className="relative">
              <details className="group">
                <summary className={disparador}>
                  {grupo.label}
                  <Icon name="chevronDown" size={16} className="transition-transform group-open:rotate-180" />
                </summary>
                <ul className="absolute left-0 top-full z-30 mt-1 grid w-64 gap-1 rounded-md bg-superficie p-2 text-texto shadow-md">
                  {grupo.items.map((categoria) => {
                    const actual = pathname.startsWith(categoria.href);

                    return (
                      <li key={categoria.slug}>
                        <Link
                          href={categoria.href}
                          aria-current={actual ? 'page' : undefined}
                          className="flex min-h-11 items-center gap-2 rounded-sm px-3 font-texto text-sm font-medium text-texto underline-offset-4 hover:bg-superficie-sutil hover:underline aria-[current=page]:bg-superficie-sutil"
                        >
                          <TypeIcon slug={categoria.slug} />
                          {categoria.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
