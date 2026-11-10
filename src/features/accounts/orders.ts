import type { SupabaseClient } from '@supabase/supabase-js';

import { deriveCheckoutToken, getCheckoutTokenSecret } from '@/features/checkout/token';

/**
 * Historial de compras de la cuenta del comprador.
 * La lectura usa la RPC `my_orders()` con el token del propio usuario: la base solo devuelve las órdenes
 * de `auth.uid()`. El enlace a cada confirmación se deriva en el servidor con el mismo HMAC de la Fase 2,
 * así que nunca se guarda ni se repite el token en claro.
 */

export type OrderStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

/** Fila tal como la devuelve `public.my_orders()`. */
export type MyOrdersRow = {
  order_id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  /** Las órdenes anteriores a la Fase 2 no tienen request id y no se pueden enlazar. */
  checkout_request_id: string | null;
  event_id: string;
  event_title: string;
  event_starts_at: string;
};

export type AccountOrder = {
  orderId: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  eventTitle: string;
  eventStartsAt: string;
  /** `/confirmacion/{orderId}/{token}/`, o cadena vacía si la orden no tiene request id. */
  confirmationPath: string;
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  failed: 'Fallida',
  cancelled: 'Cancelada',
};

export function toAccountOrder(row: MyOrdersRow, secret: string): AccountOrder {
  const confirmationPath = row.checkout_request_id
    ? `/confirmacion/${row.order_id}/${deriveCheckoutToken(secret, row.checkout_request_id)}/`
    : '';

  return {
    orderId: row.order_id,
    status: row.status,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    eventTitle: row.event_title,
    eventStartsAt: row.event_starts_at,
    confirmationPath,
  };
}

/**
 * Órdenes de la cuenta con sesión, de la más reciente a la más antigua. Sin `client` exige una sesión de
 * comprador (redirige a /ingresar/ si no la hay); las páginas ya validadas pasan el cliente de su sesión.
 */
export async function listMyOrders(client?: SupabaseClient): Promise<AccountOrder[]> {
  // Import dinámico: require-role depende de `server-only` y de las cookies de Next, que no existen en las pruebas.
  const sessionClient = client ?? (await (await import('@/lib/auth/require-role')).requireRole('buyer', '/mis-boletos/')).client;
  const { data, error } = await sessionClient.rpc('my_orders');

  if (error) {
    throw new Error('No pudimos cargar tus compras.');
  }

  const secret = getCheckoutTokenSecret();

  return ((data ?? []) as MyOrdersRow[]).map((row) => toAccountOrder(row, secret));
}
