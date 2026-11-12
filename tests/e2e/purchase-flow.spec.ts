import { expect, test, type Page } from '@playwright/test';

/**
 * Flujo completo: Home → categoría → evento → carrito → checkout → Wompi o registro gratis.
 * El catálogo y la ficha salen de la base real (lectura anónima). Las llamadas que crean o confirman una
 * orden se simulan para no dejar órdenes de prueba en producción.
 *
 * Las llamadas de orden se simulan para no escribir en la base; Wompi se enruta a una página local de prueba.
 */

const orderId = '55555555-5555-4555-8555-555555555555';
const checkoutToken = 'Q'.repeat(43);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PurchaseEvent = {
  category: string;
  /** Grupo del menú que contiene la categoría y nombre visible del enlace (D-34). */
  group: string;
  link: string;
  path: string;
  ticket: string;
  quantity: number;
  totalCents: number;
  subtotalCents: number;
  feeCents: number;
};

const paidEvent: PurchaseEvent = {
  category: '/congresos/',
  group: 'Congresos y ferias',
  link: 'Congresos',
  path: '/congresos/inteligencia-artificial/congreso-demo-ia/',
  ticket: 'General',
  quantity: 2,
  totalCents: 2000,
  subtotalCents: 2000,
  feeCents: 0,
};

const freeEvent: PurchaseEvent = {
  category: '/competencias/',
  group: 'Competencias y hackathons',
  link: 'Competencias',
  path: '/hackathons/programacion/hackathon-demo-en-linea/',
  ticket: 'Registro gratuito',
  quantity: 1,
  totalCents: 0,
  subtotalCents: 0,
  feeCents: 0,
};

const buyerPhone = '7777 1234';

/** Responde a la creación de la orden y guarda el cuerpo que envió el navegador. */
async function mockCreateOrder(page: Page, event: PurchaseEvent) {
  const requests: unknown[] = [];

  await page.route('**/api/checkout/orders', async (route) => {
    requests.push(route.request().postDataJSON());
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

  return requests;
}

type ConfirmBody = { checkoutToken: string };

/** Responde a la confirmación de una orden gratuita y comprueba su token. */
async function mockConfirmOrder(
  page: Page,
  result: { status: 'confirmed' | 'failed'; ticketCount: number },
) {
  const requests: ConfirmBody[] = [];

  await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
    requests.push(route.request().postDataJSON() as ConfirmBody);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orderId, ...result, alreadyProcessed: false }),
    });
  });

  return requests;
}

async function expectNoHorizontalScroll(page: Page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(fits).toBe(true);
}

/** Home → categoría. En escritorio abre el grupo del menú; en celular, el botón «Menú» y el grupo. */
async function goToCategory(page: Page, event: PurchaseEvent, mobile: boolean) {
  await page.goto('/');
  await expectNoHorizontalScroll(page);

  if (mobile) {
    await page.getByRole('button', { name: 'Menú' }).click();
  }

  const categories = page.locator('nav[aria-label="Categorías de eventos"]:visible').last();
  await categories.locator('summary', { hasText: event.group }).click();
  await categories.getByRole('link', { name: event.link }).click();
  await expect(page).toHaveURL(new RegExp(event.category.replace(/\//g, '\\/')));
  await expectNoHorizontalScroll(page);
}

/** Ficha → carrito → checkout. Las acciones sociales aparecen después de comprar. */
async function selectTickets(page: Page, event: PurchaseEvent) {
  await page.locator(`a[href="${event.path}"]:visible`).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agregar al calendario' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Compartir por WhatsApp' })).toHaveCount(0);

  for (let index = 0; index < event.quantity; index += 1) {
    await page.getByRole('button', { name: `Agregar una entrada de ${event.ticket}` }).click();
  }

  await page.getByRole('link', { name: 'Continuar al carrito' }).click();
  await expect(page).toHaveURL(/\/carrito\//);
  await expectNoHorizontalScroll(page);
  await page.getByRole('link', { name: 'Continuar al checkout' }).click();
  await expect(page).toHaveURL(/\/checkout\//);
  await expectNoHorizontalScroll(page);
}

/** Datos del comprador (con teléfono opcional) y creación de la orden; devuelve el cuerpo enviado. */
async function fillBuyer(page: Page, orderRequests: unknown[]) {
  await page.getByLabel('Nombre completo').fill('Ana DEMO');
  await page.getByLabel('Correo electrónico').fill('ana.demo@example.test');
  await page.getByLabel('Teléfono para WhatsApp (opcional)').fill(buyerPhone);
  await page.getByRole('button', { name: /^(Pagar \$.+|Confirmar registro gratuito)$/ }).click();

  await expect.poll(() => orderRequests.length).toBe(1);
  const body = orderRequests[0] as { requestId: string; buyer: { name: string; email: string; phone?: string } };

  // El navegador envía un request id (clave de idempotencia) y el teléfono tal como se escribió.
  expect(body.requestId).toMatch(uuidPattern);
  expect(body.buyer).toEqual({ name: 'Ana DEMO', email: 'ana.demo@example.test', phone: buyerPhone });
}

async function mockWompiStart(page: Page) {
  const requests: Array<{ checkoutToken: string }> = [];
  await page.route('https://pay.test/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Pago Wompi de prueba</h1>' });
  });
  await page.route(`**/api/checkout/orders/${orderId}/pago/`, async (route) => {
    requests.push(route.request().postDataJSON() as { checkoutToken: string });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ redirectUrl: 'https://pay.test/checkout/1' }),
    });
  });
  return requests;
}

/** Ningún paso del pago ofrece campos de tarjeta ni de datos bancarios. */
async function expectNoCardFields(page: Page) {
  await expect(page.getByLabel(/tarjeta|card|cvv|cvc|vencimiento/i)).toHaveCount(0);
  await expect(page.locator('input[autocomplete^="cc-"]')).toHaveCount(0);
}

type Viewport = { name: string; size: { width: number; height: number }; mobile: boolean };

const viewports: readonly Viewport[] = [
  { name: 'escritorio 1280 px', size: { width: 1280, height: 800 }, mobile: false },
  { name: 'celular 375 px', size: { width: 375, height: 812 }, mobile: true },
];

for (const viewport of viewports) {
  test.describe(`compra simulada en ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test('registro gratuito llega a la confirmación con enlace a los boletos', async ({ page }) => {
      const orderRequests = await mockCreateOrder(page, freeEvent);
      const confirmRequests = await mockConfirmOrder(page, { status: 'confirmed', ticketCount: 1 });

      await goToCategory(page, freeEvent, viewport.mobile);
      await selectTickets(page, freeEvent);
      await fillBuyer(page, orderRequests);

      // El registro se confirma al crear la orden y conduce directamente al acceso de boletos.
      await expect(page.getByRole('heading', { level: 1, name: 'Orden confirmada' })).toBeVisible();
      await expectNoCardFields(page);
      await expectNoHorizontalScroll(page);

      await expect(page.getByRole('status')).toContainText('Emitimos 1 boleto');
      await expect(page.getByText('Pago de demostración:')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveAttribute(
        'href',
        `/confirmacion/${orderId}/${checkoutToken}/`,
      );
      expect(confirmRequests).toEqual([{ checkoutToken }]);
      await expectNoHorizontalScroll(page);
    });

    test('una sola acción inicia Wompi sin cobrarle una comisión al comprador', async ({ page }) => {
      const orderRequests = await mockCreateOrder(page, paidEvent);
      const paymentRequests = await mockWompiStart(page);

      await goToCategory(page, paidEvent, viewport.mobile);
      await selectTickets(page, paidEvent);
      await fillBuyer(page, orderRequests);

      await expect(page.getByRole('heading', { name: 'Pago Wompi de prueba' })).toBeVisible();
      expect(paymentRequests).toEqual([{ checkoutToken }]);
      expect((orderRequests[0] as { items: unknown }).items).toBeDefined();
      await expectNoHorizontalScroll(page);
    });

    test('el pago no se confirma hasta que Wompi lo reporte', async ({ page }) => {
      const orderRequests = await mockCreateOrder(page, paidEvent);
      const confirmRequests: ConfirmBody[] = [];
      await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
        confirmRequests.push(route.request().postDataJSON() as ConfirmBody);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orderId, status: 'confirmed', ticketCount: 2 }) });
      });
      await mockWompiStart(page);

      await goToCategory(page, paidEvent, viewport.mobile);
      await selectTickets(page, paidEvent);
      await fillBuyer(page, orderRequests);

      await expect(page.getByRole('heading', { name: 'Pago Wompi de prueba' })).toBeVisible();
      expect(confirmRequests).toEqual([]);
      await expectNoHorizontalScroll(page);
    });
  });
}
