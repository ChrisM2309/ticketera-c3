import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrderStatus } from './settle';
import type { PaymentSubject } from './reference';

/**
 * Estado de una compra (orden, destacado o paquete) traducido al vocabulario de `decideSettlement`:
 * `pending` = espera pago; `confirmed` = ya liquidada; `failed` = no se puede liquidar.
 */
export type LoadedSubject = {
  status: OrderStatus;
  totalCents: number;
  /** Solo para órdenes: token cifrado y datos para el correo, cargados por el webhook. */
  raw: Record<string, unknown>;
};

const featuredStatus: Record<string, OrderStatus> = {
  awaiting_payment: 'pending',
  pending: 'confirmed',
  approved: 'confirmed',
  rejected: 'failed',
  payment_failed: 'failed',
  cancelled: 'failed',
};

const packageStatus: Record<string, OrderStatus> = {
  awaiting_payment: 'pending',
  active: 'confirmed',
  payment_failed: 'failed',
  expired: 'failed',
};

export async function loadFeaturedOrPackage(
  client: SupabaseClient,
  subject: Exclude<PaymentSubject, { kind: 'order' }>,
): Promise<LoadedSubject | null> {
  if (subject.kind === 'featured') {
    const { data } = await client
      .from('featured_placements')
      .select('status, total_cents')
      .eq('id', subject.id)
      .maybeSingle();
    if (!data) return null;

    return {
      status: featuredStatus[data.status as string] ?? 'failed',
      totalCents: data.total_cents as number,
      raw: {},
    };
  }

  const { data } = await client
    .from('business_packages')
    .select('status, price_cents')
    .eq('id', subject.id)
    .maybeSingle();
  if (!data) return null;

  return {
    status: packageStatus[data.status as string] ?? 'failed',
    totalCents: data.price_cents as number,
    raw: {},
  };
}

/** Liquidación aprobada de un destacado o un paquete. Idempotente por id de transacción. */
export async function settleFeaturedOrPackage(
  client: SupabaseClient,
  subject: Exclude<PaymentSubject, { kind: 'order' }>,
  transactionId: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const fn = subject.kind === 'featured' ? 'settle_featured_payment' : 'settle_package_payment';
  const { error } = await client.rpc(fn, { p_id: subject.id, p_transaction_id: transactionId });

  if (error) return { ok: false, code: error.code ?? '', message: error.message };
  return { ok: true };
}
