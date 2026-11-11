import { NextResponse } from 'next/server';

import {
  getServerDemoCommissionPercent,
  parseOrderRequest,
} from '@/features/checkout/order';
import { hashCheckoutToken } from '@/features/checkout/order-token';
import { deriveCheckoutToken, getCheckoutTokenSecret } from '@/features/checkout/token';
import { readOptionalSession } from '@/lib/auth/optional-session';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type CreatedOrder = {
  order_id: string;
  subtotal_cents: number;
  fee_cents: number;
  total_cents: number;
};

function orderError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** `asGuest: true` es la elección explícita de comprar como invitado aunque haya sesión. */
function isGuestRequest(input: unknown): boolean {
  return typeof input === 'object' && input !== null && (input as { asGuest?: unknown }).asGuest === true;
}

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return orderError('No pudimos leer los datos de la orden.', 400);
  }

  const parsed = parseOrderRequest(input);

  if (!parsed.valid) {
    return NextResponse.json({ fieldErrors: parsed.fieldErrors }, { status: 400 });
  }

  let checkoutToken: string;

  try {
    checkoutToken = deriveCheckoutToken(getCheckoutTokenSecret(), parsed.data.requestId);
  } catch (error) {
    console.error('Checkout DEMO sin secreto de token configurado.', error);
    return orderError('El checkout DEMO no está configurado todavía. Intenta más tarde.', 503);
  }

  const client = createServiceRoleClient();

  if (!client) {
    return orderError('El checkout DEMO no está configurado todavía. Intenta más tarde.', 503);
  }

  // El dueño de la orden sale solo de la sesión de las cookies. Un `buyerUserId` en el cuerpo se ignora; el
  // único dato del cuerpo es `asGuest`, que solo sirve para NO ligar la compra a la cuenta.
  const session = isGuestRequest(input) ? null : await readOptionalSession();

  // Respaldo de la caducidad: cierra compras vencidas (30 min) aunque pg_cron no esté habilitado.
  const expired = await client.rpc('expire_pending_purchases');
  if (expired.error) console.error('Caducidad de compras pendientes: no se ejecutó.', expired.error.message);

  const { data, error } = await client.rpc('create_pending_order', {
    p_event_id: parsed.data.eventId,
    p_items: parsed.data.items,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_email: parsed.data.buyerEmail,
    p_public_token_hash: hashCheckoutToken(checkoutToken),
    p_fee_percent: getServerDemoCommissionPercent(),
    p_request_id: parsed.data.requestId,
    p_buyer_phone: parsed.data.buyerPhone,
    p_buyer_user_id: session?.userId ?? null,
  });

  if (error) {
    if (error.code === '22023') {
      return orderError(error.message, 400);
    }

    return orderError('No pudimos crear la orden. Intenta nuevamente.', 500);
  }

  const created = Array.isArray(data) ? (data[0] as CreatedOrder | undefined) : undefined;

  if (!created) {
    return orderError('No pudimos crear la orden. Intenta nuevamente.', 500);
  }

  return NextResponse.json(
    {
      orderId: created.order_id,
      subtotalCents: created.subtotal_cents,
      feeCents: created.fee_cents,
      totalCents: created.total_cents,
      checkoutToken,
    },
    { status: 201 },
  );
}
