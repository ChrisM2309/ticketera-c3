'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(buttonVariants({ variant: 'secundario', size: 'lg' }), 'w-full print:hidden')}
    >
      Imprimir boletos
    </button>
  );
}
