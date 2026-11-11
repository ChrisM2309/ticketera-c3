import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase } from './helpers';

/**
 * Pagos con Wompi (plan 2026-11-11-wompi-sandbox v2): confirm_order acepta el resultado wompi_approved con
 * la clave 'wompi:<id de transacción>', y el id de transacción es único en payments.
 */

let db: PGlite;
let tokenSeed = 0;

function nextHash(): string {
  tokenSeed += 1;
  return tokenSeed.toString(16).padStart(64, '0');
}

async function paidTicketType(eventSlug: string, name: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ id: string }>(
    `select t.id from public.ticket_types t join public.events e on e.id = t.event_id
      where e.slug = $1 and t.name = $2`,
    [eventSlug, name],
  );
  return result.rows[0].id;
}

async function eventIdFor(slug: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ id: string }>(`select id from public.events where slug = $1`, [slug]);
  return result.rows[0].id;
}

async function pendingPaidOrder(quantity: number): Promise<{ orderId: string; publicTokenHash: string }> {
  const eventId = await eventIdFor('congreso-demo-ia');
  const ticketTypeId = await paidTicketType('congreso-demo-ia', 'General');
  const publicTokenHash = nextHash();
  await asRole(db, 'service_role');

  const result = await db.query<{ order_id: string }>(
    `select order_id from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6, $7)`,
    [
      eventId,
      JSON.stringify([{ ticketTypeId, quantity }]),
      'Comprador DEMO',
      'comprador@example.test',
      publicTokenHash,
      5,
      randomUUID(),
    ],
  );

  return { orderId: result.rows[0].order_id, publicTokenHash };
}

function issued(quantity: number): Array<{ ticketId: string; qrTokenHash: string }> {
  return Array.from({ length: quantity }, () => ({ ticketId: randomUUID(), qrTokenHash: nextHash() }));
}

async function confirmWompi(
  order: { orderId: string; publicTokenHash: string },
  key: string,
  tickets: Array<{ ticketId: string; qrTokenHash: string }>,
  outcome = 'wompi_approved',
) {
  await asRole(db, 'service_role');
  return db.query<{ result_status: string; result_ticket_count: number; result_already_processed: boolean }>(
    `select * from public.confirm_order($1, $2, $3, $4, $5::jsonb)`,
    [order.orderId, order.publicTokenHash, outcome, key, JSON.stringify(tickets)],
  );
}

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('confirm_order con wompi_approved', () => {
  it('confirma una orden pagada, emite boletos y registra el pago de Wompi con su id de transacción', async () => {
    const order = await pendingPaidOrder(2);
    const result = await confirmWompi(order, 'wompi:tx-prueba-0001', issued(2));

    expect(result.rows[0]).toMatchObject({ result_status: 'confirmed', result_ticket_count: 2, result_already_processed: false });

    await asSuperuser(db);
    const payment = await db.query<{ provider: string; status: string; provider_transaction_id: string }>(
      `select provider, status, provider_transaction_id from public.payments where order_id = $1`,
      [order.orderId],
    );
    expect(payment.rows).toEqual([
      { provider: 'wompi', status: 'wompi_approved', provider_transaction_id: 'tx-prueba-0001' },
    ]);
  });

  it('un webhook repetido con la misma transacción no emite boletos ni pagos otra vez', async () => {
    const order = await pendingPaidOrder(1);
    await confirmWompi(order, 'wompi:tx-repetida', issued(1));

    const repeated = await confirmWompi(order, 'wompi:tx-repetida', issued(1));
    expect(repeated.rows[0]).toMatchObject({ result_status: 'confirmed', result_ticket_count: 1, result_already_processed: true });

    await asSuperuser(db);
    const counts = await db.query<{ tickets: number; payments: number }>(
      `select (select count(*)::int from public.tickets where order_id = $1) as tickets,
              (select count(*)::int from public.payments where order_id = $1) as payments`,
      [order.orderId],
    );
    expect(counts.rows[0]).toEqual({ tickets: 1, payments: 1 });
  });

  it('exige la clave con el prefijo wompi: para este resultado', async () => {
    const order = await pendingPaidOrder(1);

    await expect(confirmWompi(order, 'demo:sin-prefijo-wompi', issued(1))).rejects.toThrow(/Wompi/);
  });

  it('no acepta el resultado de Wompi en una orden gratuita', async () => {
    await asSuperuser(db);
    const eventId = await eventIdFor('hackathon-demo-en-linea');
    const freeType = await db.query<{ id: string }>(
      `select id from public.ticket_types where event_id = $1 and name = 'Registro gratuito'`,
      [eventId],
    );
    const publicTokenHash = nextHash();
    await asRole(db, 'service_role');
    const created = await db.query<{ order_id: string }>(
      `select order_id from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6, $7)`,
      [eventId, JSON.stringify([{ ticketTypeId: freeType.rows[0].id, quantity: 1 }]), 'Gratis', 'g@example.test', publicTokenHash, 5, randomUUID()],
    );

    await expect(
      confirmWompi({ orderId: created.rows[0].order_id, publicTokenHash }, 'wompi:tx-gratis', issued(1)),
    ).rejects.toThrow(/gratuita/);
  });

  it('no deja dos pagos con el mismo id de transacción en órdenes distintas', async () => {
    const first = await pendingPaidOrder(1);
    const second = await pendingPaidOrder(1);
    await confirmWompi(first, 'wompi:tx-unica', issued(1));

    await expect(confirmWompi(second, 'wompi:tx-unica', issued(1))).rejects.toThrow(/payments_provider_transaction_key|duplicate key/);
  });

  it('el token cifrado tiene límite de longitud en la base', async () => {
    const order = await pendingPaidOrder(1);
    await asSuperuser(db);

    await expect(
      db.query(`update public.orders set checkout_token_encrypted = $2 where id = $1`, [order.orderId, 'x'.repeat(513)]),
    ).rejects.toThrow(/checkout_token_encrypted/);
  });
});

describe('payment_webhook_events', () => {
  it('deduplica por proveedor, transacción y resultado', async () => {
    await asSuperuser(db);
    const order = await pendingPaidOrder(1);
    await db.query(
      `insert into public.payment_webhook_events (provider, transaction_id, result_code, order_id) values ('wompi', 'tx-1', 'ExitosaAprobada', $1)`,
      [order.orderId],
    );

    await expect(
      db.query(
        `insert into public.payment_webhook_events (provider, transaction_id, result_code, order_id) values ('wompi', 'tx-1', 'ExitosaAprobada', $1)`,
        [order.orderId],
      ),
    ).rejects.toThrow(/unique|duplicate/);
  });

  it('anon y authenticated no pueden leer ni escribir el registro', async () => {
    for (const role of ['anon', 'authenticated'] as const) {
      await asRole(db, role);
      await expect(db.query('select * from public.payment_webhook_events')).rejects.toThrow(/permission denied/);
    }
  });
});
