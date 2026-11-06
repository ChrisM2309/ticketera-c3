import Link from 'next/link';

import { DemoBadge } from '@/components/ui/demo-badge';
import { accountLinks, categoryGroups } from '@/lib/navigation';

/*
 * Datos de contacto de demostración: no son reales. Se marcan como DEMO para que nadie
 * los tome como datos de una empresa (AGENTS.md: sitio y pagos etiquetados como DEMO).
 */
const contacto = {
  correo: 'contacto@ticketera.example',
  telefono: '+503 0000-0000',
  direccion: 'San Salvador, El Salvador',
  horario: 'Lunes a viernes, 8:00 a 17:00',
};

const enlaceClase = 'inline-flex min-h-11 items-center underline-offset-4 hover:underline';
const tituloClase = 'font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto';

export function SiteFooter() {
  return (
    <footer data-theme="oscuro" className="border-t border-borde/40 bg-fondo text-texto-suave">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <section aria-labelledby="pie-empresa" className="flex flex-col gap-4">
          <h2 id="pie-empresa" className={tituloClase}>
            Ticketera C3
          </h2>
          <p className="max-w-sm text-sm leading-6">
            Venta de entradas para congresos, workshops, hackathons y encuentros tecnológicos en El Salvador.
          </p>
          <div>
            <DemoBadge />
          </div>
        </section>

        <section aria-labelledby="pie-contacto" className="flex flex-col gap-3 text-sm leading-6">
          <h2 id="pie-contacto" className={tituloClase}>
            Contacto (DEMO)
          </h2>
          <p>
            <span className="block text-texto">Correo</span>
            <a href={`mailto:${contacto.correo}`} className="underline-offset-4 hover:underline">
              {contacto.correo}
            </a>
          </p>
          <p>
            <span className="block text-texto">Teléfono</span>
            {contacto.telefono}
          </p>
          <p>
            <span className="block text-texto">Ubicación</span>
            {contacto.direccion}
          </p>
          <p>
            <span className="block text-texto">Atención</span>
            {contacto.horario}
          </p>
        </section>

        <nav aria-label="Mapa del sitio" className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className={tituloClase}>Eventos</h2>
            {categoryGroups.map((grupo) => (
              <section key={grupo.id} aria-labelledby={`pie-${grupo.id}`}>
                <h3 id={`pie-${grupo.id}`} className="text-sm font-semibold text-texto">
                  {grupo.label}
                </h3>
                <ul className="flex flex-col text-sm">
                  {grupo.items.map((categoria) => (
                    <li key={categoria.slug}>
                      <Link href={categoria.href} className={enlaceClase}>
                        {categoria.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className={tituloClase}>Organizadores</h2>
            <ul className="flex flex-col text-sm">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={enlaceClase}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-borde/40">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs leading-5 md:px-6">
          © 2026 Ticketera C3. Proyecto académico con fines demostrativos. No es un producto ni servicio oficial de C3.
          Los pagos son simulados: no se cobra dinero real ni se piden datos de tarjeta.
        </p>
      </div>
    </footer>
  );
}
