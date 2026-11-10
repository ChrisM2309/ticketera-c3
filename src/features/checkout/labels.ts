import { formatUsd } from '@/features/catalog/format';

/**
 * Texto del botón principal del checkout. El monto va dentro del botón para que el comprador
 * sepa cuánto «paga» (de forma simulada) antes de pulsarlo; sin monto, la compra es un registro gratuito.
 */
export function submitLabel(totalCents: number): string {
  return totalCents === 0
    ? 'Confirmar registro gratuito'
    : `Pagar ${formatUsd(totalCents)} · pago de demostración`;
}
