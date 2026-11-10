'use client';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export function PrintButton({ label = 'Imprimir boletos' }: Readonly<{ label?: string }>) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full print:hidden')}
    >
      <Icon name="print" />
      {label}
    </button>
  );
}
