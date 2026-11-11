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
      <ul className="grid grid-cols-2 gap-3">
        {discoveryShortcutLinks.map((shortcut) => (
          <li key={shortcut.href}>
            <Link
              href={shortcut.href}
              title={shortcut.description}
              className="group flex h-16 min-h-16 items-center gap-3 rounded-md border border-borde-fuerte bg-superficie px-3 py-2.5 transition-colors hover:border-accion hover:bg-superficie-sutil focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accion"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-superficie-sutil text-accion transition-colors group-hover:bg-superficie">
                <Icon name={shortcut.icon} size={20} tone="accion" />
              </span>
              <span className="min-w-0">
                <span className="block font-titulo text-sm font-bold leading-tight text-texto">{shortcut.label}</span>
                <span className="line-clamp-1 font-texto text-xs leading-5 text-texto-suave">{shortcut.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
