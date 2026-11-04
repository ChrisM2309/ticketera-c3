import { NextResponse } from 'next/server';

import {
  createCheckoutToken,
  getServerDemoCommissionPercent,
  hashCheckoutToken,
  parseOrderRequest,
} from '@/features/checkout/order';
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

  const client = createServiceRoleClient();

  if (!client) {
    return orderError('El checkout DEMO no está configurado todavía. Intentá más tarde.', 503);
  }

  const checkoutToken = createCheckoutToken();
  const { data, error } = await client.rpc('create_pending_order', {
    p_event_id: parsed.data.eventId,
    p_items: parsed.data.items,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_email: parsed.data.buyerEmail,
    p_public_token_hash: hashCheckoutToken(checkoutToken),
    p_fee_percent: getServerDemoCommissionPercent(),
  });

  if (error) {
    if (error.code === '22023') {
      return orderError(error.message, 400);
    }

    return orderError('No pudimos crear la orden. Intentá nuevamente.', 500);
  }

  const created = Array.isArray(data) ? (data[0] as CreatedOrder | undefined) : undefined;

  if (!created) {
    return orderError('No pudimos crear la orden. Intentá nuevamente.', 500);
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
