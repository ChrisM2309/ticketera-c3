import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

let db: PGlite;
let organizerUser: string;
let otherUser: string;
let eventId: string;
let otherEventId: string;
let ticketHash: string;

beforeEach(async () => {
  db = await createDatabase();
  organizerUser = await createUser(db);
  otherUser = await createUser(db);
  const organizerId = await createOrganizer(db, organizerUser, `organizador-${randomUUID()}`);
  const otherOrganizerId = await createOrganizer(db, otherUser, `organizador-${randomUUID()}`);
  eventId = await createEvent(db, organizerId, { slug: `evento-${randomUUID()}`, status: 'published' });
  otherEventId = await createEvent(db, organizerId, { slug: `evento-${randomUUID()}`, status: 'published' });

  await asSuperuser(db);
  const ticketType = await db.query<{ id: string }>(
    `insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order)
     values ($1, 'General', 1000, 20, 5) returning id`,
    [eventId],
  );
  const pending = await addTicket(ticketType.rows[0].id, false);
  const confirmed = await addTicket(ticketType.rows[0].id, true);
  ticketHash = confirmed;
  await addTicket(ticketType.rows[0].id, true, otherEventId);
  await asSuperuser(db);
  void pending;
  void otherOrganizerId;
});

async function addTicket(ticketTypeId: string, confirmed: boolean, forEventId = eventId): Promise<string> {
  const order = await db.query<{ id: string }>(
    `insert into public.orders (public_token_hash, event_id, buyer_name, buyer_email, status,
      subtotal_cents, fee_cents, total_cents, confirmed_at)
     values ($1, $2, 'Comprador DEMO', 'buyer@example.test', $3, 1000, 0, 1000,
      case when $3 = 'confirmed' then now() else null end) returning id`,
    [randomUUID().replaceAll('-', '').padEnd(64, '0'), forEventId, confirmed ? 'confirmed' : 'pending'],
  );
  const item = await db.query<{ id: string }>(
    `insert into public.order_items (order_id, ticket_type_id, unit_price_cents, quantity, line_total_cents)
     values ($1, $2, 1000, 1, 1000) returning id`,
    [order.rows[0].id, ticketTypeId],
  );
  const hash = randomUUID().replaceAll('-', '').padEnd(64, 'a');
  await db.query(
    `insert into public.tickets (order_id, order_item_id, ticket_type_id, qr_token_hash)
     values ($1, $2, $3, $4)`,
    [order.rows[0].id, item.rows[0].id, ticketTypeId, hash],
  );
  return hash;
}

afterEach(async () => {
  await db.close();
});

describe('organizer_check_in', () => {
  it('marca la entrada una sola vez', async () => {
    await asRole(db, 'authenticated', organizerUser);
    await expect(db.query(`select public.organizer_check_in($1, $2)`, [eventId, ticketHash])).resolves.toMatchObject({
      rows: [{ organizer_check_in: 'checked_in' }],
    });
  });

  it('cuenta solo boletos confirmados y refleja el ingreso registrado', async () => {
    await asRole(db, 'authenticated', organizerUser);
    const before = await db.query<{ issued: number; checked_in: number }>(
      `select * from public.organizer_event_check_in_counts($1)`,
      [eventId],
    );
    expect(before.rows).toEqual([{ issued: 1, checked_in: 0 }]);

    await db.query(`select public.organizer_check_in($1, $2)`, [eventId, ticketHash]);
    const after = await db.query<{ issued: number; checked_in: number }>(
      `select * from public.organizer_event_check_in_counts($1)`,
      [eventId],
    );
    expect(after.rows).toEqual([{ issued: 1, checked_in: 1 }]);
  });

  it('el segundo intento devuelve already_checked_in', async () => {
    await asRole(db, 'authenticated', organizerUser);
    await db.query(`select public.organizer_check_in($1, $2)`, [eventId, ticketHash]);
    const result = await db.query<{ organizer_check_in: string }>(
      `select public.organizer_check_in($1, $2)`,
      [eventId, ticketHash],
    );
    expect(result.rows[0].organizer_check_in).toBe('already_checked_in');
  });

  it('otro organizador no puede escanear', async () => {
    await asRole(db, 'authenticated', otherUser);
    await expect(db.query(`select public.organizer_check_in($1, $2)`, [eventId, ticketHash])).rejects.toThrow();
  });

  it('un boleto de otro evento devuelve wrong_event', async () => {
    await asSuperuser(db);
    const rows = await db.query<{ qr_token_hash: string }>(
      `select t.qr_token_hash from public.tickets t join public.order_items i on i.id = t.order_item_id
       join public.orders o on o.id = t.order_id where o.event_id = $1 and o.status = 'confirmed'`,
      [otherEventId],
    );
    await asRole(db, 'authenticated', organizerUser);
    const result = await db.query<{ organizer_check_in: string }>(
      `select public.organizer_check_in($1, $2)`,
      [eventId, rows.rows[0].qr_token_hash],
    );
    expect(result.rows[0].organizer_check_in).toBe('wrong_event');
  });

  it('una orden no confirmada devuelve not_found', async () => {
    await asSuperuser(db);
    const rows = await db.query<{ qr_token_hash: string }>(
      `select t.qr_token_hash from public.tickets t join public.orders o on o.id = t.order_id
       where o.status = 'pending' limit 1`,
    );
    await asRole(db, 'authenticated', organizerUser);
    const result = await db.query<{ organizer_check_in: string }>(
      `select public.organizer_check_in($1, $2)`,
      [eventId, rows.rows[0].qr_token_hash],
    );
    expect(result.rows[0].organizer_check_in).toBe('not_found');
  });

  it('un código inexistente devuelve not_found', async () => {
    await asRole(db, 'authenticated', organizerUser);
    const result = await db.query<{ organizer_check_in: string }>(
      `select public.organizer_check_in($1, $2)`,
      [eventId, 'f'.repeat(64)],
    );
    expect(result.rows[0].organizer_check_in).toBe('not_found');
  });

  it('anon no puede ejecutar', async () => {
    await asRole(db, 'anon');
    await expect(db.query(`select public.organizer_check_in($1, $2)`, [eventId, ticketHash])).rejects.toThrow();
  });
});
