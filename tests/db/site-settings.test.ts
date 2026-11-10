import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createUser } from './helpers';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

async function setSetting(key: string, value: unknown) {
  return db.query(`select public.admin_set_setting($1, $2::jsonb)`, [key, JSON.stringify(value)]);
}

describe('site_settings', () => {
  it('anon lee solo las claves permitidas', async () => {
    const admin = await createUser(db, 'admin');
    await asSuperuser(db);
    await db.query(`insert into public.site_settings (key, value) values ('clave_interna', '"secreto"'::jsonb)`);

    await asRole(db, 'authenticated', admin);
    await setSetting('featured_daily_rate_cents', 2500);
    await setSetting('package_annual_price_cents', 120000);
    await setSetting('indexing_enabled', true);

    await asRole(db, 'anon');
    const rows = await db.query<{ key: string }>(`select key from public.site_settings order by key`);

    expect(rows.rows.map((row) => row.key)).toEqual([
      'featured_daily_rate_cents',
      'indexing_enabled',
      'package_annual_price_cents',
    ]);
  });

  it('anon no puede escribir', async () => {
    await asRole(db, 'anon');

    await expect(
      db.query(`insert into public.site_settings (key, value) values ('indexing_enabled', 'true'::jsonb)`),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query(`update public.site_settings set value = 'true'::jsonb`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(setSetting('indexing_enabled', true)).rejects.toThrow(/permission denied/);
  });

  it('solo el administrador cambia una clave permitida', async () => {
    const admin = await createUser(db, 'admin');
    const organizer = await createUser(db, 'organizer');

    await asRole(db, 'authenticated', organizer);
    await expect(setSetting('featured_daily_rate_cents', 2500)).rejects.toThrow(/Solo el administrador/);
    await expect(
      db.query(`insert into public.site_settings (key, value) values ('featured_daily_rate_cents', '1'::jsonb)`),
    ).rejects.toThrow(/permission denied/);

    await asRole(db, 'authenticated', admin);
    await setSetting('featured_daily_rate_cents', 2500);
    await setSetting('featured_daily_rate_cents', 3000);

    const rows = await db.query<{ value: number }>(
      `select value from public.site_settings where key = 'featured_daily_rate_cents'`,
    );
    expect(rows.rows).toEqual([{ value: 3000 }]);
  });

  it('una clave desconocida se rechaza', async () => {
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', admin);
    await expect(setSetting('clave_inventada', 1)).rejects.toThrow(/clave/i);

    await asSuperuser(db);
    const rows = await db.query(`select 1 from public.site_settings where key = 'clave_inventada'`);
    expect(rows.rows).toHaveLength(0);
  });

  it('rechaza valores con el tipo equivocado', async () => {
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', admin);
    await expect(setSetting('featured_daily_rate_cents', -5)).rejects.toThrow(/entero/);
    await expect(setSetting('package_annual_price_cents', 12.5)).rejects.toThrow(/entero/);
    await expect(setSetting('package_benefits', 'muchos')).rejects.toThrow(/objeto/);
    await expect(setSetting('indexing_enabled', 'si')).rejects.toThrow(/verdadero o falso/);
  });

  it('registra quién y cuándo', async () => {
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', admin);
    await setSetting('indexing_enabled', false);

    await asSuperuser(db);
    const first = await db.query<{ updated_by: string; updated_at: string }>(
      `select updated_by, updated_at::text as updated_at from public.site_settings where key = 'indexing_enabled'`,
    );
    expect(first.rows[0].updated_by).toBe(admin);

    await db.query(`select pg_sleep(0.01)`);
    await asRole(db, 'authenticated', admin);
    await setSetting('indexing_enabled', true);

    await asSuperuser(db);
    const second = await db.query<{ updated_at: string; value: boolean }>(
      `select updated_at::text as updated_at, value from public.site_settings where key = 'indexing_enabled'`,
    );
    expect(second.rows[0].value).toBe(true);
    expect(second.rows[0].updated_at > first.rows[0].updated_at).toBe(true);
  });

  it('no trae filas iniciales', async () => {
    await asRole(db, 'anon');
    const rows = await db.query(`select 1 from public.site_settings`);
    expect(rows.rows).toHaveLength(0);
  });
});
