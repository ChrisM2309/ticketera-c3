import { expect, test, type Page } from '@playwright/test';

/**
 * Compra real de punta a punta (T13): Home → categoría → evento → carrito → checkout → confirmación.
 *
 * A diferencia de purchase-flow.spec.ts, NO simula la API: cada prueba crea una orden real en la
 * base de datos del proyecto (service_role en el servidor) y la confirma. Por eso solo corre con
 * REAL_PURCHASE=1 y deja órdenes de prueba con correo @example.test. Pagos: solo DEMO, sin cobro.
 */

const enabled = process.env.REAL_PURCHASE === '1';

const paidEvent = {
  category: '/congresos/',
  path: '/congresos/inteligencia-artificial/congreso-demo-ia/',
  ticket: 'General',
  quantity: 2,
};

const freeEvent = {
  category: '/hackathons/',
  path: '/hackathons/programacion/hackathon-demo-en-linea/',
  ticket: 'Registro gratuito',
  quantity: 1,
};

// Un correo distinto por ejecución para localizar las órdenes en la base después.
const buyerEmail = `e2e-real-${Date.now()}@example.test`;

async function selectTickets(page: Page, event: typeof paidEvent | typeof freeEvent) {
  await page.locator(`a[href="${event.path}"]:visible`).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  for (let index = 0; index < event.quantity; index += 1) {
    await page.getByRole('button', { name: `Agregar una entrada de ${event.ticket}` }).click();
  }

  await page.getByRole('link', { name: 'Continuar al carrito' }).click();
  await expect(page).toHaveURL(/\/carrito\//);
  await page.getByRole('link', { name: 'Continuar al checkout' }).click();
  await expect(page).toHaveURL(/\/checkout\//);
}

async function fillBuyer(page: Page) {
  await page.getByLabel('Nombre completo').fill('Prueba E2E real');
  await page.getByLabel('Correo electrónico').fill(buyerEmail);
  await page.getByRole('button', { name: /^(Pagar \$.+ · pago de demostración|Confirmar registro gratuito)$/ }).click();
}

async function expectTicketsOnConfirmation(page: Page, ticketCount: number) {
  await page.getByRole('link', { name: 'Ver mis boletos' }).click();
  await expect(page).toHaveURL(/\/confirmacion\//);
  await expect(page.getByRole('img', { name: /Código QR del boleto/ })).toHaveCount(ticketCount);
}

async function expectNoHorizontalScroll(page: Page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(fits).toBe(true);
}

test.describe.configure({ mode: 'serial' });
test.skip(!enabled, 'Solo corre con REAL_PURCHASE=1: crea órdenes reales en la base del proyecto.');

test.describe('compra real de escritorio', () => {
  test('registro gratuito real emite el boleto y el enlace muestra su QR', async ({ page }) => {
    await page.goto('/');
    await page.locator(`a[href="${freeEvent.category}"]:visible`).first().click();
    await selectTickets(page, freeEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Emitimos 1 boleto');
    await expectTicketsOnConfirmation(page, freeEvent.quantity);
  });

  test('pago DEMO aprobado real confirma la orden y emite los boletos', async ({ page }) => {
    await page.goto('/');
    await page.locator(`a[href="${paidEvent.category}"]:visible`).first().click();
    await selectTickets(page, paidEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Simular pago aprobado' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(`Emitimos ${paidEvent.quantity} boletos`);
    await expectTicketsOnConfirmation(page, paidEvent.quantity);
  });

  test('pago DEMO rechazado real deja la orden fallida sin boletos', async ({ page }) => {
    await page.goto('/');
    await page.locator(`a[href="${paidEvent.category}"]:visible`).first().click();
    await selectTickets(page, paidEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Simular pago rechazado' }).click();

    await expect(page.getByRole('heading', { name: 'Pago rechazado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveCount(0);
  });
});

test.describe('compra real en celular', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('registro gratuito real en 375 px no desborda y emite el boleto', async ({ page }) => {
    await page.goto('/');
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Menú' }).click();
    await page.locator(`a[href="${freeEvent.category}"]:visible`).first().click();
    await expectNoHorizontalScroll(page);
    await selectTickets(page, freeEvent);
    await expectNoHorizontalScroll(page);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
