import Link from 'next/link';
import type { ReactNode } from 'react';

import { signOutAction } from '@/features/auth/actions';
import { Icon } from '@/components/ui/icon';
import { type ConsoleNavigation, consoleSiteLink } from '@/lib/console-navigation';

import { ConsoleNav } from './console-nav';
import { consoleLinkBase } from './console-styles';

/** Pie del panel: volver al sitio público y cerrar sesión. Se renderiza en el servidor. */
function ConsoleFooter() {
  return (
    <>
      <Link href={consoleSiteLink.href} className={consoleLinkBase}>
        <Icon name={consoleSiteLink.icon} />
        {consoleSiteLink.label}
      </Link>
      <form action={signOutAction}>
        <button type="submit" className={`${consoleLinkBase} w-full`}>
          <Icon name="logOut" />
          Cerrar sesión
        </button>
      </form>
    </>
  );
}

type ConsoleShellProps = Readonly<{
  navigation: ConsoleNavigation;
  children: ReactNode;
}>;

/**
 * Estructura común de /admin y /panel: panel lateral a la izquierda en escritorio y barra plegable
 * arriba en móvil. El contenido de cada página conserva su propio ancho y márgenes.
 */
export function ConsoleShell({ navigation, children }: ConsoleShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-2 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
      <aside className="px-4 pt-4 sm:px-6 lg:sticky lg:top-6 lg:self-start lg:px-0 lg:pt-10">
        <ConsoleNav navigation={navigation} footer={<ConsoleFooter />} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
