import type { Metadata } from 'next';
import Link from 'next/link';

import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = { title: 'Métricas | Administración DEMO', robots: { index: false, follow: false } };

type MetricRow = { day: string; name: string; total: number };

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function MetricsPage() {
  const account = await requireRole('admin', '/admin/metricas/');
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 29);
  const result = await account.client.rpc('admin_analytics_summary', { p_from: dateOnly(from), p_to: dateOnly(to) });
  if (result.error) throw new Error('No pudimos cargar las métricas.');
  const rows = (result.data ?? []) as MetricRow[];
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <Link href={adminHomePath} className="font-texto text-sm text-texto-suave underline">Volver a administración</Link>
        <h1 className="font-titulo text-3xl font-bold">Métricas propias DEMO</h1>
        <p className="font-texto leading-7 text-texto-suave">Resumen de eventos aceptados durante los últimos 30 días. No incluye datos antes del consentimiento.</p>
      </header>
      {rows.length === 0 ? <p className="rounded-lg bg-superficie p-6 font-texto text-texto-suave">Todavía no hay eventos de analítica.</p> : (
        <div className="overflow-x-auto rounded-lg bg-superficie">
          <table className="w-full min-w-[32rem] text-left font-texto text-sm">
            <thead><tr className="border-b border-borde"><th className="p-4 font-titulo">Día</th><th className="p-4 font-titulo">Evento</th><th className="p-4 text-right font-titulo">Total</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={`${row.day}-${row.name}`} className="border-b border-borde"><td className="p-4">{row.day}</td><td className="p-4">{row.name}</td><td className="p-4 text-right tabular-nums">{row.total}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}
