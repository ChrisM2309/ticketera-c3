import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CheckInForm } from '@/components/organizers/check-in-form';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Check-in del evento DEMO',
  robots: { index: false, follow: false },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const account = await requireRole('organizer', `/panel/eventos/${id}/checkin/`);
  const [eventResult, countsResult] = await Promise.all([
    account.client.from('events').select('id, title').eq('id', id).maybeSingle(),
    account.client.rpc('organizer_event_check_in_counts', { p_event_id: id }),
  ]);

  if (!eventResult.data) notFound();
  if (eventResult.error || countsResult.error) {
    throw new Error('No pudimos cargar el check-in del evento.');
  }

  const counts = (countsResult.data?.[0] ?? { issued: 0, checked_in: 0 }) as { issued: number; checked_in: number };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-titulo text-3xl font-bold">Check-in</h1>
        <p className="font-texto text-lg text-texto-suave">{eventResult.data.title}</p>
        <p className="font-texto text-sm text-texto-suave">Modo DEMO. El lector solo valida el boleto y no muestra datos personales.</p>
      </header>
      <section aria-label="Conteo de entradas" className="grid grid-cols-2 gap-3">
        <p className="rounded-lg bg-superficie p-4 font-texto">Emitidos: <strong>{counts.issued}</strong></p>
        <p className="rounded-lg bg-superficie p-4 font-texto">Con ingreso: <strong>{counts.checked_in}</strong></p>
      </section>
      <CheckInForm eventId={id} />
    </main>
  );
}
