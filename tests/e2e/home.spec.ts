import { expect, test } from '@playwright/test';

test('home muestra la identidad demo del proyecto', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Boletos para eventos tecnológicos en El Salvador · Ticketera C3 · DEMO');
  await expect(
    page.getByRole('heading', {
      name: 'Boletos para eventos tecnológicos en El Salvador',
    }),
  ).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test('ficha de evento permite seleccionar una entrada con sus límites', async ({ page }) => {
  await page.goto('/congresos/inteligencia-artificial/congreso-demo-ia/');

  await expect(page.getByRole('heading', { name: 'Congreso demo de IA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Elegí tus entradas' })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);

  const general = page.getByRole('spinbutton', { name: 'Cantidad de General' });
  await expect(general).toHaveAttribute('max', '4');
  await general.fill('1');
  await expect(page.getByText('1 entrada seleccionada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continuar al carrito' })).toHaveAttribute(
    'href',
    /\/carrito\//,
  );
});
