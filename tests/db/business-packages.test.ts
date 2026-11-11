import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

let db: PGlite;
let txSeed = 0;
const benefits = { eventsIncluded: 10, featuredDaysIncluded: 30, featuredDiscountPercent: 50, personalizedFollowUp: true, advancedReport: true };

beforeEach(async () => { db = await createDatabase(); }, 60_000);
afterEach(async () => { await db.close(); });

async function configure(admin: string, price = 120000, packageBenefits = benefits) {
  await asRole(db, 'authenticated', admin);
  await db.query(`select public.admin_set_setting('package_annual_price_cents', $1::jsonb)`, [JSON.stringify(price)]);
  await db.query(`select public.admin_set_setting('featured_daily_rate_cents', '200'::jsonb)`);
  await db.query(`select public.admin_set_setting('package_benefits', $1::jsonb)`, [JSON.stringify(packageBenefits)]);
}

async function organizerFor(owner: string, slug: string) {
  return createOrganizer(db, owner, slug);
}

/** El organizador inicia la compra del paquete; si `approve`, el servidor la liquida con Wompi aprobado. */
async function buyPackage(owner: string, organizer: string, approve = true): Promise<string> {
  await asRole(db, 'authenticated', owner);
  const started = await db.query<{ package_id: string }>(`select package_id from public.start_package_purchase($1)`, [organizer]);
  if (approve) {
    txSeed += 1;
    await asRole(db, 'service_role');
    await db.query(`select public.settle_package_payment($1, $2)`, [started.rows[0].package_id, `tx-pkg-${txSeed}`]);
  }
  return started.rows[0].package_id;
}

/** Inicia un destacado del organizador y, si `approve`, lo liquida (descuenta los días gratis del paquete). */
async function featureEvent(owner: string, event: string, days: number, approve = true): Promise<string> {
  await asRole(db, 'authenticated', owner);
  const started = await db.query<{ placement_id: string }>(
    `select placement_id from public.start_paid_featured($1, current_date, $2)`,
    [event, days],
  );
  if (approve) {
    txSeed += 1;
    await asRole(db, 'service_role');
    await db.query(`select public.settle_featured_payment($1, $2)`, [started.rows[0].placement_id, `tx-feat-pkg-${txSeed}`]);
  }
  return started.rows[0].placement_id;
}

describe('business_packages', () => {
  it('compra aprobada crea un paquete activo con días y eventos del beneficio', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-aprobado');
    await configure(admin);

    const id = await buyPackage(owner, organizer);

    await asSuperuser(db);
    const rows = await db.query(
      `select organizer_id, price_cents, featured_days_remaining, events_remaining, status from public.business_packages where id = $1`,
      [id],
    );
    expect(rows.rows).toEqual([{ organizer_id: organizer, price_cents: 120000, featured_days_remaining: 30, events_remaining: 10, status: 'active' }]);
  });

  it('una compra sin pago aprobado queda en espera y no activa beneficios', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-espera');
    await configure(admin);

    await buyPackage(owner, organizer, false);

    await asSuperuser(db);
    const rows = await db.query(`select status, featured_days_remaining, events_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(rows.rows).toEqual([{ status: 'awaiting_payment', featured_days_remaining: 0, events_remaining: 0 }]);
  });

  it('sin precio configurado falla', async () => {
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-sin-precio');
    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.start_package_purchase($1)`, [organizer])).rejects.toThrow(/precio/i);
  });

  it('no se puede tener dos paquetes activos', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-duplicado');
    await configure(admin);
    await buyPackage(owner, organizer);

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.start_package_purchase($1)`, [organizer])).rejects.toThrow(/activo/i);
  });

  it('otro usuario no compra para un organizador ajeno', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const other = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-ajeno');
    await configure(admin);
    await asRole(db, 'authenticated', other);
    await expect(db.query(`select public.start_package_purchase($1)`, [organizer])).rejects.toThrow(/propio|organizador|permiso/i);
  });

  it('un destacado con paquete usa días gratis y luego descuento, y los días se gastan al aprobar', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-destacado');
    const event = await createEvent(db, organizer, { slug: 'paquete-destacado-evento', status: 'published' });
    await configure(admin, 120000, { ...benefits, featuredDaysIncluded: 3 });
    await buyPackage(owner, organizer);

    const placementId = await featureEvent(owner, event, 7);

    await asSuperuser(db);
    const placement = await db.query(`select free_days, total_cents, status from public.featured_placements where id = $1`, [placementId]);
    const remaining = await db.query(`select featured_days_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(placement.rows).toEqual([{ free_days: 3, total_cents: 400, status: 'pending' }]);
    expect(remaining.rows).toEqual([{ featured_days_remaining: 0 }]);
  });

  it('un destacado cubierto por completo por el paquete no pasa por pago y queda pendiente de revisión', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-gratis');
    const event = await createEvent(db, organizer, { slug: 'paquete-gratis-evento', status: 'published' });
    await configure(admin, 120000, { ...benefits, featuredDaysIncluded: 10, featuredDiscountPercent: 100 });
    await buyPackage(owner, organizer);

    const placementId = await featureEvent(owner, event, 2, false);

    await asSuperuser(db);
    const placement = await db.query(`select status, total_cents from public.featured_placements where id = $1`, [placementId]);
    const remaining = await db.query(`select featured_days_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(placement.rows).toEqual([{ status: 'pending', total_cents: 0 }]);
    expect(remaining.rows).toEqual([{ featured_days_remaining: 8 }]);
  });

  it('un destacado que no se paga no consume días gratis', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-no-pagado');
    const event = await createEvent(db, organizer, { slug: 'paquete-no-pagado-evento', status: 'published' });
    // Con 3 días incluidos, un destacado de 7 días deja 4 días a pagar: hay pago pendiente y no se gasta nada.
    await configure(admin, 120000, { ...benefits, featuredDaysIncluded: 3 });
    await buyPackage(owner, organizer);

    await featureEvent(owner, event, 7, false);

    await asSuperuser(db);
    const remaining = await db.query(`select featured_days_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(remaining.rows).toEqual([{ featured_days_remaining: 3 }]);
  });

  it('solo el dueño pide seguimiento y solo el admin lo contesta', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const other = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-seguimiento');
    await configure(admin);
    const packageId = await buyPackage(owner, organizer);

    await asRole(db, 'authenticated', owner);
    const request = await db.query<{ id: string }>(`select public.request_package_followup($1, 'Necesito ayuda con mi paquete.') as id`, [packageId]);
    await asRole(db, 'authenticated', other);
    await expect(db.query(`select public.request_package_followup($1, 'Mensaje ajeno')`, [packageId])).rejects.toThrow(/propio|paquete|permiso/i);
    await expect(db.query(`select public.answer_package_followup($1)`, [request.rows[0].id])).rejects.toThrow(/administrador/i);
    await asRole(db, 'authenticated', admin);
    await db.query(`select public.answer_package_followup($1)`, [request.rows[0].id]);
    await asSuperuser(db);
    const rows = await db.query(`select status from public.package_followup_requests where id = $1`, [request.rows[0].id]);
    expect(rows.rows).toEqual([{ status: 'answered' }]);
  });
});
