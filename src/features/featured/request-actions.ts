'use server';

import { revalidatePath } from 'next/cache';

import type { PaymentDecision } from '@/features/checkout/payment';
import { requireRole } from '@/lib/auth/require-role';

import { validateFeaturedRequest } from './request';

export type FeaturedRequestActionResult = { ok: boolean; message?: string };

export async function requestFeaturedAction(formData: FormData): Promise<FeaturedRequestActionResult> {
  const account = await requireRole('organizer', '/panel/');
  const decision = formData.get('decision');
  if (decision !== 'approved' && decision !== 'rejected') {
    return { ok: false, message: 'Elegí el resultado del pago simulado.' };
  }

  const input = validateFeaturedRequest(
    { eventId: formData.get('eventId'), startsOn: formData.get('startsOn'), days: formData.get('days') },
    new Date(),
  );
  if (!input.valid) return { ok: false, message: Object.values(input.errors)[0] ?? 'La solicitud no es válida.' };

  const { error } = await account.client.rpc('request_paid_featured', {
    p_event_id: input.data.eventId,
    p_starts_on: input.data.startsOn,
    p_days: input.data.days,
    p_decision: decision as PaymentDecision,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath('/panel/');
  revalidatePath('/panel/destacar/[eventId]', 'page');
  return { ok: true };
}
