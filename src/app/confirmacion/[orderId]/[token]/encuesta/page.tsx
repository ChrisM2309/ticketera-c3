import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SurveyForm } from '@/components/checkout/survey-form';
import { hashCheckoutToken } from '@/features/checkout/order';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Encuesta del evento DEMO',
  robots: { index: false, follow: false },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

export default async function SurveyPage({ params }: { params: Promise<{ orderId: string; token: string }> }) {
  const { orderId, token } = await params;
  if (!uuidPattern.test(orderId) || !tokenPattern.test(token)) notFound();

  const client = createServiceRoleClient();
  if (!client) throw new Error('La encuesta DEMO no está disponible todavía.');
  const orderResult = await client
    .from('orders')
    .select('id, event_id, status')
    .eq('id', orderId)
    .eq('public_token_hash', hashCheckoutToken(token))
    .maybeSingle();
  if (orderResult.error || !orderResult.data || orderResult.data.status !== 'confirmed') notFound();

  const eventResult = await client.from('events').select('starts_at').eq('id', orderResult.data.event_id).maybeSingle();
  if (eventResult.error || !eventResult.data) notFound();
  const isTooEarly = new Date(eventResult.data.starts_at).getTime() > new Date().getTime();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <p className="font-texto text-sm text-texto-suave">Encuesta DEMO</p>
        <h1 className="font-titulo text-3xl font-bold">Cuéntanos cómo fue el evento</h1>
      </header>
      {isTooEarly ? (
        <p className="rounded-xl bg-superficie p-6 font-texto">La encuesta se abre cuando empieza el evento.</p>
      ) : (
        <SurveyForm orderId={orderId} token={token} />
      )}
    </main>
  );
}
