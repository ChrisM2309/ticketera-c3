import { expect, test } from '@playwright/test';

async function expectStructuredDataMatchesRobots(page: import('@playwright/test').Page) {
  const robots = await page.locator('meta[name="robots"]').first().getAttribute('content');
  const structuredData = page.locator('script[type="application/ld+json"]');

  if (robots?.includes('noindex')) {
    await expect(structuredData).toHaveCount(0);
  } else {
    await expect(structuredData).not.toHaveCount(0);
  }
}

test('publica el favicon del sitio', async ({ request }) => {
  const response = await request.get('/favicon.ico');

  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/image\/x-icon|image\/vnd\.microsoft\.icon/);
  expect((await response.body()).length).toBeGreaterThan(0);
});

test('home muestra la identidad demo del proyecto', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Boletos para eventos tecnológicos en El Salvador · Ticketera C3 · DEMO');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Boletos para eventos tecnológicos en El Salvador · Ticketera C3 · DEMO',
  );
  await expect(page.locator('meta[property="og:description"]')).not.toHaveAttribute('content', '');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  await expect(page.getByRole('heading', { name: 'Encontrá tu próximo evento tecnológico' })).toBeVisible();
  await expect(page.getByRole('search').last()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Este fin de semana' })).toHaveAttribute(
    'href',
    '/buscar/?fecha=fin-de-semana',
  );
  await expect(page.getByRole('link', { name: 'Cerca de mí' })).toHaveAttribute(
    'href',
    '/buscar/?ciudad=san-salvador',
  );
  await expect(page.locator('header').getByText('Publicar evento')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Próximos eventos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Organizás un evento?' })).toBeVisible();
  await expectStructuredDataMatchesRobots(page);
});

test('home mantiene legibles los atajos y presenta destacados', async ({ page }) => {
  await page.goto('/');

  const shortcuts = page.getByRole('navigation', { name: 'Explorar eventos rápidamente' });
  await expect(shortcuts).toBeVisible();

  const links = shortcuts.getByRole('link');
  await expect(links).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    const dimensions = await links.nth(index).evaluate((element) => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    }));

    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  await expect(page.getByRole('region', { name: 'Destacados', exact: true })).toBeVisible();
});

test('ficha de evento permite seleccionar una entrada con sus límites', async ({ page }) => {
  await page.goto('/congresos/inteligencia-artificial/congreso-demo-ia/');

  await expect(page.getByRole('heading', { name: 'Congreso demo de IA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Elegí tus entradas' })).toBeVisible();
  await expectStructuredDataMatchesRobots(page);

  const general = page.getByRole('spinbutton', { name: 'Cantidad de General' });
  await expect(general).toHaveAttribute('max', '4');
  await general.fill('1');
  await expect(page.getByText('1 entrada seleccionada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continuar al carrito' })).toHaveAttribute(
    'href',
    /\/carrito\//,
  );
});
