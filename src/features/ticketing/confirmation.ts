import 'server-only';

import { hashCheckoutToken } from '@/features/checkout/order-token';
import { eventPath } from '@/features/catalog/paths';
import { buildReceipt, type Receipt } from '@/features/checkout/payment-flow';
import { siteConfig } from '@/lib/site-config';
import { createServiceRoleClient } from '@/lib/supabase/server';

import { recoverTicketQrs, type RecoveredTicket } from './qr';

export type ConfirmationTicket = RecoveredTicket;

export type OrderConfirmation = {
  orderId: string;
  publicCode: string;
  status: 'pending' | 'confirmed' | 'failed';
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  buyerName: string;
  /** Comprobante del pago de demostración (o del registro gratuito) de la orden. */
  receipt: Receipt;
  event: {
    id: string;
    title: string;
    startsAt: string;
    mode: 'presencial' | 'virtual';
    venue: string | null;
    /** URL pública de la ficha del evento (la que se comparte; nunca la de la orden). Nula si no se puede resolver. */
    url: string | null;
  };
  tickets: ConfirmationTicket[];
  /** Envíos simulados del boleto, con el destino ya enmascarado. */
  deliveries: ConfirmationDelivery[];
};

export type ConfirmationDelivery = { channel: 'email' | 'whatsapp'; destinationMasked: string };

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
    .select('id, public_code, event_id, status, subtotal_cents, fee_cents, total_cents, buyer_name, confirmed_at')
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
    public_code: string;
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
    .select(
      `title, slug, starts_at, mode, venue,
       event_type:categories!events_event_type_fk(slug),
       topic:categories!events_topic_fk(slug)`,
    )
    .eq('id', order.event_id)
    .maybeSingle();

  if (eventResult.error || !eventResult.data) {
    return { status: 'unavailable' };
  }

  const event = eventResult.data as unknown as {
    title: string;
    slug: string;
    starts_at: string;
    mode: OrderConfirmation['event']['mode'];
    venue: string | null;
    event_type: { slug: string } | null;
    topic: { slug: string } | null;
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

  // El outbox se lee solo después de validar el token del enlace (la orden se buscó por su hash).
  // Es información secundaria: si falla, la página muestra los boletos sin la lista de envíos.
  let deliveries: ConfirmationDelivery[] = [];

  if (order.status === 'confirmed') {
    const outboxResult = await client
      .from('notification_outbox')
      .select('channel, destination_masked')
      .eq('order_id', order.id)
      .eq('template', 'ticket')
      .in('status', ['simulated', 'sent'])
      .order('channel', { ascending: true });

    if (!outboxResult.error) {
      deliveries = ((outboxResult.data ?? []) as { channel: ConfirmationDelivery['channel']; destination_masked: string }[]).map(
        (row) => ({ channel: row.channel, destinationMasked: row.destination_masked }),
      );
    }
  }

  return {
    status: 'ok',
    confirmation: {
      orderId: order.id,
      publicCode: order.public_code,
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
        id: order.event_id,
        title: event.title,
        startsAt: event.starts_at,
        mode: event.mode,
        venue: event.venue,
        url: event.event_type
          ? new URL(
              eventPath({ slug: event.slug, eventTypeSlug: event.event_type.slug, topicSlug: event.topic?.slug ?? null }),
              siteConfig.siteUrl,
            ).toString()
          : null,
      },
      tickets,
      deliveries,
    },
  };
}
