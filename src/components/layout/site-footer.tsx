import Link from 'next/link';

import { DemoBadge } from '@/components/ui/demo-badge';
import { accountLinks, categoryGroups } from '@/lib/navigation';

export function SiteFooter() {
  return (
    <footer data-theme="oscuro" className="bg-fondo text-texto-suave">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="font-titulo text-base font-bold text-texto">Ticketera C3</p>
            <p className="mt-2 text-sm leading-6">
              Proyecto académico con fines demostrativos. No es un producto ni servicio oficial de C3.
              Los pagos son simulados: no se cobra dinero real ni se piden datos de tarjeta.
            </p>
          </div>
          <DemoBadge className="self-start" />
        </div>

        {/* Enlaces del pie: categorías por grupo y publicar. Ayudan a encontrar eventos sin usar el menú. */}
        <nav aria-label="Mapa del sitio" className="grid gap-6 sm:grid-cols-3">
          {categoryGroups.map((grupo) => (
            <section key={grupo.id} aria-labelledby={`pie-${grupo.id}`}>
              <h2 id={`pie-${grupo.id}`} className="font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto">
                {grupo.label}
              </h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {grupo.items.map((categoria) => (
                  <li key={categoria.slug}>
                    <Link href={categoria.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                      {categoria.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section aria-labelledby="pie-cuenta">
            <h2 id="pie-cuenta" className="font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto">
              Organizadores
            </h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </nav>
      </div>
    </footer>
  );
}
