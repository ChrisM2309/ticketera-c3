import { expect, test, type Page } from '@playwright/test';

/**
 * Cuenta del comprador (CP-03, CP-05, CP-07): «Mis boletos», «Mi cuenta» y control de acceso por rol.
 *
 * Usa cuentas reales de Supabase Auth, así que solo corre con E2E_AUTH=1 y necesita:
 *  - la cuenta compradora sembrada con `node --env-file=.env.local scripts/seed-demo-users.mjs --apply`
 *    (cliente@demo.c3, con la contraseña de DEMO_BUYER_PASSWORD);
 *  - E2E_BUYER_PASSWORD con esa misma contraseña (E2E_BUYER_EMAIL cambia el correo; por defecto cliente@demo.c3);
 *  - NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno, solo para preparar el dato de la prueba
 *    del historial (ver `ensureBuyerOrder`). Las contraseñas nunca se escriben en el repositorio.
 */

const enabled = process.env.E2E_AUTH === '1';
const buyerEmail = process.env.E2E_BUYER_EMAIL ?? 'cliente@demo.c3';
const buyerPassword = process.env.E2E_BUYER_PASSWORD ?? process.env.DEMO_BUYER_PASSWORD ?? '';

test.skip(!enabled, 'Requiere E2E_AUTH=1, una base real y la cuenta compradora sembrada.');

async function signInAsBuyer(page: Page) {
  expect(buyerPassword, 'Define E2E_BUYER_PASSWORD con la contraseña de la cuenta compradora sembrada.').not.toBe('');

  await page.goto('/ingresar/');
  await page.getByLabel('Correo electrónico').fill(buyerEmail);
  await page.getByLabel('Contraseña').fill(buyerPassword);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/mis-boletos\/$/);
}

/**
 * Deja al menos una orden confirmada (con enlace de boletos) asociada a la cuenta compradora.
 * Mientras el checkout con sesión no exista, ninguna compra de la interfaz queda ligada a una cuenta: se toma
 * la orden confirmada más reciente de las compras de prueba (correo @example.test) y se asocia a la cuenta.
 * Devuelve false si no hay ninguna orden que usar (corre antes REAL_PURCHASE=1 npx playwright test purchase-flow-real).
 */
async function ensureBuyerOrder(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return false;
  }

  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' };

  const usersResponse = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers });
  const users = ((await usersResponse.json()) as { users?: { id: string; email?: string }[] }).users ?? [];
  const buyer = users.find((user) => user.email?.toLowerCase() === buyerEmail.toLowerCase());

  if (!buyer) {
    return false;
  }

  const linked = await fetch(
    `${url}/rest/v1/orders?select=id&buyer_user_id=eq.${buyer.id}&status=eq.confirmed&checkout_request_id=not.is.null&limit=1`,
    { headers },
  );

  if (((await linked.json()) as unknown[]).length > 0) {
    return true;
  }

  const candidates = await fetch(
    `${url}/rest/v1/orders?select=id&buyer_user_id=is.null&status=eq.confirmed&checkout_request_id=not.is.null&buyer_email=like.*@example.test&order=created_at.desc&limit=1`,
    { headers },
  );
  const [candidate] = (await candidates.json()) as { id: string }[];

  if (!candidate) {
    return false;
  }

  const update = await fetch(`${url}/rest/v1/orders?id=eq.${candidate.id}`, {
    method: 'PATCH',
    headers: { ...headers, prefer: 'return=minimal' },
    body: JSON.stringify({ buyer_user_id: buyer.id }),
  });

  return update.ok;
}

test('sin sesión /mis-boletos/ redirige a /ingresar/', async ({ page }) => {
  await page.goto('/mis-boletos/');

  await expect(page).toHaveURL(/\/ingresar\/\?next=%2Fmis-boletos%2F/);
  await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
});

test('sin sesión /cuenta/ redirige a /ingresar/', async ({ page }) => {
  await page.goto('/cuenta/');

  await expect(page).toHaveURL(/\/ingresar\/\?next=%2Fcuenta%2F/);
});

test('con sesión muestra el historial y abre un boleto con QR', async ({ page }) => {
  const hasOrder = await ensureBuyerOrder();
  test.skip(!hasOrder, 'No hay una orden confirmada de prueba para la cuenta. Corre antes la compra real (REAL_PURCHASE=1).');

  await signInAsBuyer(page);

  await expect(page.getByRole('heading', { level: 1, name: 'Mis boletos' })).toBeVisible();
  // La cabecera ofrece «Mis boletos» y «Mi cuenta» en lugar de «Ingresar».
  await expect(page.getByRole('navigation', { name: 'Cuenta y publicación' }).getByRole('link', { name: 'Mi cuenta' })).toBeVisible();

  const orders = page.getByRole('list').getByRole('listitem').filter({ hasText: 'Simulado' });
  await expect(orders.first()).toBeVisible();

  await orders.first().getByRole('link', { name: /Ver boletos/ }).click();

  await expect(page).toHaveURL(/\/confirmacion\/[0-9a-f-]{36}\/[A-Za-z0-9_-]{43}\/$/);
  await expect(page.getByRole('img', { name: 'Código QR del boleto 1' })).toBeVisible();
});

test('en Mi cuenta se guarda la universidad', async ({ page }) => {
  await signInAsBuyer(page);
  await page.goto('/cuenta/');

  await expect(page.getByRole('heading', { level: 1, name: 'Mi cuenta' })).toBeVisible();

  const university = page.getByLabel('Universidad (opcional)');
  await university.fill('Universidad DEMO');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toContainText('Guardamos tus cambios');

  await page.reload();
  await expect(page.getByLabel('Universidad (opcional)')).toHaveValue('Universidad DEMO');

  // Limpia el dato de prueba.
  await page.getByLabel('Universidad (opcional)').fill('');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toContainText('Guardamos tus cambios');
});

test('un comprador no entra a /panel/', async ({ page }) => {
  await signInAsBuyer(page);

  await page.goto('/panel/');

  await expect(page).toHaveURL(/\/mis-boletos\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mis boletos' })).toBeVisible();
});
