import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscas no existe o cambió de dirección.',
};

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-4 py-16 md:px-6">
      <p className="font-titulo text-6xl font-extrabold leading-none text-accion md:text-7xl">404</p>
      <h1 className="font-titulo text-3xl font-bold leading-tight md:text-4xl">
        Página no encontrada
      </h1>
      <p className="text-lg leading-relaxed text-texto-suave">
        La página que buscas no existe o cambió de dirección. Vuelve al inicio para seguir
        explorando eventos.
      </p>
      <Link href="/" className={buttonVariants({ variant: 'primario', size: 'lg' })}>
        Volver al inicio
      </Link>
    </section>
  );
}
