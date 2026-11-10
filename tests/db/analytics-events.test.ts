import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asRole, asSuperuser, createDatabase, createUser } from './helpers';

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('analítica propia', () => {
  it('anon y authenticated no leen ni escriben', async () => {
    await asRole(db, 'anon');
    await expect(db.query('select * from public.analytics_events')).rejects.toThrow(/permission denied/i);
    await expect(db.query("insert into public.analytics_events (name, path) values ('page_view', '/')")).rejects.toThrow(/permission denied/i);

    await asSuperuser(db);
    const user = await createUser(db, 'organizer');
    await asRole(db, 'authenticated', user);
    await expect(db.query('select * from public.analytics_events')).rejects.toThrow(/permission denied/i);
    await expect(db.query("insert into public.analytics_events (name, path) values ('page_view', '/')")).rejects.toThrow(/permission denied/i);
  });

  it('service_role inserta y valida el nombre del evento', async () => {
    await asRole(db, 'service_role');
    await db.query("insert into public.analytics_events (name, path) values ('page_view', '/')");
    await expect(db.query("insert into public.analytics_events (name, path) values ('evento-inventado', '/')")).rejects.toThrow(/analytics_events_name_check|check constraint/i);
  });

  it('el resumen solo está disponible para el administrador', async () => {
    await asSuperuser(db);
    const organizer = await createUser(db, 'organizer');
    await asRole(db, 'authenticated', organizer);
    await expect(db.query("select * from public.admin_analytics_summary(current_date, current_date)")).rejects.toThrow(/Solo el administrador/i);

    await asSuperuser(db);
    const admin = await createUser(db, 'admin');
    await asRole(db, 'authenticated', admin);
    const result = await db.query<{ name: string; total: number }>("select name, total from public.admin_analytics_summary(current_date, current_date)");
    expect(result.rows).toEqual([{ name: 'page_view', total: 1 }]);
  });
});
