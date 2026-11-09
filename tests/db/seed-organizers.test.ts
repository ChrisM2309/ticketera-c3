import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createDatabase } from './helpers';

describe('organizadores del seed', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  test('existe el organizador copa marcado DEMO', async () => {
    const result = await db.query<{
      name: string;
      description: string;
      owner_user_id: string | null;
      status: string;
    }>(`select name, description, owner_user_id, status from public.organizers where slug = 'copa'`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Copa Salvadoreña');
    expect(result.rows[0].description).toContain('DEMO');
    expect(result.rows[0].owner_user_id).toBeNull();
    expect(result.rows[0].status).toBe('active');
  });

  test('copa tiene tres eventos publicados de competencias o hackathons', async () => {
    const result = await db.query<{ slug: string; tipo: string; status: string }>(
      `select e.slug, c.slug as tipo, e.status
       from public.events e
       join public.organizers o on o.id = e.organizer_id
       join public.categories c on c.id = e.event_type_id
       where o.slug = 'copa'`,
    );

    expect(result.rows).toHaveLength(3);
    for (const row of result.rows) {
      expect(row.status).toBe('published');
      expect(['competencias', 'hackathons']).toContain(row.tipo);
    }
  });

  test('no existe organizador claude', async () => {
    const result = await db.query(`select 1 from public.organizers where slug = 'claude'`);
    expect(result.rows).toHaveLength(0);
  });
});
