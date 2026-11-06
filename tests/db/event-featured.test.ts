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

async function publishedEvents(count: number, organizerId: string): Promise<string[]> {
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    ids.push(await createEvent(db, organizerId, { slug: `destacado-${index}-x1`, status: 'published' }));
  }
  return ids;
}

describe('admin_set_featured', () => {
  it('el administrador destaca un evento publicado y el catálogo público lo ve', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'org-destacado');
    const [eventId] = await publishedEvents(1, organizerId);

    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_set_featured($1, true)`, [eventId]);

    await asRole(db, 'anon');
    const rows = await db.query<{ event_id: string; position: number }>(
      `select event_id, position from public.event_featured`,
    );
    expect(rows.rows).toEqual([{ event_id: eventId, position: 1 }]);
  });

  it('nunca hay más de cuatro destacados', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'org-cuatro');
    const ids = await publishedEvents(5, organizerId);

    await asRole(db, 'authenticated', admin);
    for (const id of ids.slice(0, 4)) {
      await db.query(`select public.admin_set_featured($1, true)`, [id]);
    }
    await expect(db.query(`select public.admin_set_featured($1, true)`, [ids[4]])).rejects.toThrow(/cuatro/);
  });

  it('quitar un destacado libera su lugar', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'org-quitar');
    const [eventId] = await publishedEvents(1, organizerId);

    await asRole(db, 'authenticated', admin);
    await db.query(`select public.admin_set_featured($1, true)`, [eventId]);
    await db.query(`select public.admin_set_featured($1, false)`, [eventId]);

    await asSuperuser(db);
    const rows = await db.query(`select event_id from public.event_featured`);
    expect(rows.rows).toEqual([]);
  });

  it('un organizador no puede destacar eventos, ni siquiera los suyos', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'org-sin-permiso');
    const [eventId] = await publishedEvents(1, organizerId);

    await asRole(db, 'authenticated', owner);
    await expect(db.query(`select public.admin_set_featured($1, true)`, [eventId])).rejects.toThrow(/administrador/);
    await expect(
      db.query(`insert into public.event_featured (event_id, position) values ($1, 1)`, [eventId]),
    ).rejects.toThrow(/permission denied|row-level security/);
  });

  it('solo se destacan eventos publicados', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'org-borrador');
    const draftId = await createEvent(db, organizerId, { slug: 'borrador-y1', status: 'pending' });

    await asRole(db, 'authenticated', admin);
    await expect(db.query(`select public.admin_set_featured($1, true)`, [draftId])).rejects.toThrow(/publicados/);
  });
});
