import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

/**
 * Destacados y paquete empresas con Wompi (decisión D-68): la compra nace en espera de pago y el webhook la liquida
 * con la transacción verificada. La simulación ya no puede ejecutarse desde el navegador.
 */

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
}, 60_000);

afterEach(async () => {
  await db.close();
});

async function configure(admin: string) {
  await asRole(db, 'authenticated', admin);
  await db.query(`select public.admin_set_setting('featured_daily_rate_cents', $1::jsonb)`, [JSON.stringify(200)]);
  await db.query(`select public.admin_set_setting('package_annual_price_cents', $1::jsonb)`, [JSON.stringify(500000)]);
}

async function publishedEvent(owner: string, slug: string) {
  const organizer = await createOrganizer(db, owner, `org-${slug}`);
  const event = await createEvent(db, organizer, { slug, status: 'published' });
  return { organizer, event };
}

describe('destacado con Wompi', () => {
  it('el organizador inicia la compra: queda en espera de pago con su total', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    await configure(admin);
    const { event } = await publishedEvent(owner, 'wompi-destacado');

    await asRole(db, 'authenticated', owner);
    const started = await db.query<{ placement_id: string; total_cents: number; event_title: string }>(
      `select * from public.start_paid_featured($1, current_date + 1, 7)`,
      [event],
    );
    expect(started.rows[0].total_cents).toBe(1400);

    await asSuperuser(db);
    const row = await db.query<{ status: string; total_cents: number }>(
      `select status, total_cents from public.featured_placements where id = $1`,
      [started.rows[0].placement_id],
    );
    expect(row.rows[0]).toEqual({ status: 'awaiting_payment', total_cents: 1400 });
  });

  it('rechaza días fuera de 1 a 30 y eventos ajenos', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const other = await createUser(db, 'organizer');
    await configure(admin);
    const { event } = await publishedEvent(owner, 'wompi-validaciones');

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select * from public.start_paid_featured($1, current_date + 1, 0)`, [event])).rejects.toThrow(/entre 1 y 30/);

    await asRole(db, 'authenticated', other);
    await expect(db.query(`select * from public.start_paid_featured($1, current_date + 1, 1)`, [event])).rejects.toThrow(/propio/);
  });

  it('el pago aprobado pasa a pending para revisión del administrador, y repetirlo no cambia nada', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    await configure(admin);
    const { event } = await publishedEvent(owner, 'wompi-liquida');

    await asRole(db, 'authenticated', owner);
    const started = await db.query<{ placement_id: string }>(`select placement_id from public.start_paid_featured($1, current_date + 1, 2)`, [event]);
    const id = started.rows[0].placement_id;

    await asRole(db, 'service_role');
    expect((await db.query<{ r: string }>(`select public.settle_featured_payment($1, 'tx-dest-1') as r`, [id])).rows[0].r).toBe('settled');
    expect((await db.query<{ r: string }>(`select public.settle_featured_payment($1, 'tx-dest-1') as r`, [id])).rows[0].r).toBe('already_settled');

    await asSuperuser(db);
    const row = await db.query<{ status: string; provider_transaction_id: string }>(
      `select status, provider_transaction_id from public.featured_placements where id = $1`,
      [id],
    );
    expect(row.rows[0]).toEqual({ status: 'pending', provider_transaction_id: 'tx-dest-1' });
  });

  it('no liquida un destacado que ya no espera pago', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    await configure(admin);
    const { event } = await publishedEvent(owner, 'wompi-no-espera');

    await asRole(db, 'authenticated', owner);
    const started = await db.query<{ placement_id: string }>(`select placement_id from public.start_paid_featured($1, current_date + 1, 1)`, [event]);

    await asSuperuser(db);
    await db.query(`update public.featured_placements set status = 'cancelled' where id = $1`, [started.rows[0].placement_id]);

    await asRole(db, 'service_role');
    await expect(
      db.query(`select public.settle_featured_payment($1, 'tx-tarde')`, [started.rows[0].placement_id]),
    ).rejects.toThrow(/no espera pago/);
  });
});

describe('paquete empresas con Wompi', () => {
  it('el paquete queda en espera y el pago aprobado lo activa con sus beneficios', async () => {
    const owner = await createUser(db, 'organizer');
    const admin = await createUser(db, 'admin');
    await configure(admin);
    const organizer = await createOrganizer(db, owner, 'org-paquete-wompi');

    await asRole(db, 'authenticated', owner);
    const started = await db.query<{ package_id: string; price_cents: number }>(
      `select * from public.start_package_purchase($1)`,
      [organizer],
    );
    expect(started.rows[0].price_cents).toBe(500000);

    await asRole(db, 'service_role');
    await db.query(`select public.settle_package_payment($1, 'tx-paq-1')`, [started.rows[0].package_id]);

    await asSuperuser(db);
    const row = await db.query<{ status: string; events_remaining: number; featured_days_remaining: number }>(
      `select status, events_remaining, featured_days_remaining from public.business_packages where id = $1`,
      [started.rows[0].package_id],
    );
    expect(row.rows[0]).toEqual({ status: 'active', events_remaining: 10, featured_days_remaining: 30 });
  });

  it('no deja activar un segundo paquete cuando ya hay uno activo', async () => {
    const owner = await createUser(db, 'organizer');
    const admin = await createUser(db, 'admin');
    await configure(admin);
    const organizer = await createOrganizer(db, owner, 'org-paquete-doble');

    await asRole(db, 'authenticated', owner);
    const first = await db.query<{ package_id: string }>(`select package_id from public.start_package_purchase($1)`, [organizer]);
    const second = await db.query<{ package_id: string }>(`select package_id from public.start_package_purchase($1)`, [organizer]);

    await asRole(db, 'service_role');
    await db.query(`select public.settle_package_payment($1, 'tx-doble-1')`, [first.rows[0].package_id]);
    await expect(
      db.query(`select public.settle_package_payment($1, 'tx-doble-2')`, [second.rows[0].package_id]),
    ).rejects.toThrow(/activo/);
  });
});

describe('la simulación ya no es ejecutable por usuarios', () => {
  it('authenticated no puede aprobar destacados ni paquetes con la función simulada', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    await configure(admin);
    const { event } = await publishedEvent(owner, 'wompi-sin-simulacion');
    const organizer = await createOrganizer(db, owner, 'org-sin-simulacion');

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.request_paid_featured($1, current_date + 1, 1, 'approved')`, [event])).rejects.toThrow(/permission denied/);
    await expect(db.query(`select public.purchase_business_package($1, 'approved')`, [organizer])).rejects.toThrow(/permission denied/);
  });

  it('solo el servidor puede liquidar', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    await configure(admin);
    const { event } = await publishedEvent(owner, 'wompi-solo-servidor');

    await asRole(db, 'authenticated', owner);
    const started = await db.query<{ placement_id: string }>(`select placement_id from public.start_paid_featured($1, current_date + 1, 1)`, [event]);

    await expect(
      db.query(`select public.settle_featured_payment($1, 'tx-usuario')`, [started.rows[0].placement_id]),
    ).rejects.toThrow(/permission denied/);
  });
});
