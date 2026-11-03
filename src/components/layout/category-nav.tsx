'use client';

import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';

import { NavLink } from '@/components/layout/nav-link';
import type { CategoryItem, MenuItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

type CategoryNavProps = Readonly<{
  categories: readonly CategoryItem[];
  accountLinks: readonly MenuItem[];
}>;

export function CategoryNav({ categories, accountLinks }: CategoryNavProps) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  return (
    <>
      <div className="w-full md:hidden">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={menuId}
          onClick={() => setAbierto((valor) => !valor)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border-2 border-borde-fuerte px-4 font-titulo text-[13px] font-bold uppercase tracking-[0.08em] text-texto-inverso"
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
      </div>

      <div id={menuId} className={cn('w-full md:block', abierto ? 'block' : 'hidden')}>
        <nav aria-label="Cuenta" className="border-t border-borde pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          aria-label="Categorías de eventos"
          className="mt-2 w-full border-t border-borde pt-2 [color-scheme:dark] md:mt-0 md:overflow-x-auto md:border-t-0 md:pt-0"
        >
          <ul className="grid grid-cols-2 gap-1 md:flex md:gap-1">
            {categories.map((categoria) => (
              <li key={categoria.slug}>
                <NavLink
                  href={categoria.href}
                  active={pathname.startsWith(categoria.href)}
                >
                  {categoria.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
