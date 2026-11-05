'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/require-role';

import { adminReviewPath, parseReviewInput } from './review';

const notPendingMessage = 'Solo se revisan eventos pendientes.';
const expiredMessage = 'El evento ya terminó y no puede publicarse.';

/**
 * Aprueba o rechaza un evento pendiente. Solo el administrador llega aquí: requireRole comprueba
 * la sesión y el rol en el servidor, y la función SQL vuelve a comprobarlo con is_admin().
 */
export async function reviewEventAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', adminReviewPath);
  const input = parseReviewInput({
    eventId: formData.get('eventId'),
    decision: formData.get('decision'),
  });

  if (!input.valid) {
    redirect(`${adminReviewPath}?error=revision`);
  }

  const { error } = await account.client.rpc('review_organizer_event', {
    p_event_id: input.eventId,
    p_decision: input.decision,
  });

  if (error) {
    if (error.message === notPendingMessage) {
      redirect(`${adminReviewPath}?error=no-pendiente`);
    }

    if (error.message === expiredMessage) {
      redirect(`${adminReviewPath}?error=vencido`);
    }

    redirect(`${adminReviewPath}?error=revision`);
  }

  // El catálogo se regenera al aprobar; el resto del sitio puede seguir en caché.
  revalidatePath('/', 'layout');

  redirect(`${adminReviewPath}?revision=${input.decision === 'approve' ? 'aprobado' : 'rechazado'}`);
}
