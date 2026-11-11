import { NextResponse } from 'next/server';

import { hashCheckoutToken } from '@/features/checkout/order';
import { expirePendingOrderIfOverdue } from '@/features/checkout/wompi/expiry';
import { createWompiClient, WompiError } from '@/features/checkout/wompi/client';
import { readWompiConfig } from '@/features/checkout/wompi/config';
import { buildPaymentLinkBody } from '@/features/checkout/wompi/payment-link';
import { isPaymentWindowOpen, paymentWindowEndsAt } from '@/features/checkout/wompi/settle';
import { encryptCheckoutToken, readTokenEncryptionKey } from '@/features/checkout/wompi/token-crypto';
import { readTicketEmailEvent } from '@/features/ticketing/confirmed-order';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const checkoutTokenPattern = /^[A-Za-z0-9_-]{43}$/;

type RouteContext = { params: Promise<{ orderId: string }> };

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Crea el enlace de pago de Wompi para una orden pendiente con importe y devuelve su URL.
 * Orden de operaciones: primero se guarda el token cifrado (el webhook lo necesita), después se crea el
 * enlace y, por último, se registra el enlace. Si la creación falla, la orden sigue pendiente.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { orderId } = await params;
  if (!uuidPattern.test(orderId)) return fail('La orden no es válida.', 400);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return fail('No pudimos leer la solicitud de pago.', 400);
  }

  const checkoutToken = typeof (input as { checkoutToken?: unknown })?.checkoutToken === 'string'
    ? (input as { checkoutToken: string }).checkoutToken
    : '';
  if (!checkoutTokenPattern.test(checkoutToken)) return fail('No pudimos procesar el pago. Intentá nuevamente.', 400);

  const config = readWompiConfig();
  const encryptionKey = readTokenEncryptionKey(process.env.CHECKOUT_TOKEN_ENCRYPTION_KEY);
  const client = createServiceRoleClient();
  if (!config || !encryptionKey || !client) {
    return fail('El pago con Wompi no está disponible en este momento.', 503);
  }

  const { data: order, error } = await client
    .from('orders')
    .select('id, event_id, public_token_hash, status, total_cents, created_at, wompi_link_url')
    .eq('id', orderId)
    .maybeSingle();

  if (error) return fail('No pudimos cargar la orden. Intentá nuevamente.', 500);
  if (!order || order.public_token_hash !== hashCheckoutToken(checkoutToken)) {
    return fail('La orden no existe o el token no coincide.', 400);
  }

  if (order.total_cents === 0) return fail('Esta orden es gratuita y no requiere pago.', 409);
  if (order.status !== 'pending') return fail('Esta orden ya no está pendiente de pago.', 409);

  const now = new Date();
  if (!isPaymentWindowOpen(new Date(order.created_at), now)) {
    await expirePendingOrderIfOverdue(client, order, now);
    return fail('La orden venció. Creá una compra nueva.', 409);
  }

  // Un enlace ya creado sigue vigente mientras dura la ventana: se reutiliza para no tener dos pagables.
  if (order.wompi_link_url) return NextResponse.json({ redirectUrl: order.wompi_link_url });

  const event = await readTicketEmailEvent(client, order.event_id as string);
  if (!event) return fail('No pudimos preparar el pago. Intentá nuevamente.', 503);

  const tokenStored = await client
    .from('orders')
    .update({ checkout_token_encrypted: encryptCheckoutToken(checkoutToken, encryptionKey) })
    .eq('id', orderId)
    .eq('status', 'pending');
  if (tokenStored.error) return fail('No pudimos preparar el pago. Intentá nuevamente.', 500);

  const wompi = createWompiClient(config);

  try {
    // El negocio debe estar en modo de prueba. Si no lo está, no se crea ningún enlace.
    const app = await wompi.getAppInfo();
    if (app.productive) {
      console.error('Wompi: el negocio está en modo productivo; se bloquea la creación de enlaces.');
      return fail('El pago con Wompi no está disponible en este momento.', 503);
    }

    const link = await wompi.createPaymentLink(
      buildPaymentLinkBody({
        orderId,
        totalCents: order.total_cents as number,
        productName: `Entradas: ${event.title}`,
        startsAt: now,
        endsAt: paymentWindowEndsAt(new Date(order.created_at)),
        redirectUrl: new URL(`/pago/resultado/?orden=${orderId}`, siteConfig.siteUrl).toString(),
        webhookUrl: new URL('/api/pagos/wompi/webhook/', siteConfig.siteUrl).toString(),
      }),
    );

    const linkStored = await client
      .from('orders')
      .update({ wompi_link_id: link.linkId, wompi_link_url: link.url })
      .eq('id', orderId)
      .eq('status', 'pending');
    if (linkStored.error) return fail('No pudimos preparar el pago. Intentá nuevamente.', 500);

    return NextResponse.json({ redirectUrl: link.url });
  } catch (cause) {
    // Solo se registra el código del error, nunca la respuesta de Wompi ni credenciales.
    console.error('Wompi: no se creó el enlace de pago.', cause instanceof WompiError ? cause.code : 'desconocido');
    return fail('No pudimos crear el enlace de pago. Intentá nuevamente.', 502);
  }
}
