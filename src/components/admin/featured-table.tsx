import { formatUsd } from '@/features/catalog/format';

import type { FeaturedRow } from '@/features/featured/admin';
import { cancelFeaturedAction, reviewFeaturedAction } from '@/features/featured/actions';

export function FeaturedTable({ rows }: { rows: FeaturedRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-lg bg-superficie p-6 font-texto text-base text-texto-suave">No hay destacados con estos filtros.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-superficie">
      <table className="w-full min-w-[720px] border-collapse text-left font-texto text-sm">
        <caption className="sr-only">Destacados manuales y pagados</caption>
        <thead className="border-b border-borde text-texto-suave">
          <tr>
            <th className="p-4 font-medium">Evento</th>
            <th className="p-4 font-medium">Origen</th>
            <th className="p-4 font-medium">Estado</th>
            <th className="p-4 font-medium">Vigencia</th>
            <th className="p-4 font-medium">Total</th>
            <th className="p-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="p-4 font-medium text-texto">{row.eventTitle}</th>
              <td className="p-4">{row.source === 'manual' ? 'Manual' : 'Pagado'}</td>
              <td className="p-4">{row.status}</td>
              <td className="p-4">{row.startsOn} – {row.endsOn} ({row.days} días)</td>
              <td className="p-4">{formatUsd(row.totalCents)}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-2">
                  {row.status === 'pending' ? (
                    <form action={reviewFeaturedAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" name="decision" value="approved" className="rounded-pill bg-accion px-3 py-1.5 font-medium text-white">
                        Aprobar {row.eventTitle}
                      </button>
                      <button type="submit" name="decision" value="rejected" className="ml-2 rounded-pill border border-borde px-3 py-1.5 font-medium text-texto">
                        Rechazar {row.eventTitle}
                      </button>
                    </form>
                  ) : null}
                  {row.status === 'approved' ? (
                    <form action={cancelFeaturedAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="rounded-pill border border-borde px-3 py-1.5 font-medium text-texto">
                        Cancelar {row.eventTitle}
                      </button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
