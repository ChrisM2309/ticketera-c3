import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { buyerHomePath, safeNextPath } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

type AccountPromptProps = {
  variant: 'checkout' | 'confirmation';
  signedIn: boolean;
  /** Ruta interna a la que vuelve el comprador tras crear la cuenta; si no es segura se usa la de la variante. */
  next?: string;
};

const defaultNext = { checkout: '/checkout/', confirmation: buyerHomePath } as const;

const copy = {
  checkout: 'Comprar sin cuenta sigue funcionando; la cuenta solo te ahorra guardar el enlace de cada compra.',
  confirmation: 'Tu compra queda guardada en tu cuenta de demostración, sin cobros reales.',
} as const;

/** Invitación opcional a crear una cuenta. Con sesión no muestra nada. */
export function AccountPrompt({ variant, signedIn, next }: AccountPromptProps) {
  if (signedIn) {
    return null;
  }

  const destination = safeNextPath(next, defaultNext[variant]);

  return (
    <aside
      aria-label="Cuenta opcional"
      className="flex flex-col gap-3 rounded-lg bg-superficie-sutil p-4 print:hidden sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 font-titulo text-sm font-semibold">
          <Icon name="userPlus" size={16} />
          Crea una cuenta para ver tus boletos en Mis boletos
        </p>
        <p className="font-texto text-sm leading-6 text-texto-suave">{copy[variant]}</p>
      </div>
      <Link
        href={`/registro/?next=${encodeURIComponent(destination)}`}
        className={cn(buttonVariants({ variant: 'secundario' }), 'w-full shrink-0 sm:w-auto')}
      >
        Crear cuenta
      </Link>
    </aside>
  );
}
