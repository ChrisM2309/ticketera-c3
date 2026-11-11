import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { Icon } from '@/components/ui/icon';
import { readSessionError, sessionErrorMessages, safeNextPath } from '@/lib/auth/access';

export const metadata: Metadata = {
  title: 'Ingresar DEMO',
  description: 'Acceso a cuentas de Ticketera C3 DEMO: organizadores, administración y compradores.',
  robots: { index: false, follow: false },
};

type IngresarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const linkClass = 'inline-flex min-h-11 items-center text-enlace underline-offset-4 hover:underline';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IngresarPage({ searchParams }: IngresarPageProps) {
  const params = await searchParams;
  const sessionError = readSessionError(firstValue(params.error));
  const next = safeNextPath(firstValue(params.next), '');
  const registerHref = next ? `/registro/?next=${encodeURIComponent(next)}` : '/registro/';

  return (
    <section aria-labelledby="ingresar-title" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="ingresar-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name="logIn" size={24} />
          Ingresar
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Zona DEMO para organizadores y administración. Para comprar no necesitas cuenta: puedes seguir como invitado.
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

      <nav aria-label="Otras opciones de cuenta" className="flex flex-col gap-1 font-titulo text-sm font-semibold">
        <Link href="/recuperar/" className={linkClass}>
          ¿Olvidaste tu contraseña?
        </Link>
        <Link href={registerHref} className={linkClass}>
          Crear una cuenta
        </Link>
        <Link href="/" className={linkClass}>
          Continuar como invitado
        </Link>
      </nav>
    </section>
  );
}
