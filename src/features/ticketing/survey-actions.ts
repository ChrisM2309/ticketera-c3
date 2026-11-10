'use server';

import { hashCheckoutToken } from '@/features/checkout/order';
import { validateSurvey } from '@/features/ticketing/survey';
import { createServiceRoleClient } from '@/lib/supabase/server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

export type SurveyActionResult = { ok: true } | { ok: false; message: string };

export async function submitSurveyAction(formData: FormData): Promise<SurveyActionResult> {
  const orderId = formData.get('orderId');
  const token = formData.get('token');
  const ratingValue = formData.get('rating');
  const commentValue = formData.get('comment');
  if (
    typeof orderId !== 'string' || !uuidPattern.test(orderId) ||
    typeof token !== 'string' || !tokenPattern.test(token) ||
    typeof ratingValue !== 'string' || typeof commentValue !== 'string'
  ) return { ok: false, message: 'No pudimos validar la encuesta.' };

  const validated = validateSurvey({ rating: Number(ratingValue), comment: commentValue });
  if (!validated.valid) return { ok: false, message: validated.error };

  const client = createServiceRoleClient();
  if (!client) return { ok: false, message: 'La encuesta DEMO no está disponible todavía.' };
  const { data, error } = await client.rpc('submit_survey', {
    p_order_id: orderId,
    p_token_hash: hashCheckoutToken(token),
    p_rating: validated.data.rating,
    p_comment: validated.data.comment,
  });
  if (error) return { ok: false, message: 'No pudimos guardar tu respuesta. Intenta nuevamente.' };

  if (data === 'ok') return { ok: true };
  if (data === 'already_answered') return { ok: false, message: 'Esta orden ya respondió la encuesta.' };
  if (data === 'too_early') return { ok: false, message: 'La encuesta se abre cuando empieza el evento.' };
  return { ok: false, message: 'No pudimos validar la encuesta.' };
}
