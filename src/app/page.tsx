import { siteConfig } from '@/lib/site-config';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F203E] px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#33BEAC]">
          {siteConfig.demoLabel}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Explorá eventos tecnológicos en El Salvador
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-200">
          {siteConfig.description}
        </p>
        <div className="flex flex-wrap gap-3" aria-label="Estado del proyecto">
          <span className="rounded-full bg-[#33BEAC] px-4 py-2 text-sm font-semibold text-[#0F203E]">
            Proyecto académico
          </span>
          <span className="rounded-full border border-white/30 px-4 py-2 text-sm">
            Moneda: {siteConfig.currency}
          </span>
        </div>
      </div>
    </main>
  );
}
