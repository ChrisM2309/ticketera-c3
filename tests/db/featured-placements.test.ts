import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

let db: PGlite;
let txSeed = 0;

beforeEach(async () => {
  db = await createDatabase();
}, 60_000);

afterEach(async () => {
  await db.close();
});

async function setRate(admin: string, rate = 200) {
  await asRole(db, 'authenticated', admin);
  await db.query(`select public.admin_set_setting('featured_daily_rate_cents', $1::jsonb)`, [JSON.stringify(rate)]);
}

async function ownedPublishedEvent(owner: string, slug: string, status = 'published') {
  const organizer = await createOrganizer(db, owner, `org-${slug}`);
  const event = await createEvent(db, organizer, { slug, status });
  return { organizer, event };
}

/** El organizador inicia la compra (espera de pago) y el servidor la liquida como aprobada. */
async function requestPaid(owner: string, event: string, startsOn: string, days: number): Promise<string> {
  await asRole(db, 'authenticated', owner);
  const started = await db.query<{ placement_id: string }>(
    `select placement_id from public.start_paid_featured($1, $2::date, $3)`,
    [event, startsOn, days],
  );
  txSeed += 1;
  await asRole(db, 'service_role');
  await db.query(`select public.settle_featured_payment($1, $2)`, [started.rows[0].placement_id, `tx-feat-${txSeed}`]);
  return started.rows[0].placement_id;
}

describe('featured_placements', () => {
  it('un organizador inicia el destacado: queda en espera de pago y luego pending tras la aprobación', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-pending');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    const started = await db.query<{ placement_id: string }>(
      `select placement_id from public.start_paid_featured($1, current_date + 1, 7)`,
      [event],
    );

    await asSuperuser(db);
    const waiting = await db.query(
      `select event_id, source, status, days, daily_rate_cents, total_cents, requested_by
         from public.featured_placements where id = $1`,
      [started.rows[0].placement_id],
    );
    expect(waiting.rows).toEqual([
      {
        event_id: event,
        source: 'paid',
        status: 'awaiting_payment',
        days: 7,
        daily_rate_cents: 200,
        total_cents: 1400,
        requested_by: owner,
      },
    ]);

    await asRole(db, 'service_role');
    await db.query(`select public.settle_featured_payment($1, 'tx-pending-1')`, [started.rows[0].placement_id]);
    await asSuperuser(db);
    const approved = await db.query<{ status: string }>(
      `select status from public.featured_placements where id = $1`,
      [started.rows[0].placement_id],
    );
    expect(approved.rows[0].status).toBe('pending');
  });

  it('no puede destacar un evento ajeno', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const other = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(other, 'destacado-ajeno');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.start_paid_featured($1, current_date + 1, 7)`, [event]),
    ).rejects.toThrow(/propio|organizador|permiso/i);
  });

  it('0 y 31 días se rechazan', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-rango');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.start_paid_featured($1, current_date + 1, 0)`, [event])).rejects.toThrow(/días/i);
    await expect(db.query(`select public.start_paid_featured($1, current_date + 1, 31)`, [event])).rejects.toThrow(/días/i);
  });

  it('fecha de inicio pasada se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-pasado');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.start_paid_featured($1, current_date - 1, 1)`, [event])).rejects.toThrow(/fecha/i);
  });

  it('evento no publicado se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-borrador', 'pending');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.start_paid_featured($1, current_date + 1, 1)`, [event])).rejects.toThrow(/publicado/i);
  });

  it('sin tarifa configurada falla', async () => {
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-sin-tarifa');

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.start_paid_featured($1, current_date + 1, 1)`, [event])).rejects.toThrow(/tarifa/i);
  });

  it('sin pago aprobado el destacado queda en espera y no es público', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-sin-pago');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await db.query(`select public.start_paid_featured($1, current_date + 1, 7)`, [event]);

    await asSuperuser(db);
    const rows = await db.query<{ status: string; total_cents: number }>(
      `select status, total_cents from public.featured_placements where event_id = $1`,
      [event],
    );
    expect(rows.rows).toEqual([{ status: 'awaiting_payment', total_cents: 1400 }]);
    await asRole(db, 'anon');
    const publicRows = await db.query(`select id from public.featured_placements where event_id = $1`, [event]);
    expect(publicRows.rows).toHaveLength(0);
  });

  it('solo el administrador aprueba y crea manuales', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-admin');
    await setRate(admin);

    const pendingId = await requestPaid(owner, event, '2099-01-01', 1);
    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.admin_review_featured($1, 'approved')`, [pendingId])).rejects.toThrow(/administrador/i);

    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_review_featured($1, 'approved')`, [pendingId]);
    const manual = await db.query<{ id: string }>(
      `select public.admin_create_manual_featured($1, current_date + 2, current_date + 4) as id`,
      [event],
    );

    await asSuperuser(db);
    const rows = await db.query<{ source: string; status: string; daily_rate_cents: number | null; total_cents: number }>(
      `select source, status, daily_rate_cents, total_cents from public.featured_placements where id = $1`,
      [manual.rows[0].id],
    );
    expect(rows.rows).toEqual([{ source: 'manual', status: 'approved', daily_rate_cents: null, total_cents: 0 }]);
  });

  it('active_featured no repite un evento con dos filas y pone manuales primero', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const first = await ownedPublishedEvent(owner, 'destacado-activo-a');
    const second = await ownedPublishedEvent(owner, 'destacado-activo-b');
    await setRate(admin);

    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_create_manual_featured($1, current_date, current_date + 2)`, [first.event]);
    await requestPaid(owner, first.event, new Date().toISOString().slice(0, 10), 2);
    const paidId = await requestPaid(owner, second.event, new Date().toISOString().slice(0, 10), 1);
    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_review_featured($1, 'approved')`, [paidId]);

    await asRole(db, 'anon');
    const rows = await db.query<{ event_id: string; source: string }>(`select event_id, source from public.active_featured(4)`);
    expect(rows.rows).toEqual([
      { event_id: first.event, source: 'manual' },
      { event_id: second.event, source: 'paid' },
    ]);
  });
});
