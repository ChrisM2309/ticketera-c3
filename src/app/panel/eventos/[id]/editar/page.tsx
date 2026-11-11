import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublishEventForm, type FormOption } from '@/components/organizers/publish-event-form';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Editar evento DEMO',
  robots: { index: false, follow: false },
};

type CategoryRow = { id: string; name: string; kind: string };
type Speaker = { name: string; role: string };

function localDateTime(value: string | null): string {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const get = (name: string) => parts.find((part) => part.type === name)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export default async function EditOrganizerEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireRole('organizer', `/panel/eventos/${id}/editar/`);
  const [eventResult, categoriesResult] = await Promise.all([
    account.client.from('events')
      .select('id, title, description, agenda, mode, venue, location_id, image_path, starts_at, ends_at, event_type_id, topic_id, speakers, includes_certificate, status')
      .eq('id', id)
      .maybeSingle(),
    account.client.from('categories').select('id, name, kind')
      .in('kind', ['event_type', 'topic', 'location']).order('sort_order', { ascending: true }),
  ]);

  if (eventResult.error || categoriesResult.error) throw new Error('No pudimos cargar los datos del evento.');
  const event = eventResult.data;
  if (!event || event.status === 'archived') notFound();
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const optionsOf = (kind: string): FormOption[] => categories.filter((row) => row.kind === kind).map(({ id: optionId, name }) => ({ id: optionId, name }));
  const speakers = (event.speakers ?? []) as Speaker[];
  const initialValues: Record<string, string> = {
    title: event.title,
    description: event.description,
    agenda: event.agenda ?? '',
    mode: event.mode,
    venue: event.venue ?? '',
    locationId: event.location_id ?? '',
    eventTypeId: event.event_type_id,
    topicId: event.topic_id ?? '',
    imageUrl: event.image_path ?? '',
    startsAt: localDateTime(event.starts_at),
    endsAt: localDateTime(event.ends_at),
    includesCertificate: event.includes_certificate ? 'on' : '',
  };
  speakers.slice(0, 8).forEach((speaker, index) => {
    initialValues[`speakerName${index + 1}`] = speaker.name;
    initialValues[`speakerRole${index + 1}`] = speaker.role;
  });

  return (
    <section aria-labelledby="edit-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="edit-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">Editar evento</h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Actualiza la información del evento. Si ya está publicado, los cambios volverán a revisión antes de aparecer en el catálogo.
        </p>
      </header>
      <PublishEventForm eventId={event.id} initialValues={initialValues}
        eventTypes={optionsOf('event_type')} topics={optionsOf('topic')} locations={optionsOf('location')} />
    </section>
  );
}
