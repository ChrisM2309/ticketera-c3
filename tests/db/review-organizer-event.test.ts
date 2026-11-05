import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import {
  asRole,
  asSuperuser,
  createDatabase,
  createEvent,
  createOrderFixture,
  createOrganizer,
  createUser,
} from './helpers';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
}, 30_000);

afterEach(async () => {
  await db.close();
});

async function eventStatusAsAnon(eventId: string): Promise<string[]> {
  await asRole(db, 'anon');
  const result = await db.query<{ status: string }>(`select status from public.events where id = $1`, [eventId]);
  return result.rows.map((row) => row.status);
}

describe('review_organizer_event', () => {
  it('el administrador aprueba un evento pendiente y queda visible en el catálogo público', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-aprobado');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-aprobar-a1', status: 'pending' });

    expect(await eventStatusAsAnon(eventId)).toEqual([]);

    await asRole(db, 'authenticated', admin);
    const result = await db.query<{ review_organizer_event: string }>(
      `select public.review_organizer_event($1, 'approve')`,
      [eventId],
    );

    expect(result.rows[0].review_organizer_event).toBe('published');
    expect(await eventStatusAsAnon(eventId)).toEqual(['published']);
  });

  it('el administrador rechaza un evento pendiente y no aparece en el catálogo', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-rechazado');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-rechazar-b2', status: 'pending' });

    await asRole(db, 'authenticated', admin);
    const result = await db.query<{ review_organizer_event: string }>(
      `select public.review_organizer_event($1, 'reject')`,
      [eventId],
    );

    expect(result.rows[0].review_organizer_event).toBe('rejected');
    expect(await eventStatusAsAnon(eventId)).toEqual([]);
  });

  it('solo revisa eventos pendientes: un evento ya publicado no cambia', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-publicado');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-publicado-c3', status: 'published' });

    await asRole(db, 'authenticated', admin);
    await expect(
      db.query(`select public.review_organizer_event($1, 'reject')`, [eventId]),
    ).rejects.toThrow(/Solo se revisan eventos pendientes/);
  });

  it('no publica un evento cuya fecha ya pasó', async () => {
    const admin = await createUser(db, 'admin');
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-vencido');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-vencido-d4', status: 'pending' });

    await asSuperuser(db);
    await db.query(`update public.events set starts_at = '2020-01-01 18:00:00+00' where id = $1`, [eventId]);

    await asRole(db, 'authenticated', admin);
    await expect(
      db.query(`select public.review_organizer_event($1, 'approve')`, [eventId]),
    ).rejects.toThrow(/ya terminó/);
    expect(await eventStatusAsAnon(eventId)).toEqual([]);
  });

  it('un organizador no puede aprobar ni rechazar eventos, ni siquiera los suyos', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-sin-revision');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-sin-revision-e5', status: 'pending' });

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`select public.review_organizer_event($1, 'approve')`, [eventId]),
    ).rejects.toThrow(/Solo el administrador/);
    expect(await eventStatusAsAnon(eventId)).toEqual([]);
  });

  it('un organizador no puede publicar su evento cambiando el estado directamente', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-autopublica');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-autopublica-f6', status: 'pending' });

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`update public.events set status = 'published' where id = $1`, [eventId]),
    ).rejects.toThrow(/row-level security/);
    expect(await eventStatusAsAnon(eventId)).toEqual([]);
  });

  it('un organizador no puede editar ni revisar eventos de otro organizador', async () => {
    const owner = await createUser(db, 'organizer');
    const intruder = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-ajeno');
    await createOrganizer(db, intruder, 'organizador-intruso');
    const eventId = await createEvent(db, organizerId, { slug: 'evento-ajeno-g7', status: 'pending' });

    await asRole(db, 'authenticated', intruder);
    const edit = await db.query(`update public.events set title = 'Cambiado' where id = $1`, [eventId]);
    expect(edit.affectedRows).toBe(0);
    await expect(
      db.query(`select public.review_organizer_event($1, 'approve')`, [eventId]),
    ).rejects.toThrow(/Solo el administrador/);
  });
});

describe('organizer_event_ticket_counts', () => {
  it('el organizador ve los boletos emitidos de sus eventos y no los de otro', async () => {
    const owner = await createUser(db, 'organizer');
    const other = await createUser(db, 'organizer');
    const ownerOrganizerId = await createOrganizer(db, owner, 'organizador-conteo');
    const otherOrganizerId = await createOrganizer(db, other, 'organizador-conteo-ajeno');
    const ownerEventId = await createEvent(db, ownerOrganizerId, { slug: 'evento-conteo-h8', status: 'published' });
    const otherEventId = await createEvent(db, otherOrganizerId, { slug: 'evento-conteo-i9', status: 'published' });

    await asSuperuser(db);
    await db.query(
      `insert into public.ticket_types (event_id, name, price_cents, quantity_total) values ($1, 'General', 0, 10)`,
      [ownerEventId],
    );
    await createOrderFixture(db, ownerEventId);

    await asRole(db, 'authenticated', owner);
    const ownerRows = await db.query<{ event_id: string; tickets_issued: number | string }>(
      `select event_id, tickets_issued from public.organizer_event_ticket_counts()`,
    );
    const ownerCounts = ownerRows.rows.map((row) => [row.event_id, Number(row.tickets_issued)]);

    expect(ownerCounts).toContainEqual([ownerEventId, 1]);
    expect(ownerRows.rows.map((row) => row.event_id)).not.toContain(otherEventId);
  });

  it('un usuario sin organización no recibe filas', async () => {
    const owner = await createUser(db, 'organizer');
    const organizerId = await createOrganizer(db, owner, 'organizador-sin-conteo');
    await createEvent(db, organizerId, { slug: 'evento-sin-conteo-j0', status: 'published' });

    const stranger = await createUser(db, 'organizer');
    await asRole(db, 'authenticated', stranger);
    const result = await db.query(`select event_id from public.organizer_event_ticket_counts()`);

    expect(result.rows).toEqual([]);
  });
});
