import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createEvent, createOrganizer, createOrderFixture, createUser } from './helpers';

let db: PGlite;
let ownerId: string;
let eventId: string;
let orderId: string;
let tokenHash: string;

beforeEach(async () => {
  db = await createDatabase();
  ownerId = await createUser(db);
  const organizer = await createOrganizer(db, ownerId, `organizador-${randomUUID()}`);
  eventId = await createEvent(db, organizer, { slug: `evento-${randomUUID()}`, status: 'published' });
  await asSuperuser(db);
  await db.query(
    `insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order)
     values ($1, 'General', 1000, 20, 5)`,
    [eventId],
  );
  orderId = await createOrderFixture(db, eventId);
  tokenHash = randomUUID().replaceAll('-', '').padEnd(64, 'b');
  await db.query(`update public.orders set public_token_hash = $2, status = 'confirmed', confirmed_at = now() where id = $1`, [orderId, tokenHash]);
});

afterEach(async () => db.close());

describe('submit_survey', () => {
  it('antes del inicio devuelve too_early', async () => {
    await asRole(db, 'anon');
    const result = await db.query<{ submit_survey: string }>(
      `select public.submit_survey($1, $2, 5::smallint, null)`,
      [orderId, tokenHash],
    );
    expect(result.rows[0].submit_survey).toBe('too_early');
  });

  it('token incorrecto devuelve invalid', async () => {
    await asRole(db, 'anon');
    const result = await db.query<{ submit_survey: string }>(
      `select public.submit_survey($1, $2, 5::smallint, null)`,
      [orderId, 'f'.repeat(64)],
    );
    expect(result.rows[0].submit_survey).toBe('invalid');
  });

  it('una orden no confirmada devuelve invalid', async () => {
    await asSuperuser(db);
    const pendingId = await createOrderFixture(db, eventId);
    await asRole(db, 'anon');
    const result = await db.query<{ submit_survey: string }>(
      `select public.submit_survey($1, $2, 5::smallint, null)`,
      [pendingId, tokenHash],
    );
    expect(result.rows[0].submit_survey).toBe('invalid');
  });

  it('acepta una respuesta y rechaza una segunda por orden', async () => {
    await asSuperuser(db);
    await db.query(`update public.events set starts_at = now() - interval '1 hour' where id = $1`, [eventId]);
    await asRole(db, 'anon');
    const first = await db.query<{ submit_survey: string }>(
      `select public.submit_survey($1, $2, 4::smallint, 'Buena experiencia')`,
      [orderId, tokenHash],
    );
    const second = await db.query<{ submit_survey: string }>(
      `select public.submit_survey($1, $2, 5::smallint, null)`,
      [orderId, tokenHash],
    );
    expect(first.rows[0].submit_survey).toBe('ok');
    expect(second.rows[0].submit_survey).toBe('already_answered');
  });

  it('rechaza calificaciones fuera del rango', async () => {
    await asSuperuser(db);
    await db.query(`update public.events set starts_at = now() - interval '1 hour' where id = $1`, [eventId]);
    await asRole(db, 'anon');
    await expect(db.query(`select public.submit_survey($1, $2, 0::smallint, null)`, [orderId, tokenHash])).rejects.toThrow();
    await expect(db.query(`select public.submit_survey($1, $2, 6::smallint, null)`, [orderId, tokenHash])).rejects.toThrow();
  });

  it('el reporte muestra promedio y conteo, pero nunca comentarios', async () => {
    await asSuperuser(db);
    await db.query(`update public.events set starts_at = now() - interval '1 hour' where id = $1`, [eventId]);
    await asRole(db, 'anon');
    await db.query(`select public.submit_survey($1, $2, 4::smallint, 'Comentario privado')`, [orderId, tokenHash]);
    await asRole(db, 'authenticated', ownerId);
    const result = await db.query<Record<string, unknown>>(`select * from public.organizer_event_report($1)`, [eventId]);
    expect(result.rows[0]).toMatchObject({ survey_count: 1, survey_average: '4.0' });
    expect(Object.keys(result.rows[0])).not.toContain('comment');
  });

  it('anon no puede leer las respuestas directamente', async () => {
    await asRole(db, 'anon');
    await expect(db.query(`select * from public.event_survey_responses`)).rejects.toThrow();
  });
});
