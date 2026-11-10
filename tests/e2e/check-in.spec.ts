import { expect, test } from '@playwright/test';

const enabled = process.env.E2E_AUTH === '1';
const email = process.env.E2E_ORGANIZER_EMAIL ?? '';
const password = process.env.E2E_ORGANIZER_PASSWORD ?? '';
const eventId = process.env.E2E_CHECKIN_EVENT_ID ?? '';
const token = process.env.E2E_CHECKIN_TOKEN ?? '';

test.skip(!enabled, 'Requiere E2E_AUTH=1 y variables E2E de organizador, evento y QR de prueba no usado.');

test('el organizador valida un boleto y el segundo intento avisa que ya fue usado', async ({ page }) => {
  expect(email).not.toBe('');
  expect(password).not.toBe('');
  expect(eventId).not.toBe('');
  expect(token).not.toBe('');

  await page.goto('/ingresar/');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/panel\/$/);

  await page.goto(`/panel/eventos/${eventId}/checkin/`);
  await page.getByLabel('Código QR').fill(token);
  await page.getByRole('button', { name: 'Validar entrada' }).click();
  await expect(page.getByRole('status')).toHaveText('Entrada válida');

  await page.getByLabel('Código QR').fill(token);
  await page.getByRole('button', { name: 'Validar entrada' }).click();
  await expect(page.getByRole('status')).toHaveText('Esta entrada ya fue usada');
});
