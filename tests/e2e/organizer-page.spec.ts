import { expect, test } from '@playwright/test';

test('/copa/ muestra la página del organizador DEMO', async ({ page }) => {
  const response = await page.goto('/copa/');
  test.skip(response?.status() === 404, 'La base E2E no contiene la semilla DEMO de Copa Salvadoreña.');
  await expect(page.getByRole('heading', { level: 1, name: 'Copa Salvadoreña' })).toBeVisible();
  await expect(page.getByText('Organizador DEMO')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Próximos eventos' })).toBeVisible();
});

test('/claude/ responde 404', async ({ page }) => {
  const response = await page.goto('/claude/');
  expect(response?.status()).toBe(404);
});
