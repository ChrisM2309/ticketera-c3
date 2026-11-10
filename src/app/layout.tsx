import type { Metadata } from 'next';
import { Montserrat, Poppins } from 'next/font/google';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ConsentBanner } from '@/components/layout/consent-banner';
import { PageViewTracker } from '@/components/layout/page-view-tracker';
import { getSiteSettings } from '@/features/settings/settings';
import { robotsMetadata } from '@/lib/seo/indexing';
import { siteConfig } from '@/lib/site-config';

import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: `${siteConfig.name} · DEMO`,
      template: `%s · ${siteConfig.name} · DEMO`,
    },
    description: siteConfig.description,
    robots: robotsMetadata({ indexingEnabled: settings.indexingEnabled, pageIndexable: true }),
  };
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={siteConfig.locale} className={`${montserrat.variable} ${poppins.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:bg-superficie focus:px-4 focus:py-2 focus:text-texto"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <PageViewTracker />
        <ConsentBanner />
      </body>
    </html>
  );
}
