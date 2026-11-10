import { expect, test, type Page } from '@playwright/test';

const enabled = process.env.E2E_AUTH === '1';
const email = process.env.E2E_ORGANIZER_EMAIL ?? 'organizador@demo.c3';
const password = process.env.E2E_ORGANIZER_PASSWORD ?? process.env.DEMO_ORGANIZER_PASSWORD ?? '';

test.skip(!enabled, 'Requiere E2E_AUTH=1 y una cuenta DEMO de organizador.');

async function signIn(page: Page) {
  expect(password, 'Falta la contraseña E2E del organizador DEMO.').not.toBe('');
  await page.goto('/ingresar/');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/panel\/?$/);
}

test('sin tarifa configurada muestra Tarifa por definir', async ({ page }) => {
  await signIn(page);
  const link = page.getByRole('link', { name: 'Destacar' }).first();
  await link.click();
  await expect(page.getByText('Tarifa por definir')).toBeVisible();
});

test('el organizador elige días, ve el total y completa el pago simulado', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Destacar' }).first().click();
  await expect(page.getByText('Pago de demostración')).toBeVisible();
  await page.getByLabel('Días').fill('7');
  await expect(page.getByText('Total provisional:')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();
  await page.getByLabel('Simular pago aprobado').check();
  await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('pago rechazado muestra el estado y no destaca', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Destacar' }).first().click();
  await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();
  await page.getByLabel('Simular pago rechazado').check();
  await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();
  await expect(page.getByRole('status')).toBeVisible();
});
