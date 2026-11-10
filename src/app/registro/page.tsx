import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/register-form';
import { Icon } from '@/components/ui/icon';
import { safeNextPath } from '@/lib/auth/access';

export const metadata: Metadata = {
  title: 'Crear cuenta DEMO',
  description: 'Creá una cuenta opcional de comprador en Ticketera C3 DEMO para ver tus boletos.',
  robots: { index: false, follow: false },
};

type RegistroPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegistroPage({ searchParams }: RegistroPageProps) {
  const params = await searchParams;
  const next = safeNextPath(firstValue(params.next), '');

  return (
    <section aria-labelledby="registro-title" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="registro-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name="userPlus" size={24} />
          Crear cuenta
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Opcional y de demostración: con una cuenta ves tus boletos en un solo lugar. Para comprar no la necesitás,
          podés seguir como invitado.
        </p>
      </header>

      <div className="rounded-lg bg-superficie p-6 shadow-sm">
        <RegisterForm next={next} />
      </div>
    </section>
  );
}
