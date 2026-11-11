'use server';

import { revalidatePath } from 'next/cache';

import { createSubjectPaymentLink } from '@/features/checkout/wompi/create-link';
import { requireRole } from '@/lib/auth/require-role';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type PackagePaymentStart = { ok: true; redirectUrl: string } | { ok: false; message: string };

/**
 * Inicia la compra del paquete anual: crea el paquete en espera de pago y devuelve el enlace de Wompi.
 * El paquete se activa cuando el webhook recibe la aprobación de Wompi.
 */
export async function startPackagePaymentAction(): Promise<PackagePaymentStart> {
  const account = await requireRole('organizer', '/para-empresas/');
  const organizersResult = await account.client
    .from('organizers')
    .select('id')
    .eq('owner_user_id', account.userId)
    .order('created_at', { ascending: true })
    .limit(1);
  const organizer = organizersResult.data?.[0];

  if (organizersResult.error || !organizer) {
    return { ok: false, message: 'Tu cuenta todavía no está asociada a un organizador.' };
  }

  const { data, error } = await account.client.rpc('start_package_purchase', { p_organizer_id: organizer.id });
  if (error) return { ok: false, message: error.message };

  const row = (Array.isArray(data) ? data[0] : data) as { package_id: string; price_cents: number } | undefined;
  if (!row) return { ok: false, message: 'No pudimos iniciar el pago. Intentá nuevamente.' };

  const link = await createSubjectPaymentLink({
    subject: { kind: 'package', id: row.package_id },
    totalCents: row.price_cents,
    productName: 'Paquete anual para empresas',
    redirectPath: '/panel/paquete/?pago=paquete',
  });
  if (!link.ok) return { ok: false, message: link.message };

  const service = createServiceRoleClient();
  if (!service) return { ok: false, message: 'No pudimos iniciar el pago. Intentá nuevamente.' };

  const saved = await service
    .from('business_packages')
    .update({ wompi_link_id: link.linkId, wompi_link_url: link.redirectUrl })
    .eq('id', row.package_id);
  if (saved.error) return { ok: false, message: 'No pudimos iniciar el pago. Intentá nuevamente.' };

  revalidatePath('/para-empresas/');
  revalidatePath('/panel/paquete/');
  return { ok: true, redirectUrl: link.redirectUrl };
}

export async function requestPackageFollowupAction(formData: FormData): Promise<void> {
  const account = await requireRole('organizer', '/panel/paquete/');
  const packageId = formData.get('packageId');
  const message = formData.get('message');

  if (typeof packageId !== 'string' || typeof message !== 'string') {
    throw new Error('El seguimiento no es válido.');
  }

  const { error } = await account.client.rpc('request_package_followup', {
    p_package_id: packageId,
    p_message: message,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/panel/paquete/');
}

export async function answerPackageFollowupAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', '/admin/destacados/');
  const followupId = formData.get('followupId');
  if (typeof followupId !== 'string') throw new Error('El seguimiento no es válido.');

  const { error } = await account.client.rpc('answer_package_followup', { p_id: followupId });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/destacados/');
}
