import { expect, test } from '@playwright/test';

test('antes de aceptar no sale ninguna petición de analítica', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/analytics')) requests.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Aceptar analítica' })).toBeVisible();
  await page.waitForTimeout(300);
  expect(requests).toHaveLength(0);
});

test('Solo lo necesario tampoco activa analítica', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/analytics')) requests.push(request.url()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Solo lo necesario' }).click();
  await expect(page.getByRole('button', { name: 'Solo lo necesario' })).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(requests).toHaveLength(0);
});

test('al aceptar sí se envía page_view', async ({ page }) => {
  const analyticsRequest = page.waitForRequest((request) => request.url().includes('/api/analytics'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Aceptar analítica' }).click();
  const request = await analyticsRequest;
  expect(request.postData()).toContain('page_view');
  expect(request.postData()).toContain('"path":"/"');
});
