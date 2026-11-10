import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createUser } from './helpers';

let db: PGlite;
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

describe('business_packages', () => {
  it('compra aprobada crea un paquete activo con días y eventos del beneficio', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizer = await organizerFor(owner, 'org-paquete-aprobado');
    await configure(admin);
    await asRole(db, 'authenticated', owner);
    const result = await db.query<{ id: string }>(`select public.purchase_business_package($1, 'approved') as id`, [organizer]);
    await asSuperuser(db);
    const rows = await db.query(`select organizer_id, price_cents, featured_days_remaining, events_remaining, status from public.business_packages where id = $1`, [result.rows[0].id]);
    expect(rows.rows).toEqual([{ organizer_id: organizer, price_cents: 120000, featured_days_remaining: 30, events_remaining: 10, status: 'active' }]);
  });

  it('compra rechazada deja payment_failed', async () => {
    const admin = await createUser(db, 'admin'); const owner = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-rechazado');
    await configure(admin); await asRole(db, 'authenticated', owner);
    await db.query(`select public.purchase_business_package($1, 'rejected')`, [organizer]);
    await asSuperuser(db);
    const rows = await db.query(`select status, featured_days_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(rows.rows).toEqual([{ status: 'payment_failed', featured_days_remaining: 0 }]);
  });

  it('sin precio configurado falla', async () => {
    const owner = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-sin-precio');
    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.purchase_business_package($1, 'approved')`, [organizer])).rejects.toThrow(/precio/i);
  });

  it('no se puede tener dos paquetes activos', async () => {
    const admin = await createUser(db, 'admin'); const owner = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-duplicado');
    await configure(admin); await asRole(db, 'authenticated', owner);
    await db.query(`select public.purchase_business_package($1, 'approved')`, [organizer]);
    await expect(db.query(`select public.purchase_business_package($1, 'approved')`, [organizer])).rejects.toThrow(/activo/i);
  });

  it('otro usuario no compra para un organizador ajeno', async () => {
    const admin = await createUser(db, 'admin'); const owner = await createUser(db, 'organizer'); const other = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-ajeno');
    await configure(admin); await asRole(db, 'authenticated', other);
    await expect(db.query(`select public.purchase_business_package($1, 'approved')`, [organizer])).rejects.toThrow(/propio|organizador|permiso/i);
  });

  it('un destacado con paquete usa días gratis y luego descuento', async () => {
    const admin = await createUser(db, 'admin'); const owner = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-destacado'); const event = await createEvent(db, organizer, { slug: 'paquete-destacado-evento', status: 'published' });
    await configure(admin, 120000, { ...benefits, featuredDaysIncluded: 3 }); await asRole(db, 'authenticated', owner);
    await db.query(`select public.purchase_business_package($1, 'approved')`, [organizer]);
    await db.query(`select public.request_paid_featured($1, current_date, 7, 'approved')`, [event]);
    await asSuperuser(db);
    const placement = await db.query(`select free_days, total_cents from public.featured_placements where event_id = $1`, [event]);
    const remaining = await db.query(`select featured_days_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(placement.rows).toEqual([{ free_days: 3, total_cents: 400 }]);
    expect(remaining.rows).toEqual([{ featured_days_remaining: 0 }]);
  });

  it('un destacado rechazado no consume días gratis', async () => {
    const admin = await createUser(db, 'admin'); const owner = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-rechazado-destacado'); const event = await createEvent(db, organizer, { slug: 'paquete-rechazado-evento', status: 'published' });
    await configure(admin); await asRole(db, 'authenticated', owner);
    await db.query(`select public.purchase_business_package($1, 'approved')`, [organizer]);
    await db.query(`select public.request_paid_featured($1, current_date, 7, 'rejected')`, [event]);
    await asSuperuser(db);
    const remaining = await db.query(`select featured_days_remaining from public.business_packages where organizer_id = $1`, [organizer]);
    expect(remaining.rows).toEqual([{ featured_days_remaining: 30 }]);
  });

  it('solo el dueño pide seguimiento y solo el admin lo contesta', async () => {
    const admin = await createUser(db, 'admin'); const owner = await createUser(db, 'organizer'); const other = await createUser(db, 'organizer'); const organizer = await organizerFor(owner, 'org-paquete-seguimiento');
    await configure(admin); await asRole(db, 'authenticated', owner);
    const packageResult = await db.query<{ id: string }>(`select public.purchase_business_package($1, 'approved') as id`, [organizer]);
    const request = await db.query<{ id: string }>(`select public.request_package_followup($1, 'Necesito ayuda con mi paquete.') as id`, [packageResult.rows[0].id]);
    await asRole(db, 'authenticated', other);
    await expect(db.query(`select public.request_package_followup($1, 'Mensaje ajeno')`, [packageResult.rows[0].id])).rejects.toThrow(/propio|paquete|permiso/i);
    await expect(db.query(`select public.answer_package_followup($1)`, [request.rows[0].id])).rejects.toThrow(/administrador/i);
    await asRole(db, 'authenticated', admin);
    await db.query(`select public.answer_package_followup($1)`, [request.rows[0].id]);
    await asSuperuser(db);
    const rows = await db.query(`select status from public.package_followup_requests where id = $1`, [request.rows[0].id]);
    expect(rows.rows).toEqual([{ status: 'answered' }]);
  });
});
