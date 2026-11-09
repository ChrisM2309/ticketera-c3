import type { Metadata } from 'next';

import { termsSections } from '@/features/legal/content';

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Condiciones de uso de Ticketera C3 DEMO: pagos simulados y alcance del proyecto académico.',
};

export default function TerminosPage() {
  return (
    <article aria-labelledby="terminos-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="terminos-title" className="font-titulo text-3xl font-bold leading-tight tracking-tight">
          Términos de uso
        </h1>
        <p className="font-texto text-base leading-7 text-texto-suave">Proyecto académico DEMO. Reglas simples para usar este sitio.</p>
      </header>

      {termsSections.map((section) => (
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
