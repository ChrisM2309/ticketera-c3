import { siteConfig } from '@/lib/site-config';

export default function Home() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 md:px-6">
      <div className="flex flex-wrap gap-3">
        <span className="rounded-pill bg-crea px-4 py-2 text-sm font-medium text-navy">
          Proyecto académico
        </span>
        <span className="rounded-pill border border-borde-fuerte px-4 py-2 text-sm">
          Moneda: {siteConfig.currency}
        </span>
      </div>
      <h1 className="max-w-3xl font-titulo text-3xl font-bold leading-tight tracking-tight md:text-5xl">
        Explorá eventos tecnológicos en El Salvador
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-texto-suave">{siteConfig.description}</p>
    </section>
  );
}
