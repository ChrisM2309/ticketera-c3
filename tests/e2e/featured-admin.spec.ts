import { expect, test, type Page } from '@playwright/test';

const enabled = process.env.E2E_AUTH === '1';
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@demo.c3';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.DEMO_ADMIN_PASSWORD ?? '';
const organizerEmail = process.env.E2E_ORGANIZER_EMAIL ?? 'organizador@demo.c3';
const organizerPassword = process.env.E2E_ORGANIZER_PASSWORD ?? process.env.DEMO_ORGANIZER_PASSWORD ?? '';

test.skip(!enabled, 'Requiere E2E_AUTH=1 y cuentas DEMO de administrador y organizador.');

async function signIn(page: Page, email: string, password: string, expectedPath: RegExp) {
  expect(password, 'Falta la contraseña E2E de la cuenta DEMO.').not.toBe('');
  await page.goto('/ingresar/');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(expectedPath);
}

test('el administrador ve pagados y manuales en la misma lista', async ({ page }) => {
  await signIn(page, adminEmail, adminPassword, /\/admin\/?$/);
  await page.goto('/admin/destacados/');

  await expect(page.getByRole('heading', { level: 1, name: 'Destacados' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Origen' })).toBeVisible();
  await expect(page.getByText('Manual', { exact: true }).or(page.getByText('Pagado', { exact: true }))).toBeVisible();
});

test('un organizador no entra a /admin/destacados/', async ({ page }) => {
  await signIn(page, organizerEmail, organizerPassword, /\/panel\/?$/);
  await page.goto('/admin/destacados/');

  await expect(page).toHaveURL(/\/panel\/?$/);
});
