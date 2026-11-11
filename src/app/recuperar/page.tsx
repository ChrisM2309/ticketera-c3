import type { Metadata } from 'next';

import { RecoverForm } from '@/components/auth/recover-form';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = {
  title: 'Recuperar contraseña DEMO',
  description: 'Pide un enlace para cambiar la contraseña de tu cuenta de Ticketera C3 DEMO.',
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return (
    <section aria-labelledby="recuperar-title" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="recuperar-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name="lock" size={24} />
          Recuperar contraseña
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.
        </p>
      </header>

      <div className="rounded-lg bg-superficie p-6 shadow-sm">
        <RecoverForm />
      </div>
    </section>
  );
}
