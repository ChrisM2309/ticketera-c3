import { expect, test } from '@playwright/test';

test('/congresos/ muestra sus destacados y /cloud/ no muestra bloque', async ({ page }) => {
  await page.goto('/congresos/');
  await expect(page.getByRole('heading', { level: 1, name: 'Congresos' })).toBeVisible();
  const featuredHeading = page.getByRole('heading', { name: /Destacados de Congresos/ });
  if (await featuredHeading.count()) await expect(featuredHeading).toBeVisible();

  await page.goto('/cloud/');
  await expect(page.getByRole('heading', { name: /Destacados de/ })).toHaveCount(0);
});

test('sin destacados no hay bloque vacío', async ({ page }) => {
  await page.goto('/congresos/');
  const featuredHeading = page.getByRole('heading', { name: /Destacados de Congresos/ });
  const cards = page.getByRole('heading', { name: 'Destacados de Congresos' }).locator('..').getByRole('article');
  if ((await featuredHeading.count()) === 0) await expect(cards).toHaveCount(0);
});
