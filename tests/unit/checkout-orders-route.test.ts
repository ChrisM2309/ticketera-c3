import { beforeEach, describe, expect, test, vi } from 'vitest';

const readOptionalSession = vi.hoisted(() => vi.fn());
const createServiceRoleClient = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('../../src/lib/auth/optional-session', () => ({ readOptionalSession }));
vi.mock('../../src/lib/supabase/server', () => ({ createServiceRoleClient }));

import { POST } from '../../src/app/api/checkout/orders/route';

const sessionUserId = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const spoofedUserId = '99999999-9999-4999-8999-999999999999';

const baseBody = {
  eventId: '11111111-1111-4111-8111-111111111111',
  requestId: '33333333-3333-4333-8333-333333333333',
  items: [{ ticketTypeId: '22222222-2222-4222-8222-222222222222', quantity: 2 }],
  buyer: { name: 'Ana Comprador', email: 'ana@example.test' },
};

function orderRequest(extra: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/checkout/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...baseBody, ...extra }),
  });
}

describe('POST /api/checkout/orders: dueño de la orden', () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    readOptionalSession.mockReset();
    createServiceRoleClient.mockReset();
    createServiceRoleClient.mockReturnValue({ rpc });
    rpc.mockResolvedValue({
      data: [{ order_id: 'order-1', subtotal_cents: 2000, fee_cents: 100, total_cents: 2100 }],
      error: null,
    });
  });

  test('con sesión liga la orden al id de la sesión', async () => {
    readOptionalSession.mockResolvedValue({ userId: sessionUserId, email: 'ana@example.test', client: {} });

    const response = await POST(orderRequest());

    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('create_pending_order', expect.objectContaining({ p_buyer_user_id: sessionUserId }));
  });

  test('un buyerUserId en el cuerpo se ignora: manda el id de la sesión', async () => {
    readOptionalSession.mockResolvedValue({ userId: sessionUserId, email: 'ana@example.test', client: {} });

    const response = await POST(orderRequest({ buyerUserId: spoofedUserId, buyer_user_id: spoofedUserId }));

    expect(response.status).toBe(201);
    expect(rpc.mock.calls[0][1].p_buyer_user_id).toBe(sessionUserId);
  });

  test('sin sesión manda null aunque el cuerpo traiga un buyerUserId', async () => {
    readOptionalSession.mockResolvedValue(null);

    const response = await POST(orderRequest({ buyerUserId: spoofedUserId }));

    expect(response.status).toBe(201);
    expect(rpc.mock.calls[0][1].p_buyer_user_id).toBeNull();
  });

  test('asGuest true no liga la orden aunque haya sesión y ni siquiera lee la sesión', async () => {
    readOptionalSession.mockResolvedValue({ userId: sessionUserId, email: 'ana@example.test', client: {} });

    const response = await POST(orderRequest({ asGuest: true, buyerUserId: spoofedUserId }));

    expect(response.status).toBe(201);
    expect(rpc.mock.calls[0][1].p_buyer_user_id).toBeNull();
    expect(readOptionalSession).not.toHaveBeenCalled();
  });

  test('asGuest distinto de true (por ejemplo la cadena «true») no cuenta como invitado', async () => {
    readOptionalSession.mockResolvedValue({ userId: sessionUserId, email: 'ana@example.test', client: {} });

    await POST(orderRequest({ asGuest: 'true' }));

    expect(rpc.mock.calls[0][1].p_buyer_user_id).toBe(sessionUserId);
  });
});
