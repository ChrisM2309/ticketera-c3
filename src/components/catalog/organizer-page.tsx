import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { EventCard } from '@/components/catalog/event-card';
import type { OrganizerPageData } from '@/features/catalog/organizers';
import { organizationJsonLd } from '@/lib/seo/jsonld';
import { siteConfig } from '@/lib/site-config';

type Props = Readonly<{ organizer: OrganizerPageData; indexingEnabled: boolean }>;

export function OrganizerPage({ organizer, indexingEnabled }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <Breadcrumbs items={[{ label: 'Ticketera C3', href: '/' }, { label: organizer.name }]} indexingEnabled={indexingEnabled} />
      {indexingEnabled ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd({ name: organizer.name, description: organizer.description, path: `/${organizer.slug}/`, isDemo: true }, siteConfig.siteUrl)).replace(/</g, '\\u003c') }} /> : null}
      <header className="flex max-w-3xl flex-col gap-4">
        <p className="font-texto text-sm font-semibold uppercase tracking-etiqueta text-texto-suave">Organizador DEMO</p>
        <h1 className="font-titulo text-4xl font-bold leading-tight tracking-tight">{organizer.name}</h1>
        <p className="text-lg leading-relaxed text-texto-suave">{organizer.description}</p>
      </header>
      <section aria-labelledby="organizer-events" className="flex flex-col gap-6">
        <h2 id="organizer-events" className="font-titulo text-2xl font-bold">Próximos eventos</h2>
        {organizer.events.length > 0 ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{organizer.events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <p className="rounded-lg bg-superficie-sutil p-6 text-texto-suave">Este organizador todavía no tiene eventos próximos publicados.</p>}
      </section>
    </main>
  );
}
