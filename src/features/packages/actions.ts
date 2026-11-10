'use server';

import { revalidatePath } from 'next/cache';

import type { PaymentDecision } from '@/features/checkout/payment';
import { requireRole } from '@/lib/auth/require-role';

export type PackageActionResult = { ok: boolean; message?: string; analyticsEvent?: 'package_purchased' };

export async function purchaseBusinessPackageAction(decision: PaymentDecision): Promise<PackageActionResult> {
  if (decision !== 'approved' && decision !== 'rejected') {
    return { ok: false, message: 'Elegí el resultado del pago simulado.' };
  }

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

  const { error } = await account.client.rpc('purchase_business_package', {
    p_organizer_id: organizer.id,
    p_decision: decision,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/para-empresas/');
  revalidatePath('/panel/paquete/');
  revalidatePath('/panel/');
  return { ok: true, analyticsEvent: decision === 'approved' ? 'package_purchased' : undefined };
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
