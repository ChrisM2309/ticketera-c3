import { expect, test } from '@playwright/test';

test('con el interruptor apagado robots.txt dice Disallow: /', async ({ page }) => {
  const response = await page.goto('/robots.txt');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('body')).toContainText('Disallow: /');
  await expect(page.locator('body')).not.toContainText('Sitemap:');
});
