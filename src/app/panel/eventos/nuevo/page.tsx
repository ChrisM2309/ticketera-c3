import type { Metadata } from 'next';

import { PublishEventForm, type FormOption } from '@/components/organizers/publish-event-form';
import { publishPath } from '@/features/organizers/form';
import { createPublicClient } from '@/lib/supabase/public';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Publicar evento DEMO',
  robots: { index: false, follow: false },
};

type CategoryRow = { id: string; name: string; kind: string };

export default async function PublishEventPage() {
  // El proxy solo mira cookies; esta comprobación valida la sesión y el rol en el servidor.
  await requireRole('organizer', publishPath);

  const client = createPublicClient();
  const categoriesResult = client
    ? await client
        .from('categories')
        .select('id, name, kind')
        .in('kind', ['event_type', 'topic', 'location'])
        .order('sort_order', { ascending: true })
    : null;

  const categories = (categoriesResult?.data ?? []) as CategoryRow[];
  const optionsOf = (kind: string): FormOption[] =>
    categories.filter((category) => category.kind === kind).map(({ id, name }) => ({ id, name }));

  return (
    <section aria-labelledby="publish-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="publish-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          Publicar un evento
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Modo DEMO. El evento se guarda como pendiente y no aparece en el catálogo hasta que un administrador lo apruebe.
        </p>
      </header>

      {categoriesResult?.error || !client ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          No pudimos cargar las categorías. Intenta nuevamente en unos minutos.
        </p>
      ) : (
        <PublishEventForm
          eventTypes={optionsOf('event_type')}
          topics={optionsOf('topic')}
          locations={optionsOf('location')}
        />
      )}
    </section>
  );
}
