import { createServiceRoleClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';

import { readBrevoConfig, sendBrevoEmail } from './brevo';
import { buildTicketEmail } from './ticket-email';

export type TicketDeliveryInput = {
  orderId: string;
  /** Token de la compra en memoria: solo existe durante la confirmación y nunca se guarda en claro. */
  checkoutToken: string;
  email: string;
  buyerName: string;
  /** Null si no se pudo leer el evento: el correo no sale con datos inventados. */
  eventTitle: string | null;
  eventStartsAt: Date | null;
  ticketCount: number;
};

const SAFE_ERROR_LIMIT = 200;

function confirmationUrlFor(orderId: string, checkoutToken: string): string {
  return new URL(`/confirmacion/${orderId}/${checkoutToken}/`, siteConfig.siteUrl).toString();
}

/**
 * Envía el correo de boleto y registra el resultado en el outbox. Solo actualiza la fila mientras
 * siga en `pending`, así que un segundo intento no vuelve a enviar. Nunca lanza: se ejecuta con
 * `after()` y un fallo no debe afectar a la compra, que ya está confirmada.
 */
export async function deliverTicketEmail(input: TicketDeliveryInput): Promise<void> {
  try {
    const client = createServiceRoleClient();
    if (!client) {
      console.error('Correo de boleto: el cliente de servidor no está configurado.');
      return;
    }

    const record = (values: Record<string, unknown>) =>
      client
        .from('notification_outbox')
        .update({ ...values, attempts: 1 })
        .eq('order_id', input.orderId)
        .eq('channel', 'email')
        .eq('template', 'ticket')
        .eq('status', 'pending');

    if (!input.eventTitle || !input.eventStartsAt) {
      const { error } = await record({ status: 'failed', last_error: 'datos del evento no disponibles' });
      if (error) console.error('Correo de boleto: no se pudo registrar el fallo.', error.message);
      return;
    }

    const config = readBrevoConfig();
    if (!config) {
      const { error } = await record({ status: 'failed', last_error: 'proveedor no configurado' });
      if (error) console.error('Correo de boleto: no se pudo registrar el fallo.', error.message);
      return;
    }

    const email = buildTicketEmail({
      buyerName: input.buyerName,
      eventTitle: input.eventTitle,
      eventStartsAt: input.eventStartsAt,
      ticketCount: input.ticketCount,
      confirmationUrl: confirmationUrlFor(input.orderId, input.checkoutToken),
    });

    const result = await sendBrevoEmail(config, {
      to: { email: input.email, name: input.buyerName || undefined },
      subject: email.subject,
      html: email.html,
      text: email.text,
      tag: 'compra-confirmada',
    });

    if (result.ok) {
      const { error } = await record({
        status: 'sent',
        provider_message_id: result.messageId.slice(0, SAFE_ERROR_LIMIT) || null,
        sent_at: new Date().toISOString(),
        last_error: null,
      });
      if (error) console.error('Correo de boleto: enviado, pero no se pudo registrar.', error.message);
      return;
    }

    const { error } = await record({ status: 'failed', last_error: result.reason.slice(0, SAFE_ERROR_LIMIT) });
    if (error) console.error('Correo de boleto: no se pudo registrar el fallo.', error.message);
    console.error(`Correo de boleto no enviado: ${result.reason}.`);
  } catch (error) {
    // Sin datos del comprador en el registro: solo el tipo de error.
    console.error('Correo de boleto: error inesperado.', error instanceof Error ? error.name : 'desconocido');
  }
}
