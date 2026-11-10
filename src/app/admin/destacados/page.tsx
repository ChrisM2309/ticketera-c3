import type { Metadata } from 'next';
import Link from 'next/link';

import { FeaturedTable } from '@/components/admin/featured-table';
import { formatEventStart } from '@/features/organizers/panel';
import {
  adminFeaturedPath,
  createManualFeaturedAction,
} from '@/features/featured/actions';
import { parseFeaturedFilters, type FeaturedRow } from '@/features/featured/admin';
import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Destacados | Administración DEMO',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function FeaturedAdminPage({ searchParams }: Props) {
  const account = await requireRole('admin', adminFeaturedPath);
  const filters = parseFeaturedFilters(await searchParams);
  const offset = (filters.page - 1) * 20;
  let query = account.client
    .from('featured_placements')
    .select('id, source, status, starts_on, ends_on, days, total_cents, event:events(title)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + 19);
  if (filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.source !== 'all') query = query.eq('source', filters.source);
  const { data, error } = await query;
  if (error) throw new Error('No pudimos cargar los destacados.');

  const rows = ((data ?? []) as unknown as Array<{
    id: string; source: 'manual' | 'paid'; status: string; starts_on: string; ends_on: string; days: number; total_cents: number;
    event: { title: string } | null;
  }>).map<FeaturedRow>((row) => ({
    id: row.id,
    eventTitle: row.event?.title ?? 'Evento',
    source: row.source,
    status: row.status,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    days: row.days,
    totalCents: row.total_cents,
  }));

  const eventsResult = await account.client
    .from('events')
    .select('id, title, starts_at')
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(50);
  if (eventsResult.error) throw new Error('No pudimos cargar los eventos publicados.');

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={adminHomePath} className="font-texto text-sm text-texto-suave underline">Volver a administración</Link>
          <h1 className="mt-2 font-titulo text-3xl font-bold">Destacados</h1>
          <p className="mt-2 font-texto text-base leading-7 text-texto-suave">Gestiona destacados manuales y pagados. Pago DEMO.</p>
        </div>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-lg bg-superficie p-4">
        <label className="flex flex-col gap-1 font-texto text-sm text-texto">Estado
          <select name="status" defaultValue={filters.status} className="rounded-md border border-borde bg-fondo px-3 py-2">
            {['all', 'pending', 'approved', 'rejected', 'payment_failed', 'cancelled'].map((status) => <option key={status} value={status}>{status === 'all' ? 'Todos' : status}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-texto text-sm text-texto">Origen
          <select name="source" defaultValue={filters.source} className="rounded-md border border-borde bg-fondo px-3 py-2">
            <option value="all">Todos</option><option value="manual">Manual</option><option value="paid">Pagado</option>
          </select>
        </label>
        <button type="submit" className={buttonVariants({ variant: 'secundario' })}>Filtrar</button>
      </form>

      <FeaturedTable rows={rows} />

      <section aria-labelledby="manual-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6">
        <h2 id="manual-title" className="font-titulo text-xl font-bold">Crear destacado manual</h2>
        <form action={createManualFeaturedAction} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <label className="flex flex-col gap-1 font-texto text-sm sm:col-span-2">Evento publicado
            <select name="eventId" required className="rounded-md border border-borde bg-fondo px-3 py-2">
              <option value="">Selecciona un evento</option>
              {(eventsResult.data ?? []).map((event) => <option key={event.id} value={event.id}>{event.title} · {formatEventStart(event.starts_at)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-texto text-sm">Inicio<input required type="date" name="startsOn" className="rounded-md border border-borde bg-fondo px-3 py-2" /></label>
          <label className="flex flex-col gap-1 font-texto text-sm">Fin<input required type="date" name="endsOn" className="rounded-md border border-borde bg-fondo px-3 py-2" /></label>
          <button type="submit" className={cn(buttonVariants({ variant: 'compra' }), 'sm:col-span-4 sm:w-fit')}>Crear destacado manual</button>
        </form>
      </section>
    </main>
  );
}
