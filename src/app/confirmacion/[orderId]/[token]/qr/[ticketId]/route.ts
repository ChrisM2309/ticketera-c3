import QRCode from 'qrcode';

import { loadOrderConfirmation } from '@/features/ticketing/confirmation';

export const runtime = 'nodejs';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

type RouteContext = { params: Promise<{ orderId: string; token: string; ticketId: string }> };

function notFound() {
  return new Response('No encontrado.', { status: 404, headers: { 'cache-control': 'no-store' } });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { orderId, token, ticketId } = await params;

  if (!uuidPattern.test(orderId) || !uuidPattern.test(ticketId) || !tokenPattern.test(token)) {
    return notFound();
  }

  const result = await loadOrderConfirmation(orderId, token);

  if (result.status !== 'ok') {
    return notFound();
  }

  const ticket = result.confirmation.tickets.find((item) => item.ticketId === ticketId);

  if (!ticket) {
    return notFound();
  }

  const svg = await QRCode.toString(ticket.qrToken, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'content-disposition': `attachment; filename="boleto-${ticketId}.svg"`,
      'cache-control': 'no-store',
    },
  });
}
