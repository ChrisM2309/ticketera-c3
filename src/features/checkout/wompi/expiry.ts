import type { SupabaseClient } from '@supabase/supabase-js';

import { isPaymentWindowOpen } from './settle';

/**
 * Caduca una orden pendiente cuya ventana de pago (30 min) ya cerró. Sin reserva de inventario, basta con
 * marcarla `cancelled`. Solo actúa si sigue `pending`, así que nunca toca una orden ya confirmada.
 */
export async function expirePendingOrderIfOverdue(
  client: SupabaseClient,
  order: { id: string; status: string; created_at: string },
  now: Date,
): Promise<boolean> {
  const createdAt = new Date(order.created_at);
  if (order.status !== 'pending' || isPaymentWindowOpen(createdAt, now)) return false;

  const { data, error } = await client
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('Caducidad de orden: no se pudo marcar como cancelada.', error.message);
    return false;
  }

  return (data ?? []).length > 0;
}
