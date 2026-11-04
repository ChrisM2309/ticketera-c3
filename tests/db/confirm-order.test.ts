import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase } from './helpers';

type TicketRow = {
  id: string;
  price_cents: number;
  quantity_sold: number;
};

type ConfirmRow = {
  result_order_id: string;
  result_status: string;
  result_ticket_count: number;
  result_already_processed: boolean;
};

let db: PGlite;
let tokenSeed = 0;

/** Hash de 64 caracteres hexadecimales, distinto en cada llamada. */
function nextHash(): string {
  tokenSeed += 1;
  return tokenSeed.toString(16).padStart(64, '0');
}

async function ticket(eventSlug: string, name: string): Promise<TicketRow> {
  await asSuperuser(db);
  const result = await db.query<TicketRow>(
    `select t.id, t.price_cents, t.quantity_sold
       from public.ticket_types t
       join public.events e on e.id = t.event_id
      where e.slug = $1 and t.name = $2`,
    [eventSlug, name],
  );

  return result.rows[0];
}

async function eventId(slug: string): Promise<string> {
  await asSuperuser(db);
  const result = await db.query<{ id: string }>(`select id from public.events where slug = $1`, [slug]);
  return result.rows[0].id;
}

type PendingOrder = { orderId: string; publicTokenHash: string };

/** Crea una orden pendiente con la RPC de T09 y devuelve su id y el hash de su token. */
async function createPendingOrder(
  eventSlug: string,
  items: Array<{ ticketTypeId: string; quantity: number }>,
): Promise<PendingOrder> {
  const event = await eventId(eventSlug);
  const publicTokenHash = nextHash();
  await asRole(db, 'service_role');

  const result = await db.query<{ order_id: string }>(
    `select order_id from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6)`,
    [event, JSON.stringify(items), 'Comprador DEMO', 'comprador@example.test', publicTokenHash, 5],
  );

  return { orderId: result.rows[0].order_id, publicTokenHash };
}

async function confirm(
  order: PendingOrder,
  options: {
    outcome: 'free' | 'demo_approved' | 'demo_rejected';
    key?: string;
    qrHashes?: string[];
    publicTokenHash?: string;
  },
) {
  await asRole(db, 'service_role');

  return db.query<ConfirmRow>(
    `select * from public.confirm_order($1, $2, $3, $4, $5::jsonb)`,
    [
      order.orderId,
      options.publicTokenHash ?? order.publicTokenHash,
      options.outcome,
      options.key ?? null,
      JSON.stringify(options.qrHashes ?? []),
    ],
  );
}

function qrHashesFor(quantity: number): string[] {
  return Array.from({ length: quantity }, () => nextHash());
}

async function snapshot() {
  await asSuperuser(db);
  const result = await db.query<{
    orders: number;
    tickets: number;
    payments: number;
    confirmed: number;
  }>(
    `select
       (select count(*)::int from public.orders) as orders,
       (select count(*)::int from public.tickets) as tickets,
       (select count(*)::int from public.payments) as payments,
       (select count(*)::int from public.orders where status = 'confirmed') as confirmed`,
  );

  return result.rows[0];
}

async function orderStatus(orderId: string) {
  await asSuperuser(db);
  const result = await db.query<{ status: string; has_confirmed_at: boolean }>(
    `select status, (confirmed_at is not null) as has_confirmed_at from public.orders where id = $1`,
    [orderId],
  );

  return result.rows[0];
}

async function ticketsFor(orderId: string): Promise<number> {
  await asSuperuser(db);
  const result = await db.query<{ total: number }>(
    `select count(*)::int as total from public.tickets where order_id = $1`,
    [orderId],
  );

  return result.rows[0].total;
}

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('confirm_order', () => {
  it('confirma un registro gratuito, emite un boleto por unidad y descuenta cupo', async () => {
    const free = await ticket('hackathon-demo-en-linea', 'Registro gratuito');
    const order = await createPendingOrder('hackathon-demo-en-linea', [
      { ticketTypeId: free.id, quantity: 2 },
    ]);

    const result = await confirm(order, { outcome: 'free', qrHashes: qrHashesFor(2) });

    expect(result.rows[0]).toEqual({
      result_order_id: order.orderId,
      result_status: 'confirmed',
      result_ticket_count: 2,
      result_already_processed: false,
    });
    expect(await orderStatus(order.orderId)).toEqual({ status: 'confirmed', has_confirmed_at: true });
    expect(await ticketsFor(order.orderId)).toBe(2);

    await asSuperuser(db);
    const inventory = await db.query<{ quantity_sold: number }>(
      `select quantity_sold from public.ticket_types where id = $1`,
      [free.id],
    );
    const payments = await db.query(`select id from public.payments where order_id = $1`, [order.orderId]);

    expect(inventory.rows[0].quantity_sold).toBe(free.quantity_sold + 2);
    expect(payments.rows).toHaveLength(0);
  });

  it('confirma un pago DEMO aprobado con su pago registrado y los boletos', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 2 }]);

    const result = await confirm(order, {
      outcome: 'demo_approved',
      key: 'demo-approved-0001',
      qrHashes: qrHashesFor(2),
    });

    expect(result.rows[0]).toEqual({
      result_order_id: order.orderId,
      result_status: 'confirmed',
      result_ticket_count: 2,
      result_already_processed: false,
    });

    await asSuperuser(db);
    const payments = await db.query<{ status: string; amount_cents: number }>(
      `select status, amount_cents from public.payments where order_id = $1`,
      [order.orderId],
    );
    const inventory = await db.query<{ quantity_sold: number }>(
      `select quantity_sold from public.ticket_types where id = $1`,
      [general.id],
    );

    expect(payments.rows).toEqual([{ status: 'demo_approved', amount_cents: 2100 }]);
    expect(inventory.rows[0].quantity_sold).toBe(general.quantity_sold + 2);
    expect(await ticketsFor(order.orderId)).toBe(2);
  });

  it('un pago DEMO rechazado deja la orden fallida, sin boletos y con el cupo intacto', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);
    const before = await snapshot();

    const result = await confirm(order, { outcome: 'demo_rejected', key: 'demo-rejected-0001' });

    expect(result.rows[0]).toEqual({
      result_order_id: order.orderId,
      result_status: 'failed',
      result_ticket_count: 0,
      result_already_processed: false,
    });
    expect(await orderStatus(order.orderId)).toEqual({ status: 'failed', has_confirmed_at: false });

    await asSuperuser(db);
    const payments = await db.query<{ status: string; amount_cents: number }>(
      `select status, amount_cents from public.payments where order_id = $1`,
      [order.orderId],
    );
    const inventory = await db.query<{ quantity_sold: number }>(
      `select quantity_sold from public.ticket_types where id = $1`,
      [general.id],
    );
    const after = await snapshot();

    expect(payments.rows).toEqual([{ status: 'demo_rejected', amount_cents: 1050 }]);
    expect(inventory.rows[0].quantity_sold).toBe(general.quantity_sold);
    expect(after.tickets).toBe(before.tickets);
    expect(after.confirmed).toBe(before.confirmed);
  });

  it('un doble clic o reintento no emite boletos ni descuenta cupo otra vez', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 2 }]);

    const first = await confirm(order, {
      outcome: 'demo_approved',
      key: 'demo-retry-0001',
      qrHashes: qrHashesFor(2),
    });
    const second = await confirm(order, {
      outcome: 'demo_approved',
      key: 'demo-retry-0001',
      qrHashes: qrHashesFor(2),
    });
    const third = await confirm(order, {
      outcome: 'demo_approved',
      key: 'demo-retry-0002',
      qrHashes: qrHashesFor(2),
    });

    expect(first.rows[0].result_already_processed).toBe(false);
    expect(second.rows[0]).toEqual({
      result_order_id: order.orderId,
      result_status: 'confirmed',
      result_ticket_count: 2,
      result_already_processed: true,
    });
    expect(third.rows[0].result_already_processed).toBe(true);
    expect(await ticketsFor(order.orderId)).toBe(2);

    await asSuperuser(db);
    const inventory = await db.query<{ quantity_sold: number }>(
      `select quantity_sold from public.ticket_types where id = $1`,
      [general.id],
    );
    const payments = await db.query(`select id from public.payments where order_id = $1`, [order.orderId]);

    expect(inventory.rows[0].quantity_sold).toBe(general.quantity_sold + 2);
    expect(payments.rows).toHaveLength(1);
  });

  it('una orden fallida no se puede aprobar después', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);
    await confirm(order, { outcome: 'demo_rejected', key: 'demo-reject-0003' });

    const retry = await confirm(order, {
      outcome: 'demo_approved',
      key: 'demo-approve-0003',
      qrHashes: qrHashesFor(1),
    });

    expect(retry.rows[0]).toEqual({
      result_order_id: order.orderId,
      result_status: 'failed',
      result_ticket_count: 0,
      result_already_processed: true,
    });
    expect(await ticketsFor(order.orderId)).toBe(0);
  });

  it('rechaza un token incorrecto sin revelar si la orden existe y sin cambiar nada', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);
    const before = await snapshot();

    await expect(
      confirm(order, {
        outcome: 'demo_approved',
        key: 'demo-wrong-token-01',
        qrHashes: qrHashesFor(1),
        publicTokenHash: 'f'.repeat(64),
      }),
    ).rejects.toThrow(/no existe o el token no coincide/);

    await expect(
      confirm({ orderId: '00000000-0000-4000-8000-000000000000', publicTokenHash: order.publicTokenHash }, {
        outcome: 'demo_approved',
        key: 'demo-missing-order-1',
        qrHashes: qrHashesFor(1),
      }),
    ).rejects.toThrow(/no existe o el token no coincide/);

    expect(await orderStatus(order.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
    expect(await snapshot()).toEqual(before);
  });

  it('no vende más cupo del disponible: la segunda orden falla y queda pendiente', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    await asSuperuser(db);
    await db.query(
      `update public.ticket_types set quantity_total = quantity_sold + 1 where id = $1`,
      [general.id],
    );

    const first = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);
    const second = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);

    await confirm(first, { outcome: 'demo_approved', key: 'demo-last-seat-01', qrHashes: qrHashesFor(1) });

    await expect(
      confirm(second, { outcome: 'demo_approved', key: 'demo-last-seat-02', qrHashes: qrHashesFor(1) }),
    ).rejects.toThrow(/cupos disponibles/);

    expect(await orderStatus(second.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
    expect(await ticketsFor(second.orderId)).toBe(0);

    await asSuperuser(db);
    const inventory = await db.query<{ quantity_sold: number; quantity_total: number }>(
      `select quantity_sold, quantity_total from public.ticket_types where id = $1`,
      [general.id],
    );
    expect(inventory.rows[0].quantity_sold).toBe(1);
    expect(inventory.rows[0].quantity_total).toBe(1);
  });

  it('rechaza un tipo que se desactivó después de crear la orden, sin cambios', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);
    await asSuperuser(db);
    await db.query(`update public.ticket_types set is_active = false where id = $1`, [general.id]);
    const before = await snapshot();

    await expect(
      confirm(order, { outcome: 'demo_approved', key: 'demo-inactive-01', qrHashes: qrHashesFor(1) }),
    ).rejects.toThrow(/no está disponible/);

    expect(await orderStatus(order.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
    expect(await snapshot()).toEqual(before);
  });

  it('rechaza confirmar cuando el evento ya no está publicado', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);
    await asSuperuser(db);
    await db.query(`update public.events set status = 'archived' where slug = 'congreso-demo-ia'`);

    await expect(
      confirm(order, { outcome: 'demo_approved', key: 'demo-archived-01', qrHashes: qrHashesFor(1) }),
    ).rejects.toThrow(/ya no está disponible/);

    expect(await orderStatus(order.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
  });

  it('rechaza un resultado de pago que no corresponde al importe de la orden', async () => {
    const free = await ticket('hackathon-demo-en-linea', 'Registro gratuito');
    const general = await ticket('congreso-demo-ia', 'General');
    const freeOrder = await createPendingOrder('hackathon-demo-en-linea', [
      { ticketTypeId: free.id, quantity: 1 },
    ]);
    const paidOrder = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);

    await expect(
      confirm(paidOrder, { outcome: 'free', qrHashes: qrHashesFor(1) }),
    ).rejects.toThrow(/requiere pago/);
    await expect(
      confirm(freeOrder, { outcome: 'demo_approved', key: 'demo-free-mismatch', qrHashes: qrHashesFor(1) }),
    ).rejects.toThrow(/no requiere pago/);

    expect(await orderStatus(paidOrder.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
    expect(await orderStatus(freeOrder.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
  });

  it('rechaza una cantidad de hashes QR distinta de los boletos comprados, sin cambios', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 2 }]);
    const before = await snapshot();

    await expect(
      confirm(order, { outcome: 'demo_approved', key: 'demo-count-mismatch', qrHashes: qrHashesFor(1) }),
    ).rejects.toThrow(/cantidad de boletos/);

    expect(await orderStatus(order.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
    expect(await snapshot()).toEqual(before);
  });

  it('rechaza hashes QR con formato inválido', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);

    await expect(
      confirm(order, { outcome: 'demo_approved', key: 'demo-bad-qr-hash', qrHashes: ['qr-en-claro'] }),
    ).rejects.toThrow(/código QR/);

    expect(await orderStatus(order.orderId)).toEqual({ status: 'pending', has_confirmed_at: false });
  });

  it('solo permite invocar la RPC al rol de servidor', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const order = await createPendingOrder('congreso-demo-ia', [{ ticketTypeId: general.id, quantity: 1 }]);

    for (const role of ['anon', 'authenticated'] as const) {
      await asRole(db, role);
      await expect(
        db.query(`select * from public.confirm_order($1, $2, $3, $4, $5::jsonb)`, [
          order.orderId,
          order.publicTokenHash,
          'demo_approved',
          'demo-permission-01',
          JSON.stringify(qrHashesFor(1)),
        ]),
      ).rejects.toThrow(/permission denied/);
    }
  });
});
