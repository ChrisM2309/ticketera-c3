import type { Metadata } from 'next';

import { signOutAction } from '@/features/auth/actions';
import { pendingReviewText } from '@/features/organizers/panel';
import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Administración DEMO',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Solo el rol admin pasa; un organizador recibe redirección a /panel/.
  const account = await requireRole('admin', adminHomePath);

  const pendingResult = await account.client
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingResult.error) {
    throw new Error('No pudimos cargar los eventos pendientes.');
  }

  return (
    <section aria-labelledby="admin-title" className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="admin-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
            Administración
          </h1>
          <p className="font-texto text-base leading-7 text-texto-suave">Modo DEMO. Zona exclusiva del administrador.</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
            Cerrar sesión
          </button>
        </form>
      </header>

      <p role="status" className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto">
        {pendingReviewText(pendingResult.count ?? 0)}
      </p>
    </section>
  );
}
