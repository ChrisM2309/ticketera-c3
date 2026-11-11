import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildReminderNotifications,
  buildTicketNotifications,
  enqueueNotifications,
} from './notifications';
import { buildSurveyNotifications } from './survey';

export type ConfirmedOrderInput = {
  orderId: string;
  eventId: string;
  email: string;
  buyerName: string;
  phone: string | null;
  quantity: number;
  /** Token de checkout en memoria; solo lo usa el correo para armar el enlace de confirmación. */
  checkoutToken: string;
  now: Date;
};

/**
 * Registra en el outbox los envíos de una orden confirmada (boleto, recordatorio y encuesta) y devuelve
 * el correo de boleto para enviarlo después de responder. Lo usan el checkout gratuito y el webhook de Wompi.
 */
export async function scheduleConfirmedOrderNotifications(
  client: SupabaseClient,
  input: ConfirmedOrderInput,
): Promise<void> {
  const rows = buildTicketNotifications({ orderId: input.orderId, email: input.email, phone: input.phone, now: input.now });

  const eventResult = await client.from('events').select('title, starts_at, ends_at').eq('id', input.eventId).maybeSingle();

  if (eventResult.data?.starts_at) {
    const startsAt = new Date(eventResult.data.starts_at as string);
    rows.push(
      ...buildReminderNotifications({
        orderId: input.orderId,
        email: input.email,
        phone: input.phone,
        eventStartsAt: startsAt,
        now: input.now,
      }),
    );
    rows.push(
      ...buildSurveyNotifications({
        orderId: input.orderId,
        email: input.email,
        phone: input.phone,
        eventEndsAt: new Date((eventResult.data.ends_at as string | null) ?? (eventResult.data.starts_at as string)),
      }),
    );
  }

  await enqueueNotifications(rows);
}

/** Lee los datos que necesita el correo de boleto. Devuelve null si el evento ya no se puede leer. */
export async function readTicketEmailEvent(
  client: SupabaseClient,
  eventId: string,
): Promise<{ title: string; startsAt: Date } | null> {
  const result = await client.from('events').select('title, starts_at').eq('id', eventId).maybeSingle();
  if (!result.data?.title || !result.data?.starts_at) return null;

  return { title: result.data.title as string, startsAt: new Date(result.data.starts_at as string) };
}
