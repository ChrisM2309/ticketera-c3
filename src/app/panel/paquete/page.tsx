import type { Metadata } from 'next';
import Link from 'next/link';

import { BenefitList } from '@/components/packages/benefit-list';
import { buttonVariants } from '@/components/ui/button';
import { formatUsd } from '@/features/catalog/format';
import { getSiteSettings } from '@/features/settings/settings';
import { requestPackageFollowupAction } from '@/features/packages/actions';
import { requireRole } from '@/lib/auth/require-role';
import { organizerHomePath } from '@/lib/auth/access';
import { cn } from '@/lib/utils';
import { describeBenefits } from '@/features/packages/benefits';

export const metadata: Metadata = {
  title: 'Mi paquete empresarial | Ticketera C3 DEMO',
  robots: { index: false, follow: false },
};

export default async function BusinessPackagePage() {
  const account = await requireRole('organizer', '/panel/paquete/');
  const settings = await getSiteSettings();
  const packagesResult = await account.client
    .from('business_packages')
    .select('id, starts_on, ends_on, price_cents, featured_days_remaining, events_remaining, status, package_followup_requests(id, message, status, created_at)')
    .order('created_at', { ascending: false });

  if (packagesResult.error) throw new Error('No pudimos cargar tu paquete empresarial.');
  const packages = (packagesResult.data ?? []) as unknown as Array<{
    id: string; starts_on: string; ends_on: string; price_cents: number; featured_days_remaining: number;
    events_remaining: number; status: string; package_followup_requests: Array<{ id: string; message: string; status: string; created_at: string }>;
  }>;
  const activePackage = packages.find((item) => item.status === 'active');

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <Link href={organizerHomePath} className="font-texto text-sm text-texto-suave underline">Volver al panel</Link>
        <h1 className="font-titulo text-3xl font-bold">Mi paquete empresarial</h1>
        <p className="font-texto leading-7 text-texto-suave">Estado, beneficios y seguimientos del paquete DEMO.</p>
      </header>

      {activePackage ? (
        <section aria-labelledby="active-package-title" className="flex flex-col gap-5 rounded-lg bg-superficie p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="active-package-title" className="font-titulo text-xl font-bold">Paquete activo</h2>
            <span className="rounded-pill bg-superficie-sutil px-3 py-1 font-texto text-sm font-semibold">{activePackage.status}</span>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div><dt className="font-texto text-sm text-texto-suave">Vigencia</dt><dd className="font-semibold">{activePackage.starts_on} – {activePackage.ends_on}</dd></div>
            <div><dt className="font-texto text-sm text-texto-suave">Días de destacado restantes</dt><dd className="font-semibold">{activePackage.featured_days_remaining}</dd></div>
            <div><dt className="font-texto text-sm text-texto-suave">Eventos restantes</dt><dd className="font-semibold">{activePackage.events_remaining}</dd></div>
          </dl>
          <p className="font-texto text-sm text-texto-suave">Precio registrado: {formatUsd(activePackage.price_cents)}.</p>
          <form action={requestPackageFollowupAction} className="flex flex-col gap-3 border-t border-borde pt-5">
            <input type="hidden" name="packageId" value={activePackage.id} />
            <label htmlFor="package-message" className="font-texto text-sm font-semibold">Solicitar seguimiento</label>
            <textarea id="package-message" name="message" required minLength={5} maxLength={500} rows={3} className="rounded-md border border-borde-fuerte bg-fondo p-3" placeholder="¿En qué podemos acompañarte?" />
            <button type="submit" className={cn(buttonVariants({ variant: 'compra' }), 'w-fit')}>Solicitar seguimiento</button>
          </form>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-lg bg-superficie p-6">
          <h2 className="font-titulo text-xl font-bold">Todavía no tienes un paquete activo</h2>
          <p className="font-texto leading-7 text-texto-suave">Conoce los beneficios y contrata el paquete anual con pago de demostración.</p>
          <Link href="/para-empresas/" className={cn(buttonVariants({ variant: 'compra' }), 'w-fit')}>Ver paquete para empresas</Link>
        </section>
      )}

      <section aria-labelledby="benefits-title" className="flex flex-col gap-4">
        <h2 id="benefits-title" className="font-titulo text-xl font-bold">Beneficios configurados</h2>
        <BenefitList benefits={describeBenefits(settings.packageBenefits)} />
      </section>

      <section aria-labelledby="history-title" className="flex flex-col gap-4">
        <h2 id="history-title" className="font-titulo text-xl font-bold">Historial</h2>
        {packages.length === 0 ? <p className="rounded-lg bg-superficie p-5 font-texto text-texto-suave">No hay compras registradas.</p> : (
          <ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">
            {packages.map((item) => <li key={item.id} className="flex flex-col gap-1 p-4 font-texto text-sm"><span className="font-semibold">{item.status}</span><span className="text-texto-suave">{item.starts_on} – {item.ends_on} · {formatUsd(item.price_cents)}</span>{item.package_followup_requests.map((followup) => <span key={followup.id} className="text-texto-suave">Seguimiento: {followup.message} ({followup.status})</span>)}</li>)}
          </ul>
        )}
      </section>
    </main>
  );
}
