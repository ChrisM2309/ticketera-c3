import { formatUsd } from '@/features/catalog/format';
import type { CartTotals } from '@/features/checkout/cart';

type CartSummaryProps = Readonly<{
  totals: CartTotals;
  commissionPercent: number;
  totalLabel?: string;
  note?: string;
}>;

export function CartSummary({
  totals,
  commissionPercent,
  totalLabel = 'Total provisional',
  note = 'El precio y los cupos se verifican nuevamente antes de confirmar la orden.',
}: CartSummaryProps) {
  return (
    <section aria-labelledby="resumen-carrito" className="flex flex-col gap-4 rounded-lg bg-superficie p-5 shadow-md">
      <h2 id="resumen-carrito" className="font-titulo text-xl font-bold">
        Resumen
      </h2>
      <dl className="flex flex-col gap-3 font-texto text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-suave">Subtotal</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(totals.subtotalCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-suave">Comisión DEMO ({commissionPercent} % · supuesto)</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(totals.commissionCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-borde pt-3 text-base">
          <dt className="font-titulo font-bold">{totalLabel}</dt>
          <dd className="font-titulo font-bold tabular-nums">{formatUsd(totals.totalCents)}</dd>
        </div>
      </dl>
      <p className="font-texto text-xs leading-5 text-texto-suave">
        {note}
      </p>
    </section>
  );
}
