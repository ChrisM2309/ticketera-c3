import Link from 'next/link';

import { DemoBadge } from '@/components/ui/demo-badge';
import { accountLinks } from '@/lib/navigation';

/* Datos de contacto de demostración: ficticios, marcados como DEMO (AGENTS.md). */
const correo = 'contacto@ticketera.example';
const telefono = '+503 0000-0000';

const enlace = 'inline-flex min-h-11 items-center underline-offset-4 hover:underline';

export function SiteFooter() {
  return (
    <footer data-theme="oscuro" className="border-t border-borde/40 bg-fondo text-texto-suave">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1fr_auto_auto] md:gap-16 md:px-6">
        <div className="flex flex-col gap-3">
          <p className="font-titulo text-base font-bold text-texto">Ticketera C3</p>
          <DemoBadge className="self-start" />
          <p className="max-w-xs text-sm leading-6">Venta de entradas para eventos tecnológicos en El Salvador.</p>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <p className="font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto">Contacto (DEMO)</p>
          <a href={`mailto:${correo}`} className={enlace}>
            {correo}
          </a>
          <span className="inline-flex min-h-11 items-center">{telefono}</span>
        </div>

        <nav aria-label="Enlaces del pie" className="flex flex-col gap-1 text-sm">
          <p className="font-titulo text-etiqueta font-bold uppercase tracking-etiqueta text-texto">Explorar</p>
          <Link href="/buscar/" className={enlace}>
            Ver todos los eventos
          </Link>
          {accountLinks.map((link) => (
            <Link key={link.href} href={link.href} className={enlace}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="border-t border-borde/40 px-4 py-4 text-center text-xs leading-5 md:px-6">
        © 2026 Ticketera C3 · Proyecto académico con fines demostrativos. Los pagos son simulados.
      </p>
    </footer>
  );
}
