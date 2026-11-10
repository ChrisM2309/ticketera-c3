import { expect, test, type Page } from '@playwright/test';

/**
 * Flujo completo: Home → categoría → evento → carrito → checkout → confirmación.
 * El catálogo y la ficha salen de la base real (lectura anónima). Las llamadas que crean o
 * confirman una orden se simulan para no dejar órdenes de prueba en producción.
 */

const orderId = '55555555-5555-4555-8555-555555555555';
const checkoutToken = 'Q'.repeat(43);

const paidEvent = {
  category: '/congresos/',
  path: '/congresos/inteligencia-artificial/congreso-demo-ia/',
  ticket: 'General',
  quantity: 2,
  totalCents: 2100,
  subtotalCents: 2000,
  feeCents: 100,
};

const freeEvent = {
  category: '/hackathons/',
  path: '/hackathons/programacion/hackathon-demo-en-linea/',
  ticket: 'Registro gratuito',
  quantity: 1,
  totalCents: 0,
  subtotalCents: 0,
  feeCents: 0,
};

async function mockCreateOrder(page: Page, event: typeof paidEvent | typeof freeEvent) {
  await page.route('**/api/checkout/orders', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId,
        subtotalCents: event.subtotalCents,
        feeCents: event.feeCents,
        totalCents: event.totalCents,
        checkoutToken,
      }),
    });
  });
}

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
  await page.getByLabel('Nombre completo').fill('Ana DEMO');
  await page.getByLabel('Correo electrónico').fill('ana.demo@example.test');
  await page.getByRole('button', { name: /^(Pagar \$.+ · pago de demostración|Confirmar registro gratuito)$/ }).click();
}

async function expectNoHorizontalScroll(page: Page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(fits).toBe(true);
}

test.describe('compra de escritorio', () => {
  test('registro gratuito llega a la confirmación con enlace a los boletos', async ({ page }) => {
    await page.goto('/');
    await page.locator(`a[href="${freeEvent.category}"]:visible`).first().click();
    await expect(page).toHaveURL(new RegExp(freeEvent.category.replace(/\//g, '\\/')));

    await mockCreateOrder(page, freeEvent);
    await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({ checkoutToken, decision: null });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId, status: 'confirmed', ticketCount: 1, alreadyProcessed: false }),
      });
    });

    await selectTickets(page, freeEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveAttribute(
      'href',
      `/confirmacion/${orderId}/${checkoutToken}/`,
    );
  });

  test('pago DEMO aprobado confirma la orden y ofrece los boletos', async ({ page }) => {
    await page.goto('/');
    await page.locator(`a[href="${paidEvent.category}"]:visible`).first().click();

    await mockCreateOrder(page, paidEvent);
    await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({ checkoutToken, decision: 'approved' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId, status: 'confirmed', ticketCount: 2, alreadyProcessed: false }),
      });
    });

    await selectTickets(page, paidEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();
    await page.getByRole('radio', { name: /^Simular pago aprobado/ }).check();
    await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toBeVisible();
  });

  test('pago DEMO rechazado deja la orden fallida sin enlace a boletos', async ({ page }) => {
    await page.goto('/');
    await page.locator(`a[href="${paidEvent.category}"]:visible`).first().click();

    await mockCreateOrder(page, paidEvent);
    await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({ checkoutToken, decision: 'rejected' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId, status: 'failed', ticketCount: 0, alreadyProcessed: false }),
      });
    });

    await selectTickets(page, paidEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();
    await page.getByRole('radio', { name: /^Simular pago rechazado/ }).check();
    await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();

    await expect(page.getByRole('heading', { name: 'Pago rechazado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveCount(0);
  });
});

test.describe('compra en celular', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('registro gratuito en 375 px no desborda la página y llega a la confirmación', async ({ page }) => {
    await page.goto('/');
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Menú' }).click();
    await page.locator(`a[href="${freeEvent.category}"]:visible`).first().click();
    await expectNoHorizontalScroll(page);

    await mockCreateOrder(page, freeEvent);
    await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId, status: 'confirmed', ticketCount: 1, alreadyProcessed: false }),
      });
    });

    await selectTickets(page, freeEvent);
    await expectNoHorizontalScroll(page);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
