import { expect, test } from '@playwright/test';

test('home muestra la identidad demo del proyecto', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Ticketera C3');
  await expect(
    page.getByRole('heading', {
      name: 'Explorá eventos tecnológicos en El Salvador',
    }),
  ).toBeVisible();
});
