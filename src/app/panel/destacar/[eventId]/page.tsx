import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeaturedRequestForm } from '@/components/organizers/featured-request-form';
import { requestFeaturedAction } from '@/features/featured/request-actions';
import { getSiteSettings } from '@/features/settings/settings';
import { organizerHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Destacar evento DEMO',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ eventId: string }> };

function todayInElSalvador(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function FeaturedRequestPage({ params }: Props) {
  const account = await requireRole('organizer', organizerHomePath);
  const { eventId } = await params;
  const [eventResult, settings] = await Promise.all([
    account.client.from('events').select('id, title, status').eq('id', eventId).maybeSingle(),
    getSiteSettings(),
  ]);
  if (eventResult.error || !eventResult.data || eventResult.data.status !== 'published') notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="font-texto text-sm text-texto-suave">Pago de demostración · sin datos de tarjeta</p>
        <h1 className="font-titulo text-3xl font-bold">Destacar: {eventResult.data.title}</h1>
        <p className="font-texto text-base leading-7 text-texto-suave">El administrador revisa la solicitud antes de publicarla como destacado.</p>
      </header>
      <FeaturedRequestForm
        eventId={eventResult.data.id}
        eventTitle={eventResult.data.title}
        dailyRateCents={settings.featuredDailyRateCents}
        minDate={todayInElSalvador()}
        action={requestFeaturedAction}
      />
    </main>
  );
}
