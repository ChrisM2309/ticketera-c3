import type { Metadata } from 'next';
import Link from 'next/link';

import { BenefitList } from '@/components/packages/benefit-list';
import { PackagePurchase } from '@/components/packages/package-purchase';
import { DemoBadge } from '@/components/ui/demo-badge';
import { buttonVariants } from '@/components/ui/button';
import { formatUsd } from '@/features/catalog/format';
import { describeBenefits } from '@/features/packages/benefits';
import { getSiteSettings } from '@/features/settings/settings';
import { readOptionalSession } from '@/lib/auth/optional-session';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: 'Para empresas | Ticketera C3 DEMO',
    robots: settings.indexingEnabled ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ForBusinessesPage() {
  const [settings, session] = await Promise.all([getSiteSettings(), readOptionalSession()]);
  let isOrganizer = false;

  if (session) {
    const { data } = await session.client.from('organizers').select('id').eq('owner_user_id', session.userId).limit(1);
    isOrganizer = Boolean(data?.length);
  }

  const priceLabel = settings.packageAnnualPriceCents === null ? 'Precio por definir' : formatUsd(settings.packageAnnualPriceCents);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex max-w-3xl flex-col gap-4">
        <DemoBadge className="self-start" />
        <h1 className="font-titulo text-4xl font-bold tracking-tight">Impulsa todos tus eventos</h1>
        <p className="font-texto text-lg leading-8 text-texto-suave">
          Un paquete anual DEMO para organizaciones que publican varios eventos tecnológicos en El Salvador.
        </p>
        <p className="font-titulo text-2xl font-bold">{priceLabel} <span className="font-texto text-sm font-normal text-texto-suave">por año</span></p>
      </header>

      <BenefitList benefits={describeBenefits(settings.packageBenefits)} />

      <section aria-labelledby="contract-title" className="max-w-2xl rounded-lg bg-superficie p-6">
        <h2 id="contract-title" className="font-titulo text-xl font-bold">Contratar</h2>
        {isOrganizer && settings.packageAnnualPriceCents !== null ? (
          <div className="mt-5"><PackagePurchase amountCents={settings.packageAnnualPriceCents} /></div>
        ) : isOrganizer ? (
          <p className="mt-3 font-texto leading-7 text-texto-suave">El responsable todavía debe definir el precio en Administración → Ajustes.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <p className="font-texto leading-7 text-texto-suave">Inicia sesión con una cuenta de organizador para contratar el paquete.</p>
            <Link href="/ingresar/?next=%2Fpara-empresas%2F" className={cn(buttonVariants({ variant: 'compra' }), 'w-fit')}>Iniciar sesión</Link>
          </div>
        )}
      </section>
    </main>
  );
}
