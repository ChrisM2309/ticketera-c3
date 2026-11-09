import type { Metadata } from 'next';

import { privacySections } from '@/features/legal/content';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos trata Ticketera C3 DEMO, para qué y cómo ejercer tus derechos.',
};

export default function PrivacidadPage() {
  return (
    <article aria-labelledby="privacidad-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="privacidad-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          Política de privacidad
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">Proyecto académico DEMO. Texto en lenguaje claro sobre los datos que usamos.</p>
      </header>

      {privacySections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="flex flex-col gap-3">
          <h2 id={`${section.id}-title`} className="font-titulo text-xl font-bold leading-snug">
            {section.title}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="font-texto text-base leading-7 text-texto-suave">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
