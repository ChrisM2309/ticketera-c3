import { after, NextResponse } from 'next/server';

import { hashCheckoutToken } from '@/features/checkout/order';
import { createWompiClient, WompiError } from '@/features/checkout/wompi/client';
import { readWompiConfig } from '@/features/checkout/wompi/config';
import { verifyWompiSignature } from '@/features/checkout/wompi/signature';
import { decideSettlement, type OrderStatus, type WebhookFacts } from '@/features/checkout/wompi/settle';
import { decryptCheckoutToken, readTokenEncryptionKey } from '@/features/checkout/wompi/token-crypto';
import { deliverTicketEmail } from '@/features/ticketing/email/deliver-ticket-email';
import { readTicketEmailEvent, scheduleConfirmedOrderNotifications } from '@/features/ticketing/confirmed-order';
import { createTicketId, deriveTicketQrToken, hashTicketQrToken } from '@/features/ticketing/qr';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Campos del cuerpo del webhook (docs.wompi.sv/webhook/definicion-webhook). Sin datos del comprador. */
function parseWebhook(payload: unknown): WebhookFacts | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const body = payload as Record<string, unknown>;
  const paymentLink = (body.EnlacePago ?? {}) as Record<string, unknown>;

  const transactionId = body.IdTransaccion;
  const resultCode = body.ResultadoTransaccion;
  const reference = paymentLink.IdentificadorEnlaceComercio;

  if ((typeof transactionId !== 'string' && typeof transactionId !== 'number') || String(transactionId).length === 0) {
    return null;
  }
  if (typeof resultCode !== 'string' || typeof reference !== 'string') return null;

  return {
    transactionId: String(transactionId).slice(0, 100),
    reference,
    resultCode: resultCode.slice(0, 100),
    amount: body.Monto,
    productive: body.EsProductiva,
  };
}

/**
 * Webhook de Wompi. Ninguna confirmación depende solo del cuerpo: la firma se valida con el cuerpo crudo y
 * la transacción se vuelve a consultar en la API antes de decidir. Responde 401 si la firma no cuadra y 5xx
 * solo cuando conviene que Wompi reintente.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const config = readWompiConfig();
  if (!config) return NextResponse.json({ error: 'No configurado.' }, { status: 503 });

  if (!verifyWompiSignature(rawBody, request.headers.get('wompi_hash'), config.apiSecret)) {
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Cuerpo no válido.' }, { status: 400 });
  }

  const facts = parseWebhook(payload);
  if (!facts) return NextResponse.json({ error: 'Cuerpo no válido.' }, { status: 400 });

  const client = createServiceRoleClient();
  const encryptionKey = readTokenEncryptionKey(process.env.CHECKOUT_TOKEN_ENCRYPTION_KEY);
  if (!client || !encryptionKey) return NextResponse.json({ error: 'No configurado.' }, { status: 503 });

  if (!uuidPattern.test(facts.reference)) {
    return NextResponse.json({ status: 'ignored' });
  }

  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, event_id, status, total_cents, buyer_name, buyer_email, buyer_phone, checkout_token_encrypted')
    .eq('id', facts.reference)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: 'Reintentar.' }, { status: 500 });
  if (!order) return NextResponse.json({ status: 'ignored' });

  // Registro de auditoría: deduplica por transacción y resultado. No decide nada por sí solo.
  const audit = await client.from('payment_webhook_events').upsert(
    {
      provider: 'wompi',
      transaction_id: facts.transactionId,
      result_code: facts.resultCode,
      order_id: order.id,
    },
    { onConflict: 'provider,transaction_id,result_code', ignoreDuplicates: true },
  );
  if (audit.error) console.error('Webhook de Wompi: no se pudo registrar el evento.', audit.error.message);

  const wompi = createWompiClient(config);
  let app: { productive: boolean };
  let transaction: { approved: boolean; amount: unknown };
  try {
    app = await wompi.getAppInfo();
    transaction = await wompi.getTransaction(facts.transactionId);
  } catch (cause) {
    // Sin consulta no hay verdad que comparar: Wompi reintenta el webhook más tarde.
    console.error('Webhook de Wompi: consulta a la API fallida.', cause instanceof WompiError ? cause.code : 'desconocido');
    return NextResponse.json({ error: 'Reintentar.' }, { status: 502 });
  }

  const decision = decideSettlement({
    orderId: order.id as string,
    orderStatus: order.status as OrderStatus,
    totalCents: order.total_cents as number,
    webhook: facts,
    verified: { approved: transaction.approved, amount: transaction.amount, productive: app.productive },
  });

  if (decision.action === 'ignore') return NextResponse.json({ status: 'ignored' });

  if (decision.action === 'reject') {
    console.error(`Webhook de Wompi rechazado: ${decision.reason}`);
    return NextResponse.json({ status: 'rejected' });
  }

  if (decision.action === 'review') {
    // Pago aprobado sin orden pendiente: no se emiten boletos automáticamente. Queda para revisión manual.
    console.error(`Webhook de Wompi para revisión manual: ${decision.reason} (orden ${order.id}, transacción ${facts.transactionId}).`);
    return NextResponse.json({ status: 'review' });
  }

  // decision.action === 'approve'
  if (!order.checkout_token_encrypted) {
    console.error('Webhook de Wompi: la orden no tiene el token de checkout cifrado.');
    return NextResponse.json({ error: 'Reintentar.' }, { status: 500 });
  }

  const checkoutToken = decryptCheckoutToken(order.checkout_token_encrypted as string, encryptionKey);
  if (!checkoutToken) {
    console.error('Webhook de Wompi: no se pudo descifrar el token de checkout.');
    return NextResponse.json({ error: 'Reintentar.' }, { status: 500 });
  }

  const { data: items, error: itemsError } = await client.from('order_items').select('quantity').eq('order_id', order.id);
  if (itemsError) return NextResponse.json({ error: 'Reintentar.' }, { status: 500 });

  const quantity = (items ?? []).reduce((sum, item) => sum + (item.quantity as number), 0);
  const tickets = Array.from({ length: quantity }, () => {
    const ticketId = createTicketId();
    return { ticketId, qrTokenHash: hashTicketQrToken(deriveTicketQrToken(checkoutToken, ticketId)) };
  });

  const { data, error } = await client.rpc('confirm_order', {
    p_order_id: order.id,
    p_public_token_hash: hashCheckoutToken(checkoutToken),
    p_payment_outcome: 'wompi_approved',
    p_idempotency_key: `wompi:${facts.transactionId}`,
    p_tickets: tickets,
  });

  if (error) {
    // Validación de negocio (cupos, evento no disponible): el pago está aprobado y no hay boletos.
    // Se deja para revisión manual en lugar de reintentar indefinidamente.
    if (error.code === '22023') {
      console.error(`Webhook de Wompi: aprobado sin emitir boletos (${error.message}). Orden ${order.id}.`);
      return NextResponse.json({ status: 'review' });
    }
    return NextResponse.json({ error: 'Reintentar.' }, { status: 500 });
  }

  const confirmed = (Array.isArray(data) ? data[0] : undefined) as
    | { result_status: string; result_already_processed: boolean }
    | undefined;
  if (!confirmed || confirmed.result_status !== 'confirmed') {
    return NextResponse.json({ error: 'Reintentar.' }, { status: 500 });
  }

  if (confirmed.result_already_processed) {
    return NextResponse.json({ status: 'already_processed' });
  }

  const now = new Date();
  const event = await readTicketEmailEvent(client, order.event_id as string);

  await scheduleConfirmedOrderNotifications(client, {
    orderId: order.id as string,
    eventId: order.event_id as string,
    email: order.buyer_email as string,
    buyerName: (order.buyer_name as string | null) ?? '',
    phone: (order.buyer_phone as string | null) ?? null,
    quantity,
    checkoutToken,
    now,
  });

  if (event) {
    after(() =>
      deliverTicketEmail({
        orderId: order.id as string,
        checkoutToken,
        email: order.buyer_email as string,
        buyerName: (order.buyer_name as string | null) ?? '',
        eventTitle: event.title,
        eventStartsAt: event.startsAt,
        ticketCount: quantity,
      }),
    );
  }

  return NextResponse.json({ status: 'confirmed' });
}
