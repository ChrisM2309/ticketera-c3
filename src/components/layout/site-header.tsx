import Image from 'next/image';
import Link from 'next/link';

import { CartLink } from '@/components/layout/cart-link';
import { CategoryNav } from '@/components/layout/category-nav';
import { NavLink } from '@/components/layout/nav-link';
import { SiteSearch } from '@/components/layout/site-search';
import { DemoBadge } from '@/components/ui/demo-badge';
import { accountLinks, categoryGroups } from '@/lib/navigation';

export function SiteHeader() {
  return (
    <header data-theme="oscuro" className="bg-fondo text-texto">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          aria-label="Ticketera C3, ir al inicio"
          className="inline-flex items-center gap-3 rounded-sm"
        >
          <Image
            src="/brand/logo-principal-blanco.png"
            alt=""
            width={2920}
            height={1234}
            className="h-9 w-auto"
          />
          <span className="font-titulo text-sm font-bold">Ticketera</span>
        </Link>

        <DemoBadge />

        <SiteSearch />

        {/* Escritorio: publicar a la derecha. En móvil va dentro del menú. */}
        <nav aria-label="Publicar" className="hidden md:ml-auto md:flex md:items-center md:gap-1">
          {accountLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Carrito y Menú van en la misma fila en móvil, sin abrir el menú para comprar. */}
        <CartLink className="ml-auto md:ml-0" />
        <CategoryNav groups={categoryGroups} accountLinks={accountLinks} />
      </div>
    </header>
  );
}
