import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { BreakdownRow, DailyRow } from '@/features/organizers/advanced-report';
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
    account.client.from('events').select('id, title, organizer_id').eq('id', id).maybeSingle(),
    account.client.rpc('organizer_event_report', { p_event_id: id }),
  ]);

  if (!eventResult.data) notFound();
  if (eventResult.error || reportResult.error) throw new Error('No pudimos cargar el reporte del evento.');

  const report = (reportResult.data?.[0] ?? null) as ReportRow | null;
  if (!report) notFound();

  const packageResult = await account.client
    .from('business_packages')
    .select('id')
    .eq('organizer_id', eventResult.data.organizer_id)
    .eq('status', 'active')
    .maybeSingle();
  if (packageResult.error) throw new Error('No pudimos comprobar el paquete del organizador.');
  const hasAdvancedAccess = account.role === 'admin' || Boolean(packageResult.data);
  let dailyRows: DailyRow[] = [];
  let breakdownRows: BreakdownRow[] = [];
  if (hasAdvancedAccess) {
    const [dailyResult, breakdownResult] = await Promise.all([
      account.client.rpc('organizer_event_daily_issuance', { p_event_id: id }),
      account.client.rpc('organizer_event_ticket_type_breakdown', { p_event_id: id }),
    ]);
    if (dailyResult.error || breakdownResult.error) throw new Error('No pudimos cargar el reporte superior.');
    dailyRows = (dailyResult.data ?? []) as DailyRow[];
    breakdownRows = (breakdownResult.data ?? []) as BreakdownRow[];
  }
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
      {hasAdvancedAccess ? (
        <section aria-label="Reporte superior" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-titulo text-2xl font-bold">Reporte superior</h2>
            <a
              href={`/panel/eventos/${id}/reporte/exportar/`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accion px-5 font-texto font-semibold text-texto-inverso"
            >
              Descargar CSV
            </a>
          </div>
          <div className="overflow-x-auto rounded-xl bg-superficie p-5">
            <h3 className="mb-4 font-titulo text-lg font-semibold">Emisión diaria</h3>
            <table className="w-full text-left font-texto text-sm">
              <thead><tr><th scope="col" className="p-2">Día (UTC)</th><th scope="col" className="p-2">Emitidos</th><th scope="col" className="p-2">Con ingreso</th></tr></thead>
              <tbody>{dailyRows.length ? dailyRows.map((row) => (
                <tr key={row.day} className="border-t border-borde"><td className="p-2">{row.day}</td><td className="p-2">{row.issued}</td><td className="p-2">{row.checked_in}</td></tr>
              )) : <tr><td colSpan={3} className="p-2 text-texto-suave">Sin ventas confirmadas.</td></tr>}</tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded-xl bg-superficie p-5">
            <h3 className="mb-4 font-titulo text-lg font-semibold">Desglose por tipo de entrada</h3>
            <table className="w-full text-left font-texto text-sm">
              <thead><tr><th scope="col" className="p-2">Tipo</th><th scope="col" className="p-2">Emitidos</th><th scope="col" className="p-2">Con ingreso</th><th scope="col" className="p-2">Subtotal</th></tr></thead>
              <tbody>{breakdownRows.length ? breakdownRows.map((row) => (
                <tr key={row.ticket_type_name} className="border-t border-borde"><td className="p-2">{row.ticket_type_name}</td><td className="p-2">{row.issued}</td><td className="p-2">{row.checked_in}</td><td className="p-2">{usd.format(row.subtotal_cents / 100)}</td></tr>
              )) : <tr><td colSpan={4} className="p-2 text-texto-suave">Sin ventas confirmadas.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-xl bg-superficie p-5">
          <h2 className="font-titulo text-xl font-bold">Reporte superior</h2>
          <p className="mt-2 font-texto text-texto-suave">Disponible con el paquete para empresas.</p>
          <Link href="/para-empresas/" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accion px-5 font-texto font-semibold text-texto-inverso">Conocer el paquete</Link>
        </section>
      )}
    </main>
  );
}
