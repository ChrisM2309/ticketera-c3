import { expect, test } from '@playwright/test';

test('la página muestra el precio anual configurado o que sigue por definir', async ({ page }) => {
  await page.goto('/para-empresas/');
  await expect(page.getByRole('heading', { level: 1, name: /Impulsa todos tus eventos/ })).toBeVisible();
  const priceLine = await page.getByText('por año', { exact: true }).locator('..').textContent();
  expect(priceLine?.trim()).toMatch(/^(?:Precio por definir|(?:US)?\$\s?[\d,.]+)\s+por año$/);
});

test('un visitante sin sesión ve los beneficios pero no el botón Contratar', async ({ page }) => {
  await page.goto('/para-empresas/');
  await expect(page.getByText('Multieventos', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Contratar' })).toHaveCount(0);
});

test('un organizador contrata con pago simulado aprobado y ve su paquete', async ({ page }) => {
  test.skip(process.env.E2E_AUTH !== '1', 'Requiere una sesión de organizador de E2E.');
  await page.goto('/para-empresas/');
  await page.getByRole('button', { name: /Continuar con el pago simulado/ }).click();
  await page.getByLabel(/Simular pago aprobado/).check();
  await page.getByRole('button', { name: /Confirmar pago simulado/ }).click();
  await expect(page.getByText(/resultado de la simulación quedó registrado/i)).toBeVisible();
  await page.goto('/panel/paquete/');
  await expect(page.getByRole('heading', { name: 'Paquete activo' })).toBeVisible();
});
