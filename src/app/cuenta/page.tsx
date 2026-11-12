import type { Metadata } from 'next';
import Link from 'next/link';

import { ProfileForm } from '@/components/accounts/profile-form';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { signOutAction } from '@/features/auth/actions';
import { accountPanelLinksForRole, accountPath, buyerHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Mi cuenta DEMO',
  robots: { index: false, follow: false },
};

function formatConsentDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export default async function AccountPage() {
  // El proxy solo mira cookies; esta comprobación valida la sesión y el rol en el servidor.
  const account = await requireRole('buyer', accountPath);
  const panelLinks = accountPanelLinksForRole(account.role);

  // RLS solo devuelve la fila del propio usuario.
  const { data, error } = await account.client
    .from('profiles')
    .select('display_name, university, marketing_opt_in, consented_at')
    .eq('id', account.userId)
    .maybeSingle();

  if (error) {
    throw new Error('No pudimos cargar tu cuenta.');
  }

  const initial = {
    displayName: typeof data?.display_name === 'string' ? data.display_name : '',
    university: typeof data?.university === 'string' ? data.university : null,
    marketingOptIn: data?.marketing_opt_in === true,
  };
  const consentedOn =
    initial.marketingOptIn && typeof data?.consented_at === 'string' ? formatConsentDate(data.consented_at) : null;

  return (
    <section aria-labelledby="cuenta-title" className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 id="cuenta-title" className="flex items-center gap-3 font-titulo text-3xl font-bold leading-tight tracking-tight">
          <Icon name="user" size={24} />
          Mi cuenta
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">
          Modo DEMO. Guardamos solo lo necesario: tu nombre, tu universidad si quieres indicarla y tu preferencia de correo.
        </p>
      </header>

      <div className="rounded-lg bg-superficie p-6 shadow-sm">
        <ProfileForm initial={initial} consentedOn={consentedOn} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={buyerHomePath} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
          <Icon name="ticket" />
          Mis boletos
        </Link>
        {panelLinks.map((link) => (
          <Link key={link.href} href={link.href} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
            <Icon name={link.href === '/admin/' ? 'settings' : 'layoutDashboard'} />
            {link.label}
          </Link>
        ))}
        <form action={signOutAction}>
          <button type="submit" className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>
            <Icon name="logOut" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </section>
  );
}
