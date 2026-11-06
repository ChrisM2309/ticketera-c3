'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/require-role';

import { adminReviewPath } from './review';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Marca o quita un evento de los destacados de la portada. Solo el administrador (D-35). */
export async function setFeaturedAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', adminReviewPath);
  const eventId = formData.get('eventId');
  const featured = formData.get('featured') === 'true';

  if (typeof eventId !== 'string' || !uuidPattern.test(eventId)) {
    redirect(`${adminReviewPath}?destacados=error`);
  }

  const { error } = await account.client.rpc('admin_set_featured', {
    p_event_id: eventId,
    p_featured: featured,
  });

  if (error) {
    redirect(`${adminReviewPath}?destacados=${error.message.includes('cuatro') ? 'limite' : 'error'}`);
  }

  revalidatePath('/', 'layout');
  redirect(`${adminReviewPath}?destacados=ok`);
}
