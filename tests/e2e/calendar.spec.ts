import { loadEnvConfig } from '@next/env';
import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Agregar al calendario (CO-05). Lee la base real con la clave anónima (solo lectura);
 * el evento DEMO es el de supabase/seed.sql.
 */

loadEnvConfig(process.cwd());

const eventPath = '/congresos/inteligencia-artificial/congreso-demo-ia/';
const eventSlug = 'congreso-demo-ia';

/** Id del evento DEMO publicado, leído de PostgREST sin pasar por la ficha (que también lee ponentes). */
async function publishedEventId(request: APIRequestContext): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const response = await request.get(`${url}/rest/v1/events`, {
    params: { select: 'id', slug: `eq.${eventSlug}`, status: 'eq.published' },
    headers: { apikey: anonKey },
  });

  if (!response.ok()) {
    return null;
  }

  const rows = (await response.json()) as { id: string }[];

  return rows[0]?.id ?? null;
}

test('descarga el .ics de un evento publicado', async ({ request }) => {
  const eventId = await publishedEventId(request);
  test.skip(eventId === null, 'No hay base de datos configurada o el evento DEMO no está publicado.');

  const response = await request.get(`/calendario/${eventId}/`);

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/calendar');
  expect(response.headers()['content-type']).toContain('charset=utf-8');
  expect(response.headers()['content-disposition']).toBe('attachment; filename="evento.ics"');

  const body = await response.text();

  expect(body.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
  expect(body.endsWith('END:VCALENDAR\r\n')).toBe(true);
  expect(body).toContain(`\r\nUID:${eventId}@ticketera.c3.com.sv\r\n`);
  expect(body).toMatch(/\r\nDTSTART:\d{8}T\d{6}Z\r\n/);
  expect(body).toMatch(/\r\nDTEND:\d{8}T\d{6}Z\r\n/);
  expect(body).toContain('\r\nSUMMARY:');
  expect(body).not.toContain('ATTENDEE');
});

test('404 para un evento inexistente', async ({ request }) => {
  const missing = await request.get('/calendario/00000000-0000-4000-8000-000000000000/');
  const invalid = await request.get('/calendario/no-es-un-uuid/');

  expect(missing.status()).toBe(404);
  expect(invalid.status()).toBe(404);
});

test('la ficha del evento enlaza al .ics', async ({ page }) => {
  await page.goto(eventPath);

  const link = page.getByRole('link', { name: 'Agregar al calendario' });
  const catalogUnavailable = await page.getByRole('heading', { name: 'No pudimos cargar el catálogo' }).count();
  test.skip(catalogUnavailable > 0, 'La ficha no carga: falta la migración de ponentes en la base.');

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /^\/calendario\/[0-9a-f-]{36}\/$/);
});
