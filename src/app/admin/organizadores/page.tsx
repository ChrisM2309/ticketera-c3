import type { Metadata } from 'next';
import Link from 'next/link';

import { LinkOrganizerForm } from '@/components/organizers/link-organizer-form';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatEventStart } from '@/features/organizers/panel';
import { adminOrganizersPath } from '@/features/organizers/link-form';
import { maskEmail } from '@/features/ticketing/notifications';
import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Organizadores DEMO',
  robots: { index: false, follow: false },
};

type OrganizerRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  owner_email: string | null;
  created_at: string;
};

export default async function AdminOrganizersPage() {
  // El proxy solo mira cookies; esta comprobación valida la sesión y el rol en el servidor.
  const account = await requireRole('admin', adminOrganizersPath);

  // La función SQL vuelve a comprobar is_admin() y es la única que puede leer el correo de auth.users.
  const { data, error } = await account.client.rpc('admin_list_organizers');

  if (error) {
    throw new Error('No pudimos cargar los organizadores.');
  }

  const organizers = (data ?? []) as OrganizerRow[];

  return (
    <section aria-labelledby="organizers-title" className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 id="organizers-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
            Organizadores
          </h1>
          <p className="font-texto text-base leading-7 text-texto-suave">
            Modo DEMO. Vincula una cuenta registrada con una organización para que pueda publicar eventos.
          </p>
        </div>
        <Link href={adminHomePath} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
          <Icon name="chevronLeft" />
          Volver a administración
        </Link>
      </header>

      <section aria-labelledby="link-title" className="flex flex-col gap-4">
        <h2 id="link-title" className="font-titulo text-xl font-bold">
          Vincular un organizador
        </h2>
        <LinkOrganizerForm />
      </section>

      <section aria-labelledby="list-title" className="flex flex-col gap-4">
        <h2 id="list-title" className="font-titulo text-xl font-bold">
          Organizaciones vinculadas
        </h2>

        {organizers.length === 0 ? (
          <p className="rounded-lg bg-superficie p-6 font-texto text-base leading-7 text-texto-suave">
            Todavía no hay organizaciones.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
            {organizers.map((organizer) => (
              <li key={organizer.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-texto text-base font-medium text-texto">{organizer.name}</span>
                  <span className="font-texto text-sm text-texto-suave">
                    {organizer.slug} · Creada el {formatEventStart(organizer.created_at)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-texto text-sm text-texto-suave">
                  <Icon name="mail" size={16} />
                  {organizer.owner_email ? maskEmail(organizer.owner_email) : 'Sin dueño'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
