import { after, NextResponse } from 'next/server';

import { hashCheckoutToken } from '@/features/checkout/order-token';
import { parseConfirmRequest } from '@/features/checkout/payment';
import { deliverTicketEmail } from '@/features/ticketing/email/deliver-ticket-email';
import {
  readTicketEmailEvent,
  scheduleConfirmedOrderNotifications,
} from '@/features/ticketing/confirmed-order';
import { createTicketId, deriveTicketQrToken, hashTicketQrToken } from '@/features/ticketing/qr';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ orderId: string }> };

type ConfirmedOrder = {
  result_order_id: string;
  result_status: 'confirmed' | 'failed';
  result_ticket_count: number;
  result_already_processed: boolean;
};

function orderError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Confirmación de compras GRATUITAS. Las compras con importe se confirman solo desde el webhook de Wompi
 * (src/app/api/pagos/wompi/webhook/route.ts): aquí no se acepta ninguna decisión de pago del navegador.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { orderId } = await params;

  if (!uuidPattern.test(orderId)) {
    return orderError('La orden no es válida.', 400);
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return orderError('No pudimos leer la confirmación.', 400);
  }

  const parsed = parseConfirmRequest(input);

  if (!parsed.valid) {
    return orderError('No pudimos procesar la confirmación. Intenta nuevamente.', 400);
  }

  const client = createServiceRoleClient();

  if (!client) {
    return orderError('El checkout no está configurado todavía. Intenta más tarde.', 503);
  }

  const publicTokenHash = hashCheckoutToken(parsed.data.checkoutToken);

  const orderResult = await client
    .from('orders')
    .select('total_cents, buyer_name, buyer_email, buyer_phone, event_id')
    .eq('id', orderId)
    .eq('public_token_hash', publicTokenHash)
    .maybeSingle();

  if (orderResult.error) {
    return orderError('No pudimos confirmar la orden. Intenta nuevamente.', 500);
  }

  if (!orderResult.data) {
    return orderError('La orden no existe o el token no coincide.', 400);
  }

  if ((orderResult.data.total_cents as number) !== 0) {
    return orderError('Esta orden requiere pago con Wompi.', 409);
  }

  const itemsResult = await client.from('order_items').select('quantity').eq('order_id', orderId);

  if (itemsResult.error) {
    return orderError('No pudimos confirmar la orden. Intenta nuevamente.', 500);
  }

  const quantity = (itemsResult.data ?? []).reduce((sum, item) => sum + (item.quantity as number), 0);
  const tickets = Array.from({ length: quantity }, () => {
    const ticketId = createTicketId();

    return {
      ticketId,
      qrTokenHash: hashTicketQrToken(deriveTicketQrToken(parsed.data.checkoutToken, ticketId)),
    };
  });

  const { data, error } = await client.rpc('confirm_order', {
    p_order_id: orderId,
    p_public_token_hash: publicTokenHash,
    p_payment_outcome: 'free',
    p_idempotency_key: null,
    p_tickets: tickets,
  });

  if (error) {
    if (error.code === '22023') {
      return orderError(error.message, 400);
    }

    return orderError('No pudimos confirmar la orden. Intenta nuevamente.', 500);
  }

  const confirmed = (Array.isArray(data) ? data[0] : undefined) as ConfirmedOrder | undefined;

  if (!confirmed) {
    return orderError('No pudimos confirmar la orden. Intenta nuevamente.', 500);
  }

  if (confirmed.result_status === 'confirmed' && !confirmed.result_already_processed) {
    const email = orderResult.data.buyer_email as string;
    const buyerName = (orderResult.data.buyer_name as string | null) ?? '';
    const phone = (orderResult.data.buyer_phone as string | null) ?? null;
    const now = new Date();

    await scheduleConfirmedOrderNotifications(client, {
      orderId: confirmed.result_order_id,
      eventId: orderResult.data.event_id as string,
      email,
      buyerName,
      phone,
      quantity,
      checkoutToken: parsed.data.checkoutToken,
      now,
    });

    const event = await readTicketEmailEvent(client, orderResult.data.event_id as string);
    const checkoutToken = parsed.data.checkoutToken;

    if (event) {
      after(() =>
        deliverTicketEmail({
          orderId: confirmed.result_order_id,
          checkoutToken,
          email,
          buyerName,
          eventTitle: event.title,
          eventStartsAt: event.startsAt,
          ticketCount: quantity,
        }),
      );
    }
  }

  return NextResponse.json({
    orderId: confirmed.result_order_id,
    status: confirmed.result_status,
    ticketCount: confirmed.result_ticket_count,
    alreadyProcessed: confirmed.result_already_processed,
  });
}
