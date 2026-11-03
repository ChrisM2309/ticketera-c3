import { DemoBadge } from '@/components/ui/demo-badge';

export function SiteFooter() {
  return (
    <footer data-theme="oscuro" className="bg-fondo text-texto-suave">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-xl">
          <p className="font-titulo text-base font-bold text-texto">Ticketera C3</p>
          <p className="mt-2 text-sm leading-6">
            Proyecto académico con fines demostrativos. No es un producto ni servicio oficial de C3.
            Los pagos son simulados: no se cobra dinero real ni se piden datos de tarjeta.
          </p>
        </div>
        <DemoBadge className="self-start" />
      </div>
    </footer>
  );
}
