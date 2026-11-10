export type OutboxChannel = 'email' | 'whatsapp';
export type OutboxTemplate = 'ticket' | 'reminder_24h';

export type OutboxRow = {
  orderId: string;
  channel: OutboxChannel;
  template: OutboxTemplate;
  destinationMasked: string;
  scheduledFor: Date;
};

/** «ana@gmail.com» pasa a «a***@gmail.com»: primera letra, tres asteriscos y el dominio. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');

  if (at < 1) {
    return '***';
  }

  return `${trimmed[0]}***${trimmed.slice(at)}`;
}

/** «+50312345678» pasa a «+503 ****-5678»: solo se conservan los últimos cuatro dígitos. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const lastFour = digits.slice(-4);

  return digits.startsWith('503') && digits.length === 11 ? `+503 ****-${lastFour}` : `****-${lastFour}`;
}

type TicketNotificationInput = {
  orderId: string;
  email: string;
  phone: string | null;
  now: Date;
};

/** Boleto por correo siempre y por WhatsApp solo si el comprador dejó teléfono; sale de inmediato. */
export function buildTicketNotifications({ orderId, email, phone, now }: TicketNotificationInput): OutboxRow[] {
  const rows: OutboxRow[] = [
    { orderId, channel: 'email', template: 'ticket', destinationMasked: maskEmail(email), scheduledFor: now },
  ];

  if (phone) {
    rows.push({ orderId, channel: 'whatsapp', template: 'ticket', destinationMasked: maskPhone(phone), scheduledFor: now });
  }

  return rows;
}

/**
 * Registra las notificaciones simuladas. Un fallo del outbox nunca revierte una compra ya
 * confirmada: se registra el error y se sigue. El cliente se importa al usarlo para que el módulo
 * de enmascarado siga siendo puro y probable sin el entorno del servidor.
 */
export async function enqueueNotifications(rows: OutboxRow[]): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const client = createServiceRoleClient();

    if (!client) {
      console.error('Outbox de notificaciones: el cliente de servidor no está configurado.');
      return;
    }

    const { error } = await client.from('notification_outbox').upsert(
      rows.map((row) => ({
        order_id: row.orderId,
        channel: row.channel,
        template: row.template,
        destination_masked: row.destinationMasked,
        scheduled_for: row.scheduledFor.toISOString(),
      })),
      { onConflict: 'order_id,channel,template', ignoreDuplicates: true },
    );

    if (error) {
      console.error('Outbox de notificaciones: no se pudo registrar.', error.message);
    }
  } catch (error) {
    console.error('Outbox de notificaciones: error inesperado.', error);
  }
}
