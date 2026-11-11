import { formatUsd } from '@/features/catalog/format';
import type { CartTotals } from '@/features/checkout/cart';
import { cn } from '@/lib/utils';

type CartSummaryProps = Readonly<{
  totals: CartTotals;
  commissionPercent: number;
  totalLabel?: string;
  note?: string;
  /** Versión más baja para el checkout (dentro del formulario, encima del botón de pago); la nota va aparte, bajo el botón. */
  compact?: boolean;
}>;

export function CartSummary({
  totals,
  commissionPercent,
  totalLabel = 'Total provisional',
  note = 'El precio y los cupos se verifican nuevamente antes de confirmar la orden.',
  compact = false,
}: CartSummaryProps) {
  return (
    <section
      aria-labelledby="resumen-carrito"
      className={cn(
        'flex flex-col rounded-lg',
        compact ? 'gap-2 bg-superficie-sutil p-3 md:p-4' : 'gap-4 bg-superficie p-5 shadow-sm',
      )}
    >
      <h2 id="resumen-carrito" className={cn('font-titulo font-bold', compact ? 'text-base' : 'text-xl')}>
        Resumen
      </h2>
      <dl className={cn('flex flex-col font-texto text-sm', compact ? 'gap-1.5' : 'gap-3')}>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-suave">Subtotal</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(totals.subtotalCents)}</dd>
        </div>
        {totals.commissionCents > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-texto-suave">Comisión de la orden anterior ({commissionPercent} %)</dt>
            <dd className="font-semibold tabular-nums">{formatUsd(totals.commissionCents)}</dd>
          </div>
        ) : null}
        <div className={cn('flex items-center justify-between gap-4 border-t border-borde text-base', compact ? 'pt-2' : 'pt-3')}>
          <dt className="font-titulo font-bold">{totalLabel}</dt>
          <dd className="font-titulo font-bold tabular-nums">{formatUsd(totals.totalCents)}</dd>
        </div>
      </dl>
      {compact ? null : (
        <p className="font-texto text-xs leading-5 text-texto-suave">
          {note}
        </p>
      )}
    </section>
  );
}
