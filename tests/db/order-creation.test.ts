import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase } from './helpers';

type TicketRow = {
  id: string;
  price_cents: number;
  quantity_sold: number;
};

let db: PGlite;

async function ticket(eventSlug: string, name: string): Promise<TicketRow> {
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
  const result = await db.query<{ id: string }>(`select id from public.events where slug = $1`, [slug]);
  return result.rows[0].id;
}

async function createPendingOrderForEvent(
  eventSlug: string,
  items: Array<{ ticketTypeId: string; quantity: number }>,
) {
  const event = await eventId(eventSlug);
  await asRole(db, 'service_role');

  return db.query<{ order_id: string; subtotal_cents: number; fee_cents: number; total_cents: number }>(
    `select * from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6)`,
    [event, JSON.stringify(items), 'Comprador DEMO', 'comprador@example.test', 'a'.repeat(64), 5],
  );
}

async function createPendingOrder(items: Array<{ ticketTypeId: string; quantity: number }>) {
  return createPendingOrderForEvent('congreso-demo-ia', items);
}

async function orderCounts() {
  await asSuperuser(db);
  const result = await db.query<{ orders: number; items: number }>(
    `select
       (select count(*)::int from public.orders) as orders,
       (select count(*)::int from public.order_items) as items`,
  );

  return result.rows[0];
}

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('create_pending_order', () => {
  it('guarda precios recalculados y una orden pendiente sin consumir inventario', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const premium = await ticket('congreso-demo-ia', 'Premium');

    const result = await createPendingOrder([
      { ticketTypeId: general.id, quantity: 2 },
      { ticketTypeId: premium.id, quantity: 1 },
    ]);

    expect(result.rows[0]).toEqual({
      order_id: expect.any(String),
      subtotal_cents: 4500,
      fee_cents: 225,
      total_cents: 4725,
    });

    await asSuperuser(db);
    const order = await db.query<{ status: string; subtotal_cents: number; fee_cents: number; total_cents: number }>(
      `select status, subtotal_cents, fee_cents, total_cents from public.orders where id = $1`,
      [result.rows[0].order_id],
    );
    const items = await db.query<{ unit_price_cents: number; quantity: number; line_total_cents: number }>(
      `select unit_price_cents, quantity, line_total_cents
         from public.order_items
        where order_id = $1
        order by unit_price_cents`,
      [result.rows[0].order_id],
    );
    const inventory = await db.query<{ id: string; quantity_sold: number }>(
      `select id, quantity_sold from public.ticket_types where id in ($1, $2) order by id`,
      [general.id, premium.id],
    );

    expect(order.rows).toEqual([{ status: 'pending', subtotal_cents: 4500, fee_cents: 225, total_cents: 4725 }]);
    expect(items.rows).toEqual([
      { unit_price_cents: 1000, quantity: 2, line_total_cents: 2000 },
      { unit_price_cents: 2500, quantity: 1, line_total_cents: 2500 },
    ]);
    expect(inventory.rows).toEqual(
      expect.arrayContaining([
        { id: general.id, quantity_sold: general.quantity_sold },
        { id: premium.id, quantity_sold: premium.quantity_sold },
      ]),
    );
  });

  it('solo permite invocar la RPC al rol de servidor', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    const event = await eventId('congreso-demo-ia');
    await asRole(db, 'anon');

    await expect(
      db.query(`select * from public.create_pending_order($1, $2::jsonb, $3, $4, $5, $6)`, [
        event,
        JSON.stringify([{ ticketTypeId: general.id, quantity: 1 }]),
        'Comprador DEMO',
        'comprador@example.test',
        'b'.repeat(64),
        5,
      ]),
    ).rejects.toThrow(/permission denied/);
  });

  it('revierte la creación cuando la selección excede el máximo por orden', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    await asSuperuser(db);
    const before = await db.query<{ total: number }>(`select count(*)::int as total from public.orders`);

    await expect(createPendingOrder([{ ticketTypeId: general.id, quantity: 5 }])).rejects.toThrow(
      /máximo permitido/i,
    );

    await asSuperuser(db);
    const after = await db.query<{ total: number }>(`select count(*)::int as total from public.orders`);
    expect(after.rows[0].total).toBe(before.rows[0].total);
  });

  it('rechaza un tipo de entrada de otro evento sin persistir filas', async () => {
    const otherEventTicket = await ticket('hackathon-demo-en-linea', 'Registro gratuito');
    const before = await orderCounts();

    await expect(createPendingOrder([{ ticketTypeId: otherEventTicket.id, quantity: 1 }])).rejects.toThrow(
      /no está disponible/i,
    );

    expect(await orderCounts()).toEqual(before);
  });

  it('rechaza un tipo inactivo sin persistir filas', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    await asSuperuser(db);
    await db.query(`update public.ticket_types set is_active = false where id = $1`, [general.id]);
    const before = await orderCounts();

    await expect(createPendingOrder([{ ticketTypeId: general.id, quantity: 1 }])).rejects.toThrow(
      /no está disponible/i,
    );

    expect(await orderCounts()).toEqual(before);
  });

  it('rechaza un tipo agotado sin persistir filas', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    await asSuperuser(db);
    await db.query(`update public.ticket_types set quantity_sold = quantity_total where id = $1`, [general.id]);
    const before = await orderCounts();

    await expect(createPendingOrder([{ ticketTypeId: general.id, quantity: 1 }])).rejects.toThrow(
      /cupos disponibles/i,
    );

    expect(await orderCounts()).toEqual(before);
  });

  it('usa el precio validado para el snapshot aunque cambie antes de insertar las líneas', async () => {
    const general = await ticket('congreso-demo-ia', 'General');
    await asSuperuser(db);
    await db.exec(`
      create or replace function public.test_bump_ticket_prices()
      returns trigger
      language plpgsql
      as $$
      begin
        update public.ticket_types
           set price_cents = price_cents + 100
         where event_id = new.event_id;
        return new;
      end;
      $$;

      create trigger test_bump_ticket_prices_before_order
      before insert on public.orders
      for each row execute function public.test_bump_ticket_prices();
    `);

    const result = await createPendingOrder([{ ticketTypeId: general.id, quantity: 1 }]);

    await asSuperuser(db);
    const items = await db.query<{ unit_price_cents: number; line_total_cents: number }>(
      `select unit_price_cents, line_total_cents from public.order_items where order_id = $1`,
      [result.rows[0].order_id],
    );

    expect(items.rows).toEqual([{ unit_price_cents: general.price_cents, line_total_cents: general.price_cents }]);
  });
});
