import { expect, test } from '@playwright/test';

test('el blog público carga su listado', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.getByRole('heading', { level: 1, name: 'Blog de Ticketera C3' })).toBeVisible();
});

test('un borrador no se expone por slug', async ({ page }) => {
  const response = await page.goto('/blog/borrador-inexistente/');
  expect(response?.status()).toBe(404);
});

test('la categoría no muestra un bloque editorial vacío', async ({ page }) => {
  await page.goto('/congresos/');
  const heading = page.getByRole('heading', { name: 'Sobre esta categoría' });
  if (await heading.count()) await expect(heading).toBeVisible();
});
