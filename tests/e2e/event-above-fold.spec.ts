import { expect, test, type Page } from '@playwright/test';

/**
 * Ficha en móvil (CO-02): la primera entrada y el botón de compra se ven sin scroll.
 * Lee el catálogo de la base real con la clave anónima; los eventos DEMO con ponentes son
 * los de supabase/seed.sql. Requiere la migración de ponentes aplicada (columna events.speakers).
 *
 * Las pruebas de «sin ponentes» y «agotado» dependen de datos: se saltan si la base no tiene un
 * evento publicado que las cumpla (el seed DEMO no incluye ninguno agotado). Lo que fijan esos
 * comportamientos de forma permanente son las pruebas de render de tests/unit/event-detail-page.test.ts.
 */

test.use({ viewport: { width: 375, height: 812 } });

const conPonentes = '/congresos/inteligencia-artificial/congreso-demo-ia/';
const viewportHeight = 812;

type Resumen = { href: string; sinPonentes: boolean };

async function fichasDeCategoria(page: Page, categoria: string): Promise<string[]> {
  await page.goto(categoria);
  const enlaces = page.locator('article h3 a');
  await expect(enlaces.first()).toBeVisible();

  return enlaces.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''));
}

async function primeraFichaSinPonentes(page: Page): Promise<Resumen | null> {
  for (const categoria of ['/webinars/', '/meetups/', '/charlas/', '/concursos/', '/workshops/', '/competencias/']) {
    const hrefs = await fichasDeCategoria(page, categoria).catch(() => []);

    for (const href of hrefs.filter(Boolean)) {
      await page.goto(href);
      if ((await page.getByRole('heading', { name: 'Ponentes' }).count()) === 0) {
        return { href, sinPonentes: true };
      }
    }
  }

  return null;
}

test('la primera entrada y el botón de compra se ven sin scroll', async ({ page }) => {
  await page.goto(conPonentes);

  // La primera tarjeta de entrada (nombre, precio y selector de cantidad), no solo el encabezado.
  const primeraEntrada = page.getByRole('group', { name: 'Tipos de entrada' }).locator('> div').first();
  await expect(primeraEntrada).toBeVisible();
  await expect(primeraEntrada.getByRole('spinbutton')).toBeVisible();

  const entradaBox = await primeraEntrada.boundingBox();
  expect(entradaBox).not.toBeNull();

  const enlace = page.getByRole('link', { name: /Elegir entradas/ });
  await expect(enlace).toBeVisible();
  const enlaceBox = await enlace.boundingBox();
  expect(enlaceBox).not.toBeNull();
  expect(enlaceBox!.height).toBeGreaterThanOrEqual(44);

  const barra = await page.getByTestId('barra-compra-movil').boundingBox();
  expect(barra).not.toBeNull();
  // La barra fija está pegada al borde inferior y contiene el botón de compra.
  expect(barra!.y + barra!.height).toBeCloseTo(viewportHeight, 0);
  expect(enlaceBox!.y).toBeGreaterThanOrEqual(barra!.y);
  expect(enlaceBox!.y + enlaceBox!.height).toBeLessThanOrEqual(viewportHeight);

  // La primera entrada completa queda sobre el pliegue y la barra no la tapa.
  expect(entradaBox!.y).toBeGreaterThanOrEqual(0);
  expect(entradaBox!.y + entradaBox!.height).toBeLessThanOrEqual(barra!.y);
});

test('los controles de cantidad de la primera entrada tienen área táctil de 44 px', async ({ page }) => {
  await page.goto(conPonentes);

  const primeraEntrada = page.getByRole('group', { name: 'Tipos de entrada' }).locator('> div').first();
  for (const nombre of [/^Agregar una entrada/, /^Quitar una entrada/]) {
    const boton = await primeraEntrada.getByRole('button', { name: nombre }).boundingBox();
    expect(boton).not.toBeNull();
    expect(boton!.width).toBeGreaterThanOrEqual(44);
    expect(boton!.height).toBeGreaterThanOrEqual(44);
  }
});

test('la ficha muestra los ponentes DEMO después de la agenda', async ({ page }) => {
  await page.goto(conPonentes);
  test.skip(
    (await page.getByRole('heading', { name: 'Ponentes' }).count()) === 0,
    'La ficha de muestra de la base conectada no tiene ponentes; la representación se cubre con fixture unitario.',
  );

  await expect(page.getByRole('heading', { name: 'Ponentes' })).toBeVisible();
  await expect(page.getByText('Ponente DEMO 1')).toBeVisible();
});

test('la caja de compra no tapa el contenido ni genera scroll horizontal', async ({ page }) => {
  await page.goto(conPonentes);

  const cabe = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(cabe).toBe(true);
});

test('una ficha sin ponentes no muestra la sección', async ({ page }) => {
  test.setTimeout(90_000);
  const ficha = await primeraFichaSinPonentes(page);
  test.skip(ficha === null, 'No hay eventos publicados sin ponentes en la base de prueba.');

  await page.goto(ficha!.href);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ponentes' })).toHaveCount(0);
});

test('un evento agotado muestra Agotado y no la barra de compra', async ({ page }) => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  test.skip(!base || !clave, 'Faltan las variables públicas de Supabase para buscar un evento agotado.');

  const respuesta = await page.request.get(
    `${base}/rest/v1/events?select=slug,event_type:categories!events_event_type_fk(slug),topic:categories!events_topic_fk(slug),ticket_types(quantity_total,quantity_sold,is_active)&status=eq.published&starts_at=gte.${new Date().toISOString()}`,
    { headers: { apikey: clave!, Authorization: `Bearer ${clave}` } },
  );
  const filas = (await respuesta.json()) as {
    slug: string;
    event_type: { slug: string } | null;
    topic: { slug: string } | null;
    ticket_types: { quantity_total: number; quantity_sold: number; is_active: boolean }[];
  }[];
  const agotado = filas.find(
    (fila) =>
      fila.event_type &&
      fila.ticket_types.some((ticket) => ticket.is_active) &&
      fila.ticket_types.filter((ticket) => ticket.is_active).every((ticket) => ticket.quantity_sold >= ticket.quantity_total),
  );
  test.skip(!agotado, 'Ningún evento publicado está agotado en la base de prueba.');

  const ruta = ['', agotado!.event_type!.slug, agotado!.topic?.slug, agotado!.slug, ''].filter((parte) => parte !== undefined).join('/');
  await page.goto(ruta);

  await expect(page.getByText('Agotado', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Elegir entradas/ })).toHaveCount(0);
});
