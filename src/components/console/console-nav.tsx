'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState, type ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { type ConsoleNavigation, isConsoleItemActive } from '@/lib/console-navigation';

import { consoleBadge, consoleLabel, consoleLinkActive, consoleLinkBase } from './console-styles';

type ConsoleNavProps = Readonly<{
  navigation: ConsoleNavigation;
  /** Enlaces y acciones fijas al final (ver el sitio, cerrar sesión). Se renderizan en el servidor. */
  footer?: ReactNode;
}>;

/**
 * Panel lateral por secciones. En escritorio siempre está desplegado; en móvil se pliega
 * en una barra con la sección actual, sin depender de JavaScript para mostrar el contenido.
 */
export function ConsoleNav({ navigation, footer }: ConsoleNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();

  const allItems = navigation.groups.flatMap((group) => group.items);
  const current = allItems.find((item) => isConsoleItemActive(pathname, item));

  return (
    <nav aria-label={navigation.title} className="flex flex-col gap-3 rounded-lg bg-navy p-3 text-texto-inverso lg:p-4">
      <div className="flex items-center justify-between gap-3 px-2 pt-1">
        <p className="font-titulo text-base font-bold leading-tight">{navigation.title}</p>
        <span className={consoleBadge}>DEMO</span>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(consoleLinkBase, 'justify-between lg:hidden')}
      >
        <span className="flex items-center gap-3">
          <Icon name={current?.icon ?? 'menu'} />
          {current?.label ?? 'Secciones'}
        </span>
        <Icon name="chevronDown" className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      <div id={listId} className={cn(open ? 'flex' : 'hidden', 'flex-col gap-5 lg:flex')}>
        {navigation.groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <p className={consoleLabel}>{group.label}</p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = item === current;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(consoleLinkBase, active && consoleLinkActive)}
                    >
                      <Icon name={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {footer ? <div className="flex flex-col gap-1 border-t border-white/15 pt-3">{footer}</div> : null}
      </div>
    </nav>
  );
}
