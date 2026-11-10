'use client';

import { NavLink } from '@/components/layout/nav-link';
import { useAccountLinks } from '@/components/layout/use-account-links';
import { Icon } from '@/components/ui/icon';

/** Zona de cuenta de la cabecera en escritorio: publicar y, según la sesión, ingresar o ver boletos y cuenta. */
export function AccountNav() {
  const links = useAccountLinks();

  return (
    <nav aria-label="Cuenta y publicación" className="hidden md:ml-auto md:flex md:items-center md:gap-1">
      {links.map((link) => (
        <NavLink key={link.href} href={link.href} className="gap-2">
          {link.icon ? <Icon name={link.icon} /> : null}
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
