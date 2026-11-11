import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase } from './helpers';

/**
 * Caducidad de compras pendientes (decisión D-69): 30 minutos sin pago y la compra se cierra.
 */

let db: PGlite;
let tokenSeed = 0;

function nextHash(): string {
  tokenSeed += 1;
  return tokenSeed.toString(16).padStart(64, '0');
}

/** Crea una orden pendiente con importe. `minutesAgo` mueve su fecha de creación. */
async function pendingOrder(minutesAgo: number): Promise<string> {
  await asSuperuser(db);
  const event = await db.query<{ id: string }>(`select id from public.events where slug = 'congreso-demo-ia'`);
  const type = await db.query<{ id: string }>(
    `select t.id from public.ticket_types t where t.event_id = $1 and t.name = 'General'`,
    [event.rows[0].id],
  );
  await asRole(db, 'service_role');
  const created = await db.query<{ order_id: string }>(
    `select order_id from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6, $7)`,
    [
      event.rows[0].id,
      JSON.stringify([{ ticketTypeId: type.rows[0].id, quantity: 1 }]),
      'Comprador DEMO',
      'comprador@example.test',
      nextHash(),
      5,
      randomUUID(),
    ],
  );
  await asSuperuser(db);
  await db.query(`update public.orders set created_at = now() - make_interval(mins => $2) where id = $1`, [
    created.rows[0].order_id,
    minutesAgo,
  ]);
  return created.rows[0].order_id;
}

async function orderStatus(id: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ status: string }>(`select status from public.orders where id = $1`, [id]);
  return result.rows[0].status;
}

async function expire() {
  await asSuperuser(db);
  const result = await db.query<{ orders_cancelled: number; featured_closed: number; packages_closed: number }>(
    `select * from public.expire_pending_purchases()`,
  );
  return result.rows[0];
}

beforeEach(async () => {
  db = await createDatabase();
}, 60_000);

afterEach(async () => {
  await db.close();
});

describe('caducidad de compras pendientes', () => {
  it('cierra una orden sin pago después de 30 minutos y deja la reciente como estaba', async () => {
    const old = await pendingOrder(31);
    const recent = await pendingOrder(5);

    const counts = await expire();

    expect(counts.orders_cancelled).toBe(1);
    expect(await orderStatus(old)).toBe('cancelled');
    expect(await orderStatus(recent)).toBe('pending');
  });

  it('no toca una orden ya confirmada aunque sea antigua', async () => {
    const id = await pendingOrder(40);
    await asSuperuser(db);
    await db.query(`update public.orders set status = 'confirmed', confirmed_at = now() where id = $1`, [id]);

    await expire();

    expect(await orderStatus(id)).toBe('confirmed');
  });

  it('cierra destacados y paquetes que esperan pago desde hace más de 30 minutos', async () => {
    await asSuperuser(db);
    const event = await db.query<{ id: string; organizer_id: string }>(
      `select id, organizer_id from public.events where slug = 'congreso-demo-ia'`,
    );
    await db.query(
      `insert into public.featured_placements
         (event_id, source, starts_on, ends_on, daily_rate_cents, total_cents, status, created_at)
       values ($1, 'paid', current_date + 1, current_date + 1, 200, 200, 'awaiting_payment', now() - interval '31 minutes')`,
      [event.rows[0].id],
    );
    await db.query(
      `insert into public.featured_placements
         (event_id, source, starts_on, ends_on, daily_rate_cents, total_cents, status, created_at)
       values ($1, 'paid', current_date + 1, current_date + 1, 200, 200, 'awaiting_payment', now() - interval '5 minutes')`,
      [event.rows[0].id],
    );
    await db.query(
      `insert into public.business_packages
         (organizer_id, starts_on, ends_on, price_cents, benefits, featured_days_remaining, events_remaining, status, created_at)
       values ($1, current_date, current_date + 365, 120000, '{}', 0, 0, 'awaiting_payment', now() - interval '31 minutes')`,
      [event.rows[0].organizer_id],
    );

    const counts = await expire();

    expect(counts.featured_closed).toBe(1);
    expect(counts.packages_closed).toBe(1);
    const featured = await db.query<{ status: string }>(
      `select status from public.featured_placements where event_id = $1 order by created_at`,
      [event.rows[0].id],
    );
    expect(featured.rows.map((row) => row.status)).toEqual(['payment_failed', 'awaiting_payment']);
    const pkg = await db.query<{ status: string }>(`select status from public.business_packages where organizer_id = $1`, [
      event.rows[0].organizer_id,
    ]);
    expect(pkg.rows[0].status).toBe('payment_failed');
  });

  it('un pago que llega después de cerrarse no confirma la orden', async () => {
    const id = await pendingOrder(35);
    await expire();

    await asRole(db, 'service_role');
    const result = await db.query<{ result_status: string; result_already_processed: boolean }>(
      `select * from public.confirm_order($1, $2, 'wompi_approved', 'wompi:tx-tardia-1', '[]'::jsonb)`,
      [id, await hashOf(id)],
    );

    expect(result.rows[0].result_already_processed).toBe(true);
    expect(await orderStatus(id)).toBe('cancelled');
  });

  it('solo el servidor puede ejecutar la caducidad', async () => {
    await asRole(db, 'authenticated');
    await expect(db.query(`select public.expire_pending_purchases()`)).rejects.toThrow(/permission denied/);
  });
});

/** Hash del token de checkout de la orden. Las pruebas guardan un hash fijo al crear la orden. */
async function hashOf(id: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ public_token_hash: string }>(`select public_token_hash from public.orders where id = $1`, [id]);
  return result.rows[0].public_token_hash;
}
