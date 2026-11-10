import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { formatNoShow, noShowPercent } from '@/features/organizers/report';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Reporte del evento DEMO',
  robots: { index: false, follow: false },
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const usd = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type ReportRow = {
  issued: number;
  checked_in: number;
  subtotal_cents: number;
  fee_cents: number;
  event_ended: boolean;
  survey_count: number;
  survey_average: number | null;
};

export default async function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const account = await requireRole('organizer', `/panel/eventos/${id}/reporte/`);
  const [eventResult, reportResult] = await Promise.all([
    account.client.from('events').select('id, title').eq('id', id).maybeSingle(),
    account.client.rpc('organizer_event_report', { p_event_id: id }),
  ]);

  if (!eventResult.data) notFound();
  if (eventResult.error || reportResult.error) throw new Error('No pudimos cargar el reporte del evento.');

  const report = (reportResult.data?.[0] ?? null) as ReportRow | null;
  if (!report) notFound();
  const noShow = noShowPercent({ issued: report.issued, checkedIn: report.checked_in, eventEnded: report.event_ended });
  const cards = [
    { label: 'Emitidos', value: String(report.issued) },
    { label: 'Con ingreso', value: String(report.checked_in) },
    { label: 'No-show', value: formatNoShow(noShow) },
    { label: 'Ventas (subtotal)', value: usd.format(report.subtotal_cents / 100) },
    { label: 'Comisión', value: usd.format(report.fee_cents / 100) },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-titulo text-3xl font-bold">Reporte del evento</h1>
        <p className="font-texto text-lg text-texto-suave">{eventResult.data.title}</p>
        <p className="font-texto text-sm text-texto-suave">Datos DEMO agregados. No se muestran datos personales de compradores.</p>
      </header>
      <section aria-label="Resumen del evento" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl bg-superficie p-5">
            <h2 className="font-texto text-sm font-medium text-texto-suave">{card.label}</h2>
            <p className="mt-2 font-titulo text-2xl font-bold">{card.value}</p>
          </article>
        ))}
      </section>
      <p className="font-texto text-sm text-texto-suave">Encuestas recibidas: {report.survey_count}{report.survey_average === null ? '' : ` · Promedio ${report.survey_average.toFixed(1)} de 5`}</p>
    </main>
  );
}
