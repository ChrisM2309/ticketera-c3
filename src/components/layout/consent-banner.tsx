'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { consentCookie, parseConsent } from '@/lib/analytics/consent';
import { trackEvent } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';

const consentChangedEvent = 'ticketera-consent-changed';

function subscribeConsent(onChange: () => void) {
  window.addEventListener(consentChangedEvent, onChange);
  return () => window.removeEventListener(consentChangedEvent, onChange);
}

function getClientConsent() {
  return parseConsent(document.cookie);
}

function getServerConsent() {
  return 'unset' as const;
}

export function ConsentBanner() {
  const state = useSyncExternalStore(subscribeConsent, getClientConsent, getServerConsent);

  function choose(next: 'granted' | 'denied') {
    document.cookie = consentCookie(next);
    window.dispatchEvent(new Event(consentChangedEvent));
    if (next === 'granted') trackEvent('page_view');
  }

  if (state !== 'unset') return null;
  return (
    <aside aria-label="Consentimiento de analítica" className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie p-4 shadow-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl font-texto text-sm leading-6 text-texto-suave">Usamos analítica propia y mínima para entender qué pantallas DEMO se visitan. No medimos nada sin tu decisión. <Link href="/privacidad/" className="underline">Más información</Link>.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => choose('granted')} className={cn(buttonVariants({ variant: 'compra' }), 'w-full sm:w-auto')}>Aceptar analítica</button>
          <button type="button" onClick={() => choose('denied')} className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-auto')}>Solo lo necesario</button>
        </div>
      </div>
    </aside>
  );
}
