import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createOrderFixture, createUser } from './helpers';

let db: PGlite;
let ownerId: string;
let adminId: string;
let eventId: string;
let otherEventId: string;

beforeEach(async () => {
  db = await createDatabase();
  ownerId = await createUser(db);
  const otherId = await createUser(db);
  adminId = await createUser(db, 'admin');
  const ownerOrganizer = await createOrganizer(db, ownerId, `organizador-${randomUUID()}`);
  const otherOrganizer = await createOrganizer(db, otherId, `organizador-${randomUUID()}`);
  eventId = await createEvent(db, ownerOrganizer, { slug: `evento-${randomUUID()}`, status: 'published' });
  otherEventId = await createEvent(db, otherOrganizer, { slug: `evento-${randomUUID()}`, status: 'published' });

  await asSuperuser(db);
  await db.query(`update public.events set starts_at = now() - interval '2 days', ends_at = now() - interval '1 day' where id = $1`, [eventId]);
  await db.query(
    `insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order)
     values ($1, 'General', 8000, 20, 5)`,
    [eventId],
  );
  const orderId = await createOrderFixture(db, eventId);
  await db.query(`update public.orders set status = 'confirmed', confirmed_at = now(), subtotal_cents = 8000, fee_cents = 400, total_cents = 8400, organizer_fee_cents = 530 where id = $1`, [orderId]);
  await db.query(`update public.tickets set checked_in_at = now() where order_id = $1`, [orderId]);
});

afterEach(async () => db.close());

describe('organizer_event_report', () => {
  it('el dueño ve conteos e importes agregados de órdenes confirmadas', async () => {
    await asRole(db, 'authenticated', ownerId);
    const result = await db.query(`select * from public.organizer_event_report($1)`, [eventId]);
    expect(result.rows).toEqual([{
      issued: 1,
      checked_in: 1,
      subtotal_cents: 8000,
      fee_cents: 400,
      organizer_fee_cents: 530,
      event_ended: true,
      survey_count: 0,
      survey_average: null,
    }]);
  });

  it('otro organizador no puede leer el reporte', async () => {
    const otherId = await createUser(db);
    await asRole(db, 'authenticated', otherId);
    await expect(db.query(`select * from public.organizer_event_report($1)`, [eventId])).rejects.toThrow();
  });

  it('el administrador puede leer el reporte', async () => {
    await asRole(db, 'authenticated', adminId);
    const result = await db.query(`select * from public.organizer_event_report($1)`, [eventId]);
    expect(result.rows).toHaveLength(1);
  });

  it('devuelve solo columnas agregadas, sin datos personales', async () => {
    await asRole(db, 'authenticated', ownerId);
    const result = await db.query(`select * from public.organizer_event_report($1)`, [otherEventId]).catch(() => null);
    expect(result).toBeNull();
    await asRole(db, 'authenticated', ownerId);
    const allowed = await db.query(`select * from public.organizer_event_report($1)`, [eventId]);
    expect(Object.keys(allowed.rows[0] as Record<string, unknown>).sort()).toEqual([
      'checked_in', 'event_ended', 'fee_cents', 'issued', 'organizer_fee_cents', 'subtotal_cents', 'survey_average', 'survey_count',
    ]);
  });
});
