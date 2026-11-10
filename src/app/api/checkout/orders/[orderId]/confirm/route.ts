import { NextResponse } from 'next/server';

import { hashCheckoutToken } from '@/features/checkout/order';
import { paymentIdempotencyKey, paymentOutcomeFor, parseConfirmRequest } from '@/features/checkout/payment';
import {
  buildReminderNotifications,
  buildTicketNotifications,
  enqueueNotifications,
} from '@/features/ticketing/notifications';
import { createTicketId, deriveTicketQrToken, hashTicketQrToken } from '@/features/ticketing/qr';
import { buildSurveyNotifications } from '@/features/ticketing/survey';
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

export async function POST(request: Request, { params }: RouteContext) {
  const { orderId } = await params;

  if (!uuidPattern.test(orderId)) {
    return orderError('La orden no es válida.', 400);
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return orderError('No pudimos leer la confirmación del pago.', 400);
  }

  const parsed = parseConfirmRequest(input);

  if (!parsed.valid) {
    return orderError('No pudimos procesar la confirmación. Intentá nuevamente.', 400);
  }

  const client = createServiceRoleClient();

  if (!client) {
    return orderError('El checkout DEMO no está configurado todavía. Intentá más tarde.', 503);
  }

  const publicTokenHash = hashCheckoutToken(parsed.data.checkoutToken);

  // La orden y el token se comprueban antes de leer nada más; un token incorrecto
  // recibe el mismo error que una orden inexistente.
  const orderResult = await client
    .from('orders')
    .select('total_cents, buyer_email, buyer_phone, event_id')
    .eq('id', orderId)
    .eq('public_token_hash', publicTokenHash)
    .maybeSingle();

  if (orderResult.error) {
    return orderError('No pudimos confirmar la orden. Intentá nuevamente.', 500);
  }

  if (!orderResult.data) {
    return orderError('La orden no existe o el token no coincide.', 400);
  }

  const outcome = paymentOutcomeFor(orderResult.data.total_cents as number, parsed.data.decision);

  if (!outcome) {
    return orderError('Elegí el resultado del pago de demostración.', 400);
  }

  const itemsResult = await client.from('order_items').select('quantity').eq('order_id', orderId);

  if (itemsResult.error) {
    return orderError('No pudimos confirmar la orden. Intentá nuevamente.', 500);
  }

  const quantity = (itemsResult.data ?? []).reduce((sum, item) => sum + (item.quantity as number), 0);
  // El QR de cada boleto sale del token de checkout y del id del boleto (D-29), así que la
  // página de confirmación lo vuelve a calcular cuando el comprador abre su enlace.
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
    p_payment_outcome: outcome,
    p_idempotency_key: outcome === 'free' ? null : paymentIdempotencyKey(orderId),
    p_tickets: tickets,
  });

  if (error) {
    if (error.code === '22023') {
      return orderError(error.message, 400);
    }

    return orderError('No pudimos confirmar la orden. Intentá nuevamente.', 500);
  }

  const confirmed = (Array.isArray(data) ? data[0] : undefined) as ConfirmedOrder | undefined;

  if (!confirmed) {
    return orderError('No pudimos confirmar la orden. Intentá nuevamente.', 500);
  }

  // El boleto «se envía» solo cuando esta llamada confirmó la orden: un reintento ya procesado y un
  // pago rechazado no generan notificaciones. Un fallo del outbox no revierte la compra.
  if (
    (outcome === 'free' || outcome === 'demo_approved') &&
    confirmed.result_status === 'confirmed' &&
    !confirmed.result_already_processed
  ) {
    const email = orderResult.data.buyer_email as string;
    const phone = (orderResult.data.buyer_phone as string | null) ?? null;
    const now = new Date();
    const rows = buildTicketNotifications({ orderId: confirmed.result_order_id, email, phone, now });

    // El recordatorio de 24 h viaja en la misma llamada que el boleto. Si no se puede leer la
    // fecha del evento solo se omite el recordatorio; la compra y el boleto no se tocan.
    const eventResult = await client
      .from('events')
      .select('starts_at, ends_at')
      .eq('id', orderResult.data.event_id as string)
      .maybeSingle();

    if (eventResult.data?.starts_at) {
      rows.push(
        ...buildReminderNotifications({
          orderId: confirmed.result_order_id,
          email,
          phone,
          eventStartsAt: new Date(eventResult.data.starts_at as string),
          now,
        }),
      );
      rows.push(
        ...buildSurveyNotifications({
          orderId: confirmed.result_order_id,
          email,
          phone,
          eventEndsAt: new Date((eventResult.data.ends_at as string | null) ?? (eventResult.data.starts_at as string)),
        }),
      );
    }

    await enqueueNotifications(rows);
  }

  return NextResponse.json({
    orderId: confirmed.result_order_id,
    status: confirmed.result_status,
    ticketCount: confirmed.result_ticket_count,
    alreadyProcessed: confirmed.result_already_processed,
  });
}
