import type { Metadata } from 'next';

import { NewPasswordForm } from '@/components/auth/new-password-form';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = {
  title: 'Contraseña nueva DEMO',
  description: 'Elige una contraseña nueva para tu cuenta de Ticketera C3 DEMO.',
  robots: { index: false, follow: false },
};

export default function NuevaContrasenaPage() {
  return (
    <section aria-labelledby="nueva-title" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="nueva-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name="lock" size={24} />
          Contraseña nueva
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Elige una contraseña de 8 a 72 caracteres para tu cuenta.
        </p>
      </header>

      <div className="rounded-lg bg-superficie p-6 shadow-sm">
        <NewPasswordForm />
      </div>
    </section>
  );
}
