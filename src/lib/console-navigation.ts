import type { IconName } from '@/components/ui/icon';

export type ConsoleItem = {
  href: string;
  label: string;
  icon: IconName;
  /** El inicio de cada consola solo está activo en su propia ruta; el resto también cubre sus subrutas. */
  exact?: boolean;
};

export type ConsoleGroup = {
  id: string;
  label: string;
  items: readonly ConsoleItem[];
};

export type ConsoleNavigation = {
  /** Nombre de la zona que aparece arriba del panel lateral. */
  title: string;
  groups: readonly ConsoleGroup[];
};

export const adminNavigation: ConsoleNavigation = {
  title: 'Administración',
  groups: [
    {
      id: 'operacion',
      label: 'Operación',
      items: [
        { href: '/admin/', label: 'Resumen', icon: 'layoutDashboard', exact: true },
        { href: '/admin/organizadores/', label: 'Organizadores', icon: 'users' },
        { href: '/admin/destacados/', label: 'Destacados', icon: 'star' },
      ],
    },
    {
      id: 'contenido',
      label: 'Contenido',
      items: [
        { href: '/admin/contenido/', label: 'Textos y blog', icon: 'fileText' },
        { href: '/admin/metricas/', label: 'Métricas', icon: 'chart' },
      ],
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      items: [{ href: '/admin/ajustes/', label: 'Ajustes', icon: 'settings' }],
    },
  ],
};

export const organizerNavigation: ConsoleNavigation = {
  title: 'Panel del organizador',
  groups: [
    {
      id: 'eventos',
      label: 'Eventos',
      items: [
        { href: '/panel/', label: 'Resumen', icon: 'layoutDashboard', exact: true },
        { href: '/panel/eventos/nuevo/', label: 'Publicar evento', icon: 'calendarPlus' },
      ],
    },
    {
      id: 'empresas',
      label: 'Empresas',
      items: [{ href: '/panel/paquete/', label: 'Paquete empresas', icon: 'package' }],
    },
  ],
};

/** Enlace de salida fuera de la consola, presente en ambas zonas. */
export const consoleSiteLink = { href: '/', label: 'Ver el sitio', icon: 'globe' } as const satisfies ConsoleItem;

function withTrailingSlash(path: string): string {
  const [pathOnly] = path.split(/[?#]/);
  if (!pathOnly || pathOnly === '/') return '/';
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`;
}

/** Decide si un enlace del panel corresponde a la ruta actual. Respeta la barra final de las URL (D-23). */
export function isConsoleItemActive(pathname: string, item: ConsoleItem): boolean {
  const current = withTrailingSlash(pathname);
  const target = withTrailingSlash(item.href);

  if (item.exact) return current === target;
  return current === target || current.startsWith(target);
}
