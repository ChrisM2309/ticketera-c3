import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  buildReminderNotifications,
  buildTicketNotifications,
  enqueueNotifications,
  maskEmail,
  maskPhone,
  type OutboxRow,
} from '../../src/features/ticketing/notifications';

const upsert = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({ from: () => ({ upsert }) }),
}));

const orderId = '11111111-1111-4111-8111-111111111111';
const now = new Date('2027-04-10T15:30:00Z');

describe('maskEmail', () => {
  test('maskEmail oculta el usuario', () => {
    expect(maskEmail('ana.perez@gmail.com')).toBe('a***@gmail.com');
    expect(maskEmail('Z@Example.org')).toBe('Z***@Example.org');
  });
});

describe('maskPhone', () => {
  test('maskPhone deja los últimos cuatro dígitos', () => {
    expect(maskPhone('+50312345678')).toBe('+503 ****-5678');
  });
});

describe('buildTicketNotifications', () => {
  test('sin teléfono solo hay fila de correo', () => {
    const rows = buildTicketNotifications({ orderId, email: 'ana@gmail.com', phone: null, now });

    expect(rows).toEqual([
      { orderId, channel: 'email', template: 'ticket', destinationMasked: 'a***@gmail.com', scheduledFor: now },
    ]);
  });

  test('con teléfono hay dos filas', () => {
    const rows = buildTicketNotifications({ orderId, email: 'ana@gmail.com', phone: '+50312345678', now });

    expect(rows.map((row) => [row.channel, row.template, row.destinationMasked])).toEqual([
      ['email', 'ticket', 'a***@gmail.com'],
      ['whatsapp', 'ticket', '+503 ****-5678'],
    ]);
    expect(rows.every((row) => row.scheduledFor.getTime() === now.getTime())).toBe(true);
  });

  test('ninguna fila contiene el correo ni el teléfono completos', () => {
    const email = 'ana.perez@gmail.com';
    const phone = '+50312345678';
    const serialized = JSON.stringify(buildTicketNotifications({ orderId, email, phone, now }));

    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain('ana.perez');
    expect(serialized).not.toContain(phone);
    expect(serialized).not.toContain('12345678');
  });
});

describe('buildReminderNotifications', () => {
  const email = 'ana@gmail.com';

  test('evento en 48 h crea recordatorio a las 24 h', () => {
    const eventStartsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const rows = buildReminderNotifications({ orderId, email, phone: null, eventStartsAt, now });

    expect(rows).toEqual([
      {
        orderId,
        channel: 'email',
        template: 'reminder_24h',
        destinationMasked: 'a***@gmail.com',
        scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    ]);
  });

  test('evento en 10 h no crea recordatorio', () => {
    const eventStartsAt = new Date(now.getTime() + 10 * 60 * 60 * 1000);

    expect(buildReminderNotifications({ orderId, email, phone: '+50312345678', eventStartsAt, now })).toEqual([]);
  });

  test('el recordatorio por WhatsApp solo existe con teléfono', () => {
    const eventStartsAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const sinTelefono = buildReminderNotifications({ orderId, email, phone: null, eventStartsAt, now });
    const conTelefono = buildReminderNotifications({ orderId, email, phone: '+50312345678', eventStartsAt, now });

    expect(sinTelefono.map((row) => row.channel)).toEqual(['email']);
    expect(conTelefono.map((row) => [row.channel, row.template, row.destinationMasked])).toEqual([
      ['email', 'reminder_24h', 'a***@gmail.com'],
      ['whatsapp', 'reminder_24h', '+503 ****-5678'],
    ]);
    expect(conTelefono.every((row) => row.scheduledFor.getTime() === eventStartsAt.getTime() - 24 * 60 * 60 * 1000)).toBe(true);
  });

  test('un evento exactamente a 24 h no crea recordatorio ya vencido', () => {
    const eventStartsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    expect(buildReminderNotifications({ orderId, email, phone: null, eventStartsAt, now })).toEqual([]);
  });
});

describe('enqueueNotifications', () => {
  const rows: OutboxRow[] = buildTicketNotifications({ orderId, email: 'ana@gmail.com', phone: null, now });

  beforeEach(() => {
    upsert.mockReset();
  });

  test('inserta con upsert que ignora duplicados', async () => {
    upsert.mockResolvedValue({ error: null });

    await enqueueNotifications(rows);

    expect(upsert).toHaveBeenCalledWith(
      [
        {
          order_id: orderId,
          channel: 'email',
          template: 'ticket',
          destination_masked: 'a***@gmail.com',
          scheduled_for: now.toISOString(),
        },
      ],
      { onConflict: 'order_id,channel,template', ignoreDuplicates: true },
    );
  });

  test('un error del outbox no lanza', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    upsert.mockResolvedValue({ error: { message: 'falla' } });
    await expect(enqueueNotifications(rows)).resolves.toBeUndefined();

    upsert.mockRejectedValue(new Error('red caída'));
    await expect(enqueueNotifications(rows)).resolves.toBeUndefined();

    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('sin filas no consulta la base', async () => {
    await enqueueNotifications([]);

    expect(upsert).not.toHaveBeenCalled();
  });
});
