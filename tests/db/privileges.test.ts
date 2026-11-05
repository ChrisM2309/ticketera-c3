import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, createDatabase } from './helpers';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

describe('privilegios de funciones SECURITY DEFINER', () => {
  it('anon no puede ejecutar ninguna función SECURITY DEFINER de public', async () => {
    await asRole(db, 'anon');
    const result = await db.query<{ proname: string }>(
      `select p.proname
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.prosecdef
          and has_function_privilege('anon', p.oid, 'EXECUTE')`,
    );

    expect(result.rows.map((row) => row.proname)).toEqual([]);
  });

  it('solo el rol de servidor puede crear órdenes pendientes', async () => {
    await asRole(db, 'anon');
    const result = await db.query<{ anon: boolean; authenticated: boolean; service: boolean }>(
      `select has_function_privilege('anon', 'public.create_pending_order(uuid, jsonb, text, text, text, integer)', 'EXECUTE') as anon,
              has_function_privilege('authenticated', 'public.create_pending_order(uuid, jsonb, text, text, text, integer)', 'EXECUTE') as authenticated,
              has_function_privilege('service_role', 'public.create_pending_order(uuid, jsonb, text, text, text, integer)', 'EXECUTE') as service`,
    );

    expect(result.rows[0]).toEqual({ anon: false, authenticated: false, service: true });
  });
});
