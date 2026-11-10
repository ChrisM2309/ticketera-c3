import { beforeEach, describe, expect, test, vi } from 'vitest';

const readOptionalSession = vi.hoisted(() => vi.fn());
const createServiceRoleClient = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));
vi.mock('../../src/lib/auth/optional-session', () => ({ readOptionalSession }));
vi.mock('../../src/lib/supabase/server', () => ({ createServiceRoleClient }));

import { resolveOrderAccount } from '../../src/features/ticketing/claim';

const orderId = '3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b';
const token = 'A'.repeat(43);
const userId = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

/** Cliente de servicio que responde la lectura del dueño de la orden. */
function ownerLookup(buyerUserId: string | null | undefined) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: buyerUserId === undefined ? null : { buyer_user_id: buyerUserId } });
  const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);

  return { from: vi.fn().mockReturnValue(chain) };
}

describe('cuenta frente a la orden de la confirmación', () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
    readOptionalSession.mockReset();
    createServiceRoleClient.mockReset();
    readOptionalSession.mockResolvedValue({ userId, email: 'comprador@example.test', client: { rpc } });
  });

  test('sin sesión no reclama nada', async () => {
    readOptionalSession.mockResolvedValue(null);

    await expect(resolveOrderAccount(orderId, token)).resolves.toEqual({ signedIn: false, saved: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  test('una compra hecha como invitado se guarda al abrir la confirmación con sesión y el mismo correo', async () => {
    // Decisión: «Comprar como invitado» no liga la orden al pagar, pero la confirmación sí la reclama si el
    // correo coincide; el aviso del checkout (accountNotice) lo dice con esas palabras.
    createServiceRoleClient.mockReturnValue(ownerLookup(null));
    rpc.mockResolvedValue({ data: true, error: null });

    await expect(resolveOrderAccount(orderId, token)).resolves.toEqual({ signedIn: true, saved: true });
    expect(rpc).toHaveBeenCalledWith('claim_order', {
      p_order_id: orderId,
      p_checkout_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  test('con otro correo el reclamo no guarda la compra', async () => {
    createServiceRoleClient.mockReturnValue(ownerLookup(null));
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(resolveOrderAccount(orderId, token)).resolves.toEqual({ signedIn: true, saved: false });
  });

  test('una orden ya ligada a la misma cuenta se muestra guardada sin reclamar de nuevo', async () => {
    createServiceRoleClient.mockReturnValue(ownerLookup(userId));

    await expect(resolveOrderAccount(orderId, token)).resolves.toEqual({ signedIn: true, saved: true });
    expect(rpc).not.toHaveBeenCalled();
  });

  test('una orden de otra cuenta no se reclama', async () => {
    createServiceRoleClient.mockReturnValue(ownerLookup('99999999-4e5f-4a6b-8c7d-9e0f1a2b3c4d'));

    await expect(resolveOrderAccount(orderId, token)).resolves.toEqual({ signedIn: true, saved: false });
    expect(rpc).not.toHaveBeenCalled();
  });
});
