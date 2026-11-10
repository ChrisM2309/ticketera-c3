import 'server-only';

import { hashCheckoutToken } from '@/features/checkout/order';
import { readOptionalSession } from '@/lib/auth/optional-session';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Estado de la cuenta frente a una orden de la página de confirmación.
 * `saved` es verdadero cuando la compra queda (o ya estaba) guardada en la cuenta con sesión.
 */
export type OrderAccountState = { signedIn: boolean; saved: boolean };

/**
 * Con sesión, reclama la compra de invitado para la cuenta: `claim_order` solo asigna el dueño si la orden no
 * tiene uno, el token de la URL coincide y el correo de la orden es el de la cuenta. El reclamo corre con el
 * token del propio usuario (nunca con service_role), así `auth.uid()` es quien tiene la sesión.
 * Es de mejor esfuerzo: un fallo deja la confirmación visible, solo sin el aviso de cuenta.
 */
export async function resolveOrderAccount(orderId: string, checkoutToken: string): Promise<OrderAccountState> {
  const session = await readOptionalSession();

  if (!session) {
    return { signedIn: false, saved: false };
  }

  try {
    const tokenHash = hashCheckoutToken(checkoutToken);
    const service = createServiceRoleClient();

    // La lectura del dueño usa el id y el hash del token: sin token correcto no revela nada.
    const owner = service
      ? await service
          .from('orders')
          .select('buyer_user_id')
          .eq('id', orderId)
          .eq('public_token_hash', tokenHash)
          .maybeSingle()
      : null;

    if (owner?.data?.buyer_user_id === session.userId) {
      return { signedIn: true, saved: true };
    }

    if (owner?.data && owner.data.buyer_user_id !== null) {
      // La orden es de otra cuenta.
      return { signedIn: true, saved: false };
    }

    const { data, error } = await session.client.rpc('claim_order', {
      p_order_id: orderId,
      p_checkout_token_hash: tokenHash,
    });

    return { signedIn: true, saved: !error && data === true };
  } catch {
    return { signedIn: true, saved: false };
  }
}
