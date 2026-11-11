import Link from 'next/link';

import { Icon, type IconName } from '@/components/ui/icon';

export const discoveryShortcutLinks = [
  {
    label: 'Este fin de semana',
    description: 'Sábado y domingo próximos',
    href: '/buscar/?fecha=fin-de-semana',
    icon: 'calendar',
  },
  {
    label: 'Gratis',
    description: 'Sin costo de entrada',
    href: '/buscar/?precio=gratis',
    icon: 'tag',
  },
  {
    label: 'En línea',
    description: 'Participá desde donde estés',
    href: '/buscar/?modalidad=virtual',
    icon: 'monitor',
  },
  {
    label: 'Cerca de mí',
    description: 'Eventos presenciales en San Salvador',
    href: '/buscar/?ciudad=san-salvador',
    icon: 'mapPin',
  },
] as const satisfies readonly { label: string; description: string; href: string; icon: IconName }[];

/** Atajos de descubrimiento que funcionan como enlaces GET, incluso sin JavaScript. */
export function DiscoveryShortcuts() {
  return (
    <nav aria-label="Explorar eventos rápidamente">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {discoveryShortcutLinks.map((shortcut) => (
          <li key={shortcut.href}>
            <Link
              href={shortcut.href}
              className="group flex min-h-20 h-full flex-col justify-between gap-2 rounded-md border border-borde-fuerte bg-superficie px-4 py-3 transition-colors hover:border-accion hover:bg-superficie-sutil focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion"
            >
              <span className="flex items-center gap-2 font-titulo text-sm font-bold text-texto">
                <Icon name={shortcut.icon} size={20} tone="accion" />
                {shortcut.label}
              </span>
              <span className="font-texto text-xs leading-5 text-texto-suave">{shortcut.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
