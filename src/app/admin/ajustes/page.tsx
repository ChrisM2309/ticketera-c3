import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { defaultPackageBenefits, getSiteSettings } from '@/features/settings/settings';
import { toggleIndexingAction, updateSettingsAction } from '@/features/settings/actions';
import { valueFromCents } from '@/features/settings/form';
import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Ajustes | Administración DEMO',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSettingsPage({ searchParams }: Props) {
  const account = await requireRole('admin', '/admin/ajustes/');
  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);
  const values = await account.client.from('site_settings').select('key, updated_by, updated_at').order('key');
  if (values.error) throw new Error('No pudimos cargar la auditoría de ajustes.');
  const indexingAudit = values.data?.find((row) => row.key === 'indexing_enabled');
  const message = firstParam(params.error) === 'confirmacion'
    ? 'Confirma que entiendes que los eventos son de demostración para activar la indexación.'
    : firstParam(params.error)
      ? 'No pudimos guardar los ajustes. Revisa los valores e intenta de nuevo.'
      : firstParam(params.ok)
        ? 'Ajustes guardados.'
        : null;
  const benefits = settings.packageBenefits ?? defaultPackageBenefits;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <Link href={adminHomePath} className="font-texto text-sm text-texto-suave underline">Volver a administración</Link>
        <h1 className="font-titulo text-3xl font-bold">Ajustes</h1>
        <p className="font-texto leading-7 text-texto-suave">Configura precios DEMO, beneficios e indexación pública.</p>
      </header>

      {message ? <p role="status" className="rounded-lg bg-superficie p-4 font-texto text-sm leading-6">{message}</p> : null}

      <section aria-labelledby="indexing-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6">
        <h2 id="indexing-title" className="font-titulo text-xl font-bold">Indexación</h2>
        <p className="font-texto text-sm leading-6 text-texto-suave">Estado actual: <strong>{settings.indexingEnabled ? 'activada' : 'apagada'}</strong>. Cuando está apagada, robots y sitemap no anuncian el sitio.</p>
        {indexingAudit?.updated_at ? <p className="font-texto text-sm text-texto-suave">Última actualización: {indexingAudit.updated_at}</p> : null}
        <form action={toggleIndexingAction} className="flex flex-col gap-4">
          <input type="hidden" name="indexingEnabled" value={settings.indexingEnabled ? 'false' : 'true'} />
          {!settings.indexingEnabled ? <label className="flex items-start gap-3 font-texto text-sm leading-6"><input type="checkbox" name="acknowledgeDemo" className="mt-1 size-5 accent-accion" />Entiendo que los eventos publicados son de demostración.</label> : null}
          <button type="submit" className={cn(buttonVariants({ variant: settings.indexingEnabled ? 'secundario' : 'compra' }), 'w-fit')}>
            {settings.indexingEnabled ? 'Apagar indexación' : 'Activar indexación'}
          </button>
        </form>
      </section>

      <form action={updateSettingsAction} className="flex flex-col gap-8">
        <section aria-labelledby="featured-settings-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6">
          <h2 id="featured-settings-title" className="font-titulo text-xl font-bold">Destacados</h2>
          <label className="flex max-w-sm flex-col gap-1 font-texto text-sm font-semibold">Tarifa diaria (USD)
            <input name="dailyRate" inputMode="decimal" defaultValue={valueFromCents(settings.featuredDailyRateCents)} placeholder="Por definir" className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" />
          </label>
        </section>

        <section aria-labelledby="package-settings-title" className="flex flex-col gap-4 rounded-lg bg-superficie p-6">
          <h2 id="package-settings-title" className="font-titulo text-xl font-bold">Paquete empresas</h2>
          <label className="flex max-w-sm flex-col gap-1 font-texto text-sm font-semibold">Precio anual (USD)
            <input name="packagePrice" inputMode="decimal" defaultValue={valueFromCents(settings.packageAnnualPriceCents)} placeholder="Por definir" className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Eventos incluidos<input name="eventsIncluded" type="number" min="0" step="1" defaultValue={benefits.eventsIncluded} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" /></label>
            <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Días destacados<input name="featuredDaysIncluded" type="number" min="0" step="1" defaultValue={benefits.featuredDaysIncluded} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" /></label>
            <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Descuento (%)<input name="featuredDiscountPercent" type="number" min="0" max="100" step="1" defaultValue={benefits.featuredDiscountPercent} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" /></label>
          </div>
          <label className="flex items-center gap-3 font-texto text-sm"><input type="checkbox" name="personalizedFollowUp" defaultChecked={benefits.personalizedFollowUp} value="true" className="size-5 accent-accion" />Seguimiento personalizado</label>
          <label className="flex items-center gap-3 font-texto text-sm"><input type="checkbox" name="advancedReport" defaultChecked={benefits.advancedReport} value="true" className="size-5 accent-accion" />Reporte de datos superior</label>
        </section>
        <button type="submit" className={cn(buttonVariants({ variant: 'compra' }), 'w-fit')}>Guardar ajustes</button>
      </form>
    </main>
  );
}
