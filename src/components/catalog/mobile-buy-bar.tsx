import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

type MobileBuyBarProps = Readonly<{
  /** Precio corto ya formateado, por ejemplo «Desde $18» o «Gratis». */
  label: string;
  /** Falso cuando no hay entradas que comprar: la barra no se renderiza. */
  available: boolean;
  /** Id de la caja de compra a la que lleva el botón (sin «#»). */
  anchorId: string;
}>;

/**
 * Barra fija inferior de la ficha, solo bajo `md`. Muestra el precio y lleva a la caja de compra;
 * el cobro (simulado) y los totales se calculan en el servidor al continuar.
 */
export function MobileBuyBar({ label, available, anchorId }: MobileBuyBarProps) {
  if (!available) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-md md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-titulo text-lg font-bold text-texto">
          <Icon name="tag" />
          {label}
        </p>
        <Link href={`#${anchorId}`} className={buttonVariants({ variant: 'compra' })}>
          Elegir entradas
        </Link>
      </div>
    </div>
  );
}
