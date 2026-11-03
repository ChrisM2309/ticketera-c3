import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type NavLinkProps = Readonly<{
  href: string;
  active?: boolean;
  className?: string;
  children: ReactNode;
}>;

export function NavLink({ href, active = false, className, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 items-center whitespace-nowrap rounded-sm px-3 text-sm font-medium text-texto-inverso underline-offset-4 hover:underline aria-[current=page]:bg-superficie aria-[current=page]:text-texto',
        className,
      )}
    >
      {children}
    </Link>
  );
}
