import { expect, test } from '@playwright/test';

test('home muestra la identidad demo del proyecto', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Boletos para eventos tecnológicos en El Salvador · Ticketera C3 · DEMO');
  await expect(
    page.getByRole('heading', {
      name: 'Boletos para eventos tecnológicos en El Salvador',
    }),
  ).toBeVisible();
});
