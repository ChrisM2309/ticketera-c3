import { expect, test } from '@playwright/test';

test('/congresos sin barra redirige con 308 a /congresos/', async ({ request }) => {
  const response = await request.get('/congresos', { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/congresos\/$/);
});

test('una ruta inexistente responde 404 con noindex', async ({ page }) => {
  const response = await page.goto('/ruta-inexistente-para-e2e/');

  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toHaveAttribute(
    'content',
    /noindex/,
  );
});

test('la ruta filtrada /congresos/?ciudad=san-salvador tiene canónico a /congresos/', async ({ page }) => {
  await page.goto('/congresos/?ciudad=san-salvador');

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).not.toBeNull();
  expect(new URL(canonical!).pathname).toBe('/congresos/');
  expect(new URL(canonical!).search).toBe('');
});

test('robots.txt y sitemap.xml responden 200 con el tipo correcto', async ({ request }) => {
  const [robots, sitemap] = await Promise.all([
    request.get('/robots.txt'),
    request.get('/sitemap.xml'),
  ]);

  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toMatch(/^text\/plain/);
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toMatch(/(?:application|text)\/xml/);
});

test('las rutas privadas llevan noindex', async ({ page }) => {
  for (const path of ['/carrito/', '/checkout/', '/ingresar/', '/registro/', '/mis-boletos/']) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute('content', /noindex/);
  }
});
