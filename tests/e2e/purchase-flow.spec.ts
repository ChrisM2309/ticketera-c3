import { expect, test, type Page } from '@playwright/test';

/**
 * Flujo completo: Home → categoría → evento → carrito → checkout → pasos del panel de pago → confirmación.
 * El catálogo y la ficha salen de la base real (lectura anónima). Las llamadas que crean o confirman una
 * orden se simulan para no dejar órdenes de prueba en producción.
 *
 * La página `/confirmacion/…` (comprobante, «Boleto enviado… · Simulado», enlace de calendario y botón de
 * WhatsApp) se renderiza en el servidor con la orden real, así que una orden simulada no puede verla:
 * esos elementos se comprueban en purchase-flow-real.spec.ts. Aquí se cubren los mismos enlaces desde la
 * ficha del evento y el resumen del comprobante que muestra el propio panel al confirmar.
 */

const orderId = '55555555-5555-4555-8555-555555555555';
const checkoutToken = 'Q'.repeat(43);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const demoNotice = 'Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria.';

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
  totalCents: 2100,
  subtotalCents: 2000,
  feeCents: 100,
};

const freeEvent: PurchaseEvent = {
  category: '/hackathons/',
  group: 'Competencias y hackathons',
  link: 'Hackathons',
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

type ConfirmBody = { checkoutToken: string; decision: 'approved' | 'rejected' | null };

/** Responde a la confirmación y guarda el cuerpo para comprobar token y decisión. */
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

  const categories = page.getByRole('navigation', { name: 'Categorías de eventos' }).locator('visible=true');
  await categories.locator('summary', { hasText: event.group }).click();
  await categories.getByRole('link', { name: event.link }).click();
  await expect(page).toHaveURL(new RegExp(event.category.replace(/\//g, '\\/')));
  await expectNoHorizontalScroll(page);
}

/** Ficha → carrito → checkout. En la ficha comprueba los enlaces de calendario y de WhatsApp. */
async function selectTickets(page: Page, event: PurchaseEvent) {
  await page.locator(`a[href="${event.path}"]:visible`).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Agregar al calendario' })).toHaveAttribute(
    'href',
    /^\/calendario\/[0-9a-f-]{36}\/$/,
  );
  const share = page.getByRole('link', { name: 'Compartir por WhatsApp' });
  await expect(share).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);
  await expect(share).toHaveAttribute('target', '_blank');
  await expect(share).toHaveAttribute('rel', /noopener/);
  expect(decodeURIComponent((await share.getAttribute('href')) ?? '')).not.toContain('/confirmacion/');

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
  await page.getByRole('button', { name: /^(Pagar \$.+ · pago de demostración|Confirmar registro gratuito)$/ }).click();

  await expect.poll(() => orderRequests.length).toBe(1);
  const body = orderRequests[0] as { requestId: string; buyer: { name: string; email: string; phone?: string } };

  // El navegador envía un request id (clave de idempotencia) y el teléfono tal como se escribió.
  expect(body.requestId).toMatch(uuidPattern);
  expect(body.buyer).toEqual({ name: 'Ana DEMO', email: 'ana.demo@example.test', phone: buyerPhone });
}

/** Ningún paso del pago ofrece campos de tarjeta ni de datos bancarios. */
async function expectNoCardFields(page: Page) {
  await expect(page.getByLabel(/tarjeta|card|cvv|cvc|vencimiento/i)).toHaveCount(0);
  await expect(page.locator('input[autocomplete^="cc-"]')).toHaveCount(0);
}

/** Sección del paso de pago; el carrito también tiene un «Resumen», por eso se acota. */
const paymentSection = (page: Page) => page.locator('section[aria-labelledby="payment-title"]');

/** Pasos del panel simulado: resumen → resultado de la simulación → decisión. */
async function runPaymentPanel(page: Page, decision: 'aprobado' | 'rechazado') {
  const panel = paymentSection(page);

  await expect(panel.getByRole('heading', { level: 1, name: 'Pago de demostración' })).toBeVisible();
  await expect(panel.getByText(demoNotice)).toBeVisible();
  await expect(panel.getByRole('heading', { level: 2, name: 'Resumen' })).toBeVisible();
  await expect(panel.getByText('Total a pagar (simulado)')).toBeVisible();
  await expectNoCardFields(page);
  await expectNoHorizontalScroll(page);

  await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();

  const methodTitle = panel.getByRole('heading', { level: 2, name: 'Resultado de la simulación' });
  await expect(methodTitle).toBeVisible();
  await expect(methodTitle).toBeFocused();
  await expect(page.getByRole('radio')).toHaveCount(2);
  await expectNoCardFields(page);
  await expectNoHorizontalScroll(page);

  // Sin elegir resultado no se envía nada: el panel pide elegir uno.
  await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Elegí el resultado que quieres simular.' })).toBeVisible();

  // Volver al resumen y regresar conserva el flujo.
  await page.getByRole('button', { name: 'Volver al resumen' }).click();
  await expect(panel.getByRole('heading', { level: 2, name: 'Resumen' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();

  await page.getByRole('radio', { name: new RegExp(`^Simular pago ${decision}`) }).check();
  await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();
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

      // Sin pago: un solo paso de confirmación, sin panel simulado ni campos de tarjeta.
      await expect(paymentSection(page).getByRole('heading', { level: 1, name: 'Confirmá tu registro' })).toBeVisible();
      await expect(paymentSection(page).getByRole('heading', { level: 2 })).toHaveCount(0);
      await expectNoCardFields(page);
      await expectNoHorizontalScroll(page);
      await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

      await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
      await expect(page.getByRole('status')).toContainText('Emitimos 1 boleto');
      await expect(page.getByText('Pago de demostración:')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveAttribute(
        'href',
        `/confirmacion/${orderId}/${checkoutToken}/`,
      );
      expect(confirmRequests).toEqual([{ checkoutToken, decision: null }]);
      await expectNoHorizontalScroll(page);
    });

    test('pago DEMO aprobado confirma la orden y ofrece los boletos', async ({ page }) => {
      const orderRequests = await mockCreateOrder(page, paidEvent);
      const confirmRequests = await mockConfirmOrder(page, { status: 'confirmed', ticketCount: 2 });

      await goToCategory(page, paidEvent, viewport.mobile);
      await selectTickets(page, paidEvent);
      await fillBuyer(page, orderRequests);
      await runPaymentPanel(page, 'aprobado');

      await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
      await expect(page.getByRole('status')).toContainText('Emitimos 2 boletos');
      await expect(page.getByText('Pago de demostración: Aprobado (simulado)')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveAttribute(
        'href',
        `/confirmacion/${orderId}/${checkoutToken}/`,
      );
      expect(confirmRequests).toEqual([{ checkoutToken, decision: 'approved' }]);
      await expectNoHorizontalScroll(page);
    });

    test('pago DEMO rechazado deja la orden fallida sin enlace a boletos', async ({ page }) => {
      const orderRequests = await mockCreateOrder(page, paidEvent);
      const confirmRequests = await mockConfirmOrder(page, { status: 'failed', ticketCount: 0 });

      await goToCategory(page, paidEvent, viewport.mobile);
      await selectTickets(page, paidEvent);
      await fillBuyer(page, orderRequests);
      await runPaymentPanel(page, 'rechazado');

      await expect(page.getByRole('heading', { name: 'Pago rechazado' })).toBeVisible();
      await expect(page.getByText('No se emitieron boletos ni se descontó cupo.')).toBeVisible();
      await expect(page.getByText('Pago de demostración: Rechazado (simulado)')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveCount(0);
      expect(confirmRequests).toEqual([{ checkoutToken, decision: 'rejected' }]);
      await expectNoHorizontalScroll(page);
    });
  });
}
