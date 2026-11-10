import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

let db: PGlite;

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

describe('featured_placements', () => {
  it('un organizador destaca su evento publicado y queda pending', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-pending');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    const result = await db.query<{ id: string }>(
      `select public.request_paid_featured($1, current_date + 1, 7, 'approved') as id`,
      [event],
    );

    await asSuperuser(db);
    const rows = await db.query(
      `select event_id, source, status, days, daily_rate_cents, total_cents, requested_by
         from public.featured_placements where id = $1`,
      [result.rows[0].id],
    );
    expect(rows.rows).toEqual([
      {
        event_id: event,
        source: 'paid',
        status: 'pending',
        days: 7,
        daily_rate_cents: 200,
        total_cents: 1400,
        requested_by: owner,
      },
    ]);
  });

  it('no puede destacar un evento ajeno', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const other = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(other, 'destacado-ajeno');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.request_paid_featured($1, current_date + 1, 7, 'approved')`, [event]),
    ).rejects.toThrow(/propio|organizador|permiso/i);
  });

  it('0 y 31 días se rechazan', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-rango');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.request_paid_featured($1, current_date + 1, 0, 'approved')`, [event]),
    ).rejects.toThrow(/días/i);
    await expect(
      db.query(`select public.request_paid_featured($1, current_date + 1, 31, 'approved')`, [event]),
    ).rejects.toThrow(/días/i);
  });

  it('fecha de inicio pasada se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-pasado');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.request_paid_featured($1, current_date - 1, 1, 'approved')`, [event]),
    ).rejects.toThrow(/fecha/i);
  });

  it('evento no publicado se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-borrador', 'pending');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.request_paid_featured($1, current_date + 1, 1, 'approved')`, [event]),
    ).rejects.toThrow(/publicado/i);
  });

  it('sin tarifa configurada falla', async () => {
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-sin-tarifa');

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.request_paid_featured($1, current_date + 1, 1, 'approved')`, [event]),
    ).rejects.toThrow(/tarifa/i);
  });

  it('pago rechazado deja payment_failed', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-rechazado');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    await db.query(`select public.request_paid_featured($1, current_date + 1, 7, 'rejected')`, [event]);

    await asSuperuser(db);
    const rows = await db.query<{ status: string; total_cents: number }>(
      `select status, total_cents from public.featured_placements where event_id = $1`,
      [event],
    );
    expect(rows.rows).toEqual([{ status: 'payment_failed', total_cents: 1400 }]);
    await asRole(db, 'anon');
    const publicRows = await db.query(`select id from public.featured_placements where event_id = $1`, [event]);
    expect(publicRows.rows).toHaveLength(0);
  });

  it('solo el administrador aprueba y crea manuales', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const { event } = await ownedPublishedEvent(owner, 'destacado-admin');
    await setRate(admin);

    await asRole(db, 'authenticated', owner);
    const pending = await db.query<{ id: string }>(
      `select public.request_paid_featured($1, current_date + 1, 1, 'approved') as id`,
      [event],
    );
    await expect(db.query(`select public.admin_review_featured($1, 'approved')`, [pending.rows[0].id])).rejects.toThrow(
      /administrador/i,
    );

    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_review_featured($1, 'approved')`, [pending.rows[0].id]);
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
    await asRole(db, 'authenticated', owner);
    await db.query(`select public.request_paid_featured($1, current_date, 2, 'approved')`, [first.event]);
    await db.query(`select public.request_paid_featured($1, current_date, 1, 'approved')`, [second.event]);
    await asSuperuser(db);
    const paid = await db.query<{ id: string }>(
      `select id from public.featured_placements where event_id = $1 and source = 'paid'`,
      [second.event],
    );
    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_review_featured($1, 'approved')`, [paid.rows[0].id]);

    await asRole(db, 'anon');
    const rows = await db.query<{ event_id: string; source: string }>(
      `select event_id, source from public.active_featured(4)`,
    );
    expect(rows.rows).toEqual([
      { event_id: first.event, source: 'manual' },
      { event_id: second.event, source: 'paid' },
    ]);
  });

  it('active_featured filtra por tipo de evento', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const congresos = await ownedPublishedEvent(owner, 'destacado-tipo-congreso');
    const competencias = await ownedPublishedEvent(owner, 'destacado-tipo-competencia');
    await asSuperuser(db);
    await db.query(
      `update public.events set event_type_id = (select id from public.categories where kind = 'event_type' and slug = 'competencias')
       where id = $1`,
      [competencias.event],
    );
    await setRate(admin);
    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_create_manual_featured($1, current_date, current_date + 1)`, [congresos.event]);
    await db.query(`select public.admin_create_manual_featured($1, current_date, current_date + 1)`, [competencias.event]);

    await asRole(db, 'anon');
    const typeId = await db.query<{ id: string }>(
      `select id from public.categories where kind = 'event_type' and slug = 'competencias'`,
    );
    const rows = await db.query<{ event_id: string }>(`select event_id from public.active_featured(4, $1)`, [typeId.rows[0].id]);
    expect(rows.rows).toEqual([{ event_id: competencias.event }]);
  });

  it('retira la tabla event_featured y conserva destacados en la tabla nueva', async () => {
    await asSuperuser(db);
    await expect(db.query(`select 1 from public.event_featured`)).rejects.toThrow(/does not exist|no existe/i);
    const rows = await db.query(`select 1 from public.featured_placements`);
    expect(rows.rows).toEqual([]);
  });
});
