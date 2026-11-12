import { formatUsd } from '@/features/catalog/format';

/** Texto corto de la acción que crea la orden e inicia el pago en Wompi. */
export function submitLabel(totalCents: number): string {
  return totalCents === 0
    ? 'Confirmar registro gratuito'
    : `Pagar ${formatUsd(totalCents)}`;
}

/**
 * Aviso del checkout con sesión. Comprar como invitado no liga la orden a la cuenta al pagar, pero la página de
 * confirmación sí la guarda si se abre con la sesión iniciada y el correo coincide con el de la cuenta; el aviso
 * dice exactamente eso para no prometer algo distinto de lo que ocurre.
 */
export function accountNotice(usingAccount: boolean): string {
  return usingAccount
    ? 'Compras con tu cuenta: la orden aparecerá en Mis boletos.'
    : 'Compras como invitado: la orden no se liga a tu cuenta al pagar. Si abres la confirmación con la sesión iniciada y el mismo correo, se guardará en Mis boletos.';
}
