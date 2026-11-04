import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';
import { readSessionError, sessionErrorMessages, safeNextPath } from '@/lib/auth/access';

export const metadata: Metadata = {
  title: 'Ingresar DEMO',
  description: 'Acceso para organizadores y administración de Ticketera C3 DEMO.',
  robots: { index: false, follow: false },
};

type IngresarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IngresarPage({ searchParams }: IngresarPageProps) {
  const params = await searchParams;
  const sessionError = readSessionError(firstValue(params.error));
  const next = safeNextPath(firstValue(params.next), '');

  return (
    <section aria-labelledby="ingresar-title" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="ingresar-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          Ingresar
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Zona DEMO para organizadores y administración. Los compradores no necesitan cuenta.
        </p>
      </header>

      {sessionError ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {sessionErrorMessages[sessionError]}
        </p>
      ) : null}

      <div className="rounded-lg bg-superficie p-6 shadow-sm">
        <LoginForm next={next} />
      </div>
    </section>
  );
}
