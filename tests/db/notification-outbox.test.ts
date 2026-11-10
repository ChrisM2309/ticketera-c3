import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import {
  asRole,
  asSuperuser,
  createDatabase,
  createEvent,
  createOrderFixture,
  createOrganizer,
  createUser,
} from './helpers';

let db: PGlite;
let orderId: string;

async function insertOutbox(channel: 'email' | 'whatsapp' = 'email', template: 'ticket' | 'reminder_24h' = 'ticket') {
  return db.query(
    `insert into public.notification_outbox (order_id, channel, template, destination_masked)
     values ($1, $2, $3, 'a***@gmail.com')`,
    [orderId, channel, template],
  );
}

beforeEach(async () => {
  db = await createDatabase();
  const owner = await createUser(db, 'organizer');
  const organizerId = await createOrganizer(db, owner, 'org-outbox');
  const eventId = await createEvent(db, organizerId, { slug: 'evento-outbox', status: 'published' });
  await db.query(
    `insert into public.ticket_types (event_id, name, price_cents, quantity_total)
     values ($1, 'General', 0, 10)`,
    [eventId],
  );
  orderId = await createOrderFixture(db, eventId);
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('notification_outbox', () => {
  it('la clave única evita duplicados', async () => {
    await asRole(db, 'service_role');
    await insertOutbox('email', 'ticket');

    await expect(insertOutbox('email', 'ticket')).rejects.toThrow(/notification_outbox_order_id_channel_template_key/);

    await insertOutbox('whatsapp', 'ticket');
    await insertOutbox('email', 'reminder_24h');

    const upsert = await db.query(
      `insert into public.notification_outbox (order_id, channel, template, destination_masked)
       values ($1, 'email', 'ticket', 'otro') on conflict (order_id, channel, template) do nothing`,
      [orderId],
    );
    expect(upsert.affectedRows).toBe(0);

    await asSuperuser(db);
    const total = await db.query<{ total: number }>(
      `select count(*)::int as total from public.notification_outbox where order_id = $1`,
      [orderId],
    );
    expect(total.rows[0].total).toBe(3);
  });

  it('anon y authenticated no pueden leer', async () => {
    await asRole(db, 'service_role');
    await insertOutbox();

    for (const role of ['anon', 'authenticated'] as const) {
      await asRole(db, role);
      await expect(db.query('select * from public.notification_outbox')).rejects.toThrow(/permission denied/);
      await expect(insertOutbox('whatsapp')).rejects.toThrow(/permission denied/);
    }
  });

  it('service_role puede insertar', async () => {
    await asRole(db, 'service_role');
    await insertOutbox();

    const result = await db.query<{ status: string; destination_masked: string }>(
      `select status, destination_masked from public.notification_outbox where order_id = $1`,
      [orderId],
    );

    expect(result.rows).toEqual([{ status: 'simulated', destination_masked: 'a***@gmail.com' }]);
  });

  it('rechaza canales, plantillas y estados desconocidos', async () => {
    await asSuperuser(db);

    await expect(
      db.query(
        `insert into public.notification_outbox (order_id, channel, template, destination_masked)
         values ($1, 'sms', 'ticket', 'x')`,
        [orderId],
      ),
    ).rejects.toThrow(/channel/);
    await expect(
      db.query(
        `insert into public.notification_outbox (order_id, channel, template, destination_masked)
         values ($1, 'email', 'otra', 'x')`,
        [orderId],
      ),
    ).rejects.toThrow(/template/);
    await expect(
      db.query(
        `insert into public.notification_outbox (order_id, channel, template, destination_masked, status)
         values ($1, 'email', 'ticket', 'x', 'entregado')`,
        [orderId],
      ),
    ).rejects.toThrow(/status/);
  });

  it('el correo de boleto pasa por pending y sent, y guarda intentos y motivo acotado', async () => {
    await asRole(db, 'service_role');
    await db.query(
      `insert into public.notification_outbox (order_id, channel, template, destination_masked, status)
       values ($1, 'email', 'ticket', 'a***@gmail.com', 'pending')`,
      [orderId],
    );
    await db.query(
      `update public.notification_outbox
          set status = 'sent', provider_message_id = '<msg-demo@brevo>', attempts = 1, sent_at = now()
        where order_id = $1 and channel = 'email' and template = 'ticket'`,
      [orderId],
    );

    const result = await db.query<{ status: string; attempts: number; provider_message_id: string }>(
      `select status, attempts, provider_message_id from public.notification_outbox where order_id = $1 and channel = 'email'`,
      [orderId],
    );
    expect(result.rows).toEqual([{ status: 'sent', attempts: 1, provider_message_id: '<msg-demo@brevo>' }]);

    await expect(
      db.query(`update public.notification_outbox set attempts = -1 where order_id = $1`, [orderId]),
    ).rejects.toThrow(/attempts/);
    await expect(
      db.query(`update public.notification_outbox set last_error = $2 where order_id = $1`, [orderId, 'x'.repeat(201)]),
    ).rejects.toThrow(/last_error/);
  });

  it('se elimina junto con la orden', async () => {
    await asSuperuser(db);
    await insertOutbox();
    await db.query('delete from public.tickets where order_id = $1', [orderId]);
    await db.query('delete from public.payments where order_id = $1', [orderId]);
    await db.query('delete from public.order_items where order_id = $1', [orderId]);
    await db.query('delete from public.orders where id = $1', [orderId]);

    const total = await db.query<{ total: number }>(`select count(*)::int as total from public.notification_outbox`);
    expect(total.rows[0].total).toBe(0);
  });
});
