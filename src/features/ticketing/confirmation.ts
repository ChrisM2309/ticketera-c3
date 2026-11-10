import 'server-only';

import { hashCheckoutToken } from '@/features/checkout/order';
import { buildReceipt, type Receipt } from '@/features/checkout/payment-flow';
import { createServiceRoleClient } from '@/lib/supabase/server';

import { recoverTicketQrs, type RecoveredTicket } from './qr';

export type ConfirmationTicket = RecoveredTicket;

export type OrderConfirmation = {
  orderId: string;
  status: 'pending' | 'confirmed' | 'failed';
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  buyerName: string;
  /** Comprobante del pago de demostración (o del registro gratuito) de la orden. */
  receipt: Receipt;
  event: {
    title: string;
    startsAt: string;
    mode: 'presencial' | 'virtual';
    venue: string | null;
  };
  tickets: ConfirmationTicket[];
};

export type ConfirmationResult =
  | { status: 'ok'; confirmation: OrderConfirmation }
  | { status: 'not_found' }
  | { status: 'unavailable' };

type StoredTicket = {
  id: string;
  qr_token_hash: string;
  ticket_types: { name: string } | null;
};

/**
 * Lee una orden por su id y su token de checkout. Orden inexistente y token incorrecto devuelven
 * el mismo resultado para no revelar qué órdenes existen.
 */
export async function loadOrderConfirmation(orderId: string, checkoutToken: string): Promise<ConfirmationResult> {
  const client = createServiceRoleClient();

  if (!client) {
    return { status: 'unavailable' };
  }

  const orderResult = await client
    .from('orders')
    .select('id, event_id, status, subtotal_cents, fee_cents, total_cents, buyer_name, confirmed_at')
    .eq('id', orderId)
    .eq('public_token_hash', hashCheckoutToken(checkoutToken))
    .maybeSingle();

  if (orderResult.error) {
    return { status: 'unavailable' };
  }

  if (!orderResult.data) {
    return { status: 'not_found' };
  }

  const order = orderResult.data as {
    id: string;
    event_id: string;
    status: OrderConfirmation['status'];
    subtotal_cents: number;
    fee_cents: number;
    total_cents: number;
    buyer_name: string;
    confirmed_at: string | null;
  };

  const eventResult = await client
    .from('events')
    .select('title, starts_at, mode, venue')
    .eq('id', order.event_id)
    .maybeSingle();

  if (eventResult.error || !eventResult.data) {
    return { status: 'unavailable' };
  }

  const event = eventResult.data as {
    title: string;
    starts_at: string;
    mode: OrderConfirmation['event']['mode'];
    venue: string | null;
  };

  const paymentResult = await client
    .from('payments')
    .select('id, status')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentResult.error) {
    return { status: 'unavailable' };
  }

  const payment = paymentResult.data as { id: string; status: string } | null;

  let tickets: ConfirmationTicket[] = [];

  if (order.status === 'confirmed') {
    const ticketsResult = await client
      .from('tickets')
      .select('id, qr_token_hash, ticket_types(name)')
      .eq('order_id', order.id)
      .order('issued_at', { ascending: true })
      .order('id', { ascending: true });

    if (ticketsResult.error) {
      return { status: 'unavailable' };
    }

    tickets = recoverTicketQrs(
      checkoutToken,
      ((ticketsResult.data ?? []) as unknown as StoredTicket[]).map((ticket) => ({
        ticketId: ticket.id,
        qrTokenHash: ticket.qr_token_hash,
        typeName: ticket.ticket_types?.name ?? 'Entrada',
      })),
    );
  }

  return {
    status: 'ok',
    confirmation: {
      orderId: order.id,
      status: order.status,
      subtotalCents: order.subtotal_cents,
      feeCents: order.fee_cents,
      totalCents: order.total_cents,
      buyerName: order.buyer_name,
      receipt: buildReceipt({
        order: {
          id: order.id,
          status: order.status,
          subtotalCents: order.subtotal_cents,
          feeCents: order.fee_cents,
          totalCents: order.total_cents,
          confirmedAt: order.confirmed_at,
        },
        payment,
      }),
      event: {
        title: event.title,
        startsAt: event.starts_at,
        mode: event.mode,
        venue: event.venue,
      },
      tickets,
    },
  };
}
