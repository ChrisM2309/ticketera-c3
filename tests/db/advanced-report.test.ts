import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createOrderFixture, createUser } from './helpers';

let db: PGlite;
let ownerId: string;
let otherId: string;
let adminId: string;
let organizerId: string;
let eventId: string;

beforeEach(async () => {
  db = await createDatabase();
  ownerId = await createUser(db);
  otherId = await createUser(db);
  adminId = await createUser(db, 'admin');
  organizerId = await createOrganizer(db, ownerId, `reporte-${randomUUID()}`);
  eventId = await createEvent(db, organizerId, { slug: `reporte-${randomUUID()}`, status: 'published' });
  await asSuperuser(db);
  await db.query(
    `insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order)
     values ($1, 'General', 2500, 20, 5), ($1, 'VIP', 5000, 10, 5)`,
    [eventId],
  );
  const orderId = await createOrderFixture(db, eventId);
  await db.query(`update public.orders set status = 'confirmed', confirmed_at = now(), subtotal_cents = 5000, fee_cents = 0, total_cents = 5000 where id = $1`, [orderId]);
  await db.query(`update public.order_items set ticket_type_id = (select id from public.ticket_types where event_id = $1 and name = 'VIP'), unit_price_cents = 5000, line_total_cents = 5000 where order_id = $2`, [eventId, orderId]);
  await db.query(`update public.tickets set ticket_type_id = (select id from public.ticket_types where event_id = $1 and name = 'VIP'), checked_in_at = now() where order_id = $2`, [eventId, orderId]);
});

afterEach(async () => db.close());

async function addActivePackage() {
  await asSuperuser(db);
  await db.query(
    `insert into public.business_packages
      (organizer_id, starts_on, ends_on, price_cents, benefits, featured_days_remaining, events_remaining, status)
     values ($1, current_date, current_date + 365, 10000, '{}'::jsonb, 0, 1, 'active')`,
    [organizerId],
  );
}

describe('reporte superior de evento', () => {
  it('sin paquete activo las funciones fallan con 42501', async () => {
    await asRole(db, 'authenticated', ownerId);
    await expect(db.query(`select * from public.organizer_event_daily_issuance($1::uuid)`, [eventId])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query(`select * from public.organizer_event_ticket_type_breakdown($1::uuid)`, [eventId])).rejects.toMatchObject({ code: '42501' });
  });

  it('con paquete activo devuelve agregados por fecha y por tipo', async () => {
    await addActivePackage();
    await asRole(db, 'authenticated', ownerId);
    const daily = await db.query(`select * from public.organizer_event_daily_issuance($1::uuid)`, [eventId]);
    const types = await db.query(`select * from public.organizer_event_ticket_type_breakdown($1::uuid)`, [eventId]);
    expect(daily.rows).toHaveLength(1);
    expect(daily.rows[0]).toMatchObject({ issued: 1, checked_in: 1 });
    expect(types.rows).toEqual([{ ticket_type_name: 'VIP', issued: 1, checked_in: 1, subtotal_cents: 5000 }]);
    expect(Object.keys(types.rows[0] as Record<string, unknown>).sort()).toEqual(['checked_in', 'issued', 'subtotal_cents', 'ticket_type_name']);
  });

  it('otro organizador no accede aunque tenga paquete activo', async () => {
    await addActivePackage();
    await asSuperuser(db);
    const otherOrganizer = await createOrganizer(db, otherId, `otro-${randomUUID()}`);
    await db.query(
      `insert into public.business_packages
        (organizer_id, starts_on, ends_on, price_cents, benefits, featured_days_remaining, events_remaining, status)
       values ($1, current_date, current_date + 365, 10000, '{}'::jsonb, 0, 1, 'active')`,
      [otherOrganizer],
    );
    await asRole(db, 'authenticated', otherId);
    await expect(db.query(`select * from public.organizer_event_daily_issuance($1::uuid)`, [eventId])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query(`select * from public.organizer_event_ticket_type_breakdown($1::uuid)`, [eventId])).rejects.toMatchObject({ code: '42501' });
  });

  it('el administrador puede consultar eventos sin paquete', async () => {
    await asRole(db, 'authenticated', adminId);
    const daily = await db.query(`select * from public.organizer_event_daily_issuance($1::uuid)`, [eventId]);
    const types = await db.query(`select * from public.organizer_event_ticket_type_breakdown($1::uuid)`, [eventId]);
    expect(daily.rows).toHaveLength(1);
    expect(types.rows).toHaveLength(1);
  });
});
