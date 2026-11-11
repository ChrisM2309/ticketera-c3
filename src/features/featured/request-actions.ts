'use server';

import { createSubjectPaymentLink } from '@/features/checkout/wompi/create-link';
import { requireRole } from '@/lib/auth/require-role';
import { createServiceRoleClient } from '@/lib/supabase/server';

import { validateFeaturedRequest } from './request';

export type FeaturedPaymentStart = { ok: true; redirectUrl: string } | { ok: false; message: string };

/**
 * Inicia la compra de un destacado: crea la solicitud en espera de pago y devuelve el enlace de Wompi.
 * El destacado no se activa aquí: lo hace el webhook cuando Wompi aprueba el pago, y después lo revisa el administrador.
 */
export async function startFeaturedPaymentAction(formData: FormData): Promise<FeaturedPaymentStart> {
  const account = await requireRole('organizer', '/panel/');

  const input = validateFeaturedRequest(
    { eventId: formData.get('eventId'), startsOn: formData.get('startsOn'), days: formData.get('days') },
    new Date(),
  );
  if (!input.valid) return { ok: false, message: Object.values(input.errors)[0] ?? 'La solicitud no es válida.' };

  const { data, error } = await account.client.rpc('start_paid_featured', {
    p_event_id: input.data.eventId,
    p_starts_on: input.data.startsOn,
    p_days: input.data.days,
  });
  if (error) return { ok: false, message: error.message };

  const row = (Array.isArray(data) ? data[0] : data) as
    | { placement_id: string; total_cents: number; event_title: string }
    | undefined;
  if (!row) return { ok: false, message: 'No pudimos iniciar el pago. Intentá nuevamente.' };

  // Cubierto por completo por el paquete empresas: no hay pago, ya quedó pendiente de revisión.
  if (row.total_cents === 0) return { ok: true, redirectUrl: '/panel/?destacado=solicitado' };

  const link = await createSubjectPaymentLink({
    subject: { kind: 'featured', id: row.placement_id },
    totalCents: row.total_cents,
    productName: `Destacado: ${row.event_title}`,
    redirectPath: '/panel/?pago=destacado',
  });
  if (!link.ok) return { ok: false, message: link.message };

  const service = createServiceRoleClient();
  if (!service) return { ok: false, message: 'No pudimos iniciar el pago. Intentá nuevamente.' };

  const saved = await service
    .from('featured_placements')
    .update({ wompi_link_id: link.linkId, wompi_link_url: link.redirectUrl })
    .eq('id', row.placement_id);
  if (saved.error) return { ok: false, message: 'No pudimos iniciar el pago. Intentá nuevamente.' };

  return { ok: true, redirectUrl: link.redirectUrl };
}
