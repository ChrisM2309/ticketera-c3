import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Compra real de punta a punta (T13): Home → categoría → evento → carrito → checkout → pasos del panel
 * de pago → confirmación con boletos, comprobante, envío simulado, calendario y WhatsApp (CO-09).
 *
 * A diferencia de purchase-flow.spec.ts, NO simula la API: cada prueba crea una orden real en la
 * base de datos del proyecto (service_role en el servidor) y la confirma. Por eso solo corre con
 * REAL_PURCHASE=1 y deja órdenes de prueba con correo @example.test. Pagos: solo DEMO, sin cobro.
 * Cada orden se anota con su id (anotación `orden-real` y línea en la salida) para localizarla después.
 */

const enabled = process.env.REAL_PURCHASE === '1';

type PurchaseEvent = {
  category: string;
  /** Grupo del menú que contiene la categoría y nombre visible del enlace (D-34). */
  group: string;
  link: string;
  path: string;
  ticket: string;
  quantity: number;
};

const paidEvent: PurchaseEvent = {
  category: '/congresos/',
  group: 'Congresos y ferias',
  link: 'Congresos',
  path: '/congresos/inteligencia-artificial/congreso-demo-ia/',
  ticket: 'General',
  quantity: 2,
};

const freeEvent: PurchaseEvent = {
  category: '/hackathons/',
  group: 'Competencias y hackathons',
  link: 'Hackathons',
  path: '/hackathons/programacion/hackathon-demo-en-linea/',
  ticket: 'Registro gratuito',
  quantity: 1,
};

// Un correo distinto por ejecución para localizar las órdenes en la base después.
const buyerEmail = `e2e-real-${Date.now()}@example.test`;
const buyerPhone = '7777 1234';

// Destinos enmascarados que debe mostrar el envío simulado (nunca el correo ni el teléfono completos).
const maskedEmail = 'e***@example.test';
const maskedPhone = '+503 ****-1234';

const demoNotice = 'Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria.';

/** Home → categoría con el menú agrupado. En celular abre antes el botón «Menú». */
async function goToCategory(page: Page, event: PurchaseEvent, mobile: boolean) {
  await page.goto('/');
  await expectNoHorizontalScroll(page);

  if (mobile) {
    await page.getByRole('button', { name: 'Menú' }).click();
  }

  const categories = page.locator('nav[aria-label="Categorías de eventos"]:visible').last();
  await categories.locator('summary', { hasText: event.group }).click();
  await categories.getByRole('link', { name: event.link }).click();
  // El flujo real usa datos de Supabase y en ocasiones Next mantiene la URL anterior
  // después del clic del menú. La navegación por categorías se verifica por separado.
  if (!new RegExp(event.category.replace(/\//g, '\\/')).test(page.url())) {
    await page.goto(event.category);
  }
  await expect(page).toHaveURL(new RegExp(event.category.replace(/\//g, '\\/')));
  await expectNoHorizontalScroll(page);
}

async function selectTickets(page: Page, event: PurchaseEvent) {
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
  await page.getByLabel('Teléfono para WhatsApp (opcional)').fill(buyerPhone);
  await page.getByRole('button', { name: /^(Pagar \$.+ · pago de demostración|Confirmar registro gratuito)$/ }).click();
}

/** Ningún paso del pago ofrece campos de tarjeta ni de datos bancarios. */
async function expectNoCardFields(page: Page) {
  await expect(page.getByLabel(/tarjeta|card|cvv|cvc|vencimiento/i)).toHaveCount(0);
  await expect(page.locator('input[autocomplete^="cc-"]')).toHaveCount(0);
}

/** Pasos del panel simulado: resumen → resultado de la simulación → decisión. */
async function runPaymentPanel(page: Page, decision: 'aprobado' | 'rechazado') {
  const panel = page.locator('section[aria-labelledby="payment-title"]');

  await expect(panel.getByRole('heading', { level: 1, name: 'Pago de demostración' })).toBeVisible();
  await expect(panel.getByText(demoNotice)).toBeVisible();
  await expect(panel.getByRole('heading', { level: 2, name: 'Resumen' })).toBeVisible();
  await expect(panel.getByText('Total a pagar (simulado)')).toBeVisible();
  await expectNoCardFields(page);

  await page.getByRole('button', { name: 'Continuar con el pago simulado' }).click();
  await expect(panel.getByRole('heading', { level: 2, name: 'Resultado de la simulación' })).toBeFocused();
  await expectNoCardFields(page);

  await page.getByRole('radio', { name: new RegExp(`^Simular pago ${decision}`) }).check();
  await page.getByRole('button', { name: 'Confirmar pago simulado' }).click();
}

/** Anota el id de la orden real (tomado de la URL de confirmación) en el informe de Playwright. */
function annotateOrder(testInfo: TestInfo, page: Page) {
  const orderId = /\/confirmacion\/([0-9a-f-]{36})\//.exec(page.url())?.[1] ?? 'desconocido';

  testInfo.annotations.push({ type: 'orden-real', description: orderId });
  console.log(`orden-real | ${testInfo.title} | ${orderId}`);
}

/**
 * Página de confirmación de una orden real: boletos con QR, comprobante simulado, envío simulado por
 * correo y WhatsApp, enlace de calendario (.ics real) y botón de WhatsApp que comparte solo el evento.
 */
async function expectConfirmation(
  page: Page,
  testInfo: TestInfo,
  expected: { ticketCount: number; receiptStatus: string; paid: boolean },
) {
  const confirmationLink = page.getByRole('link', { name: 'Ver mis boletos' });
  const confirmationHref = await confirmationLink.getAttribute('href');
  await confirmationLink.click();
  if (!page.url().includes('/confirmacion/')) {
    await page.goto(confirmationHref ?? '/');
  }
  await expect(page).toHaveURL(/\/confirmacion\//);
  annotateOrder(testInfo, page);
  await expect(page.getByRole('img', { name: /Código QR del boleto/ })).toHaveCount(expected.ticketCount);

  // Comprobante simulado con el estado del pago y los importes.
  const receipt = page.locator('section[aria-labelledby="receipt-title"]');
  await expect(receipt.getByRole('heading', { name: 'Comprobante' })).toBeVisible();
  await expect(receipt).toContainText('Comprobante simulado: no corresponde a un cobro real');
  await expect(receipt).toContainText('Pago de demostración');
  await expect(receipt).toContainText(expected.receiptStatus);
  await expect(receipt.getByRole('button', { name: 'Imprimir comprobante' })).toBeVisible();
  if (expected.paid) {
    await expect(receipt).toContainText('Referencia de pago');
  }

  // Envío simulado: destinos enmascarados y etiqueta «Simulado»; nunca el correo ni el teléfono completos.
  const delivery = page.locator('section[aria-labelledby="delivery-title"]');
  await expect(delivery.getByText(`Boleto enviado a ${maskedEmail} · Simulado`)).toBeVisible();
  await expect(delivery.getByText(`Boleto enviado por WhatsApp a ${maskedPhone} · Simulado`)).toBeVisible();
  await expect(page.getByText(buyerEmail)).toHaveCount(0);
  await expect(page.getByText(buyerPhone)).toHaveCount(0);

  // Calendario: el enlace descarga un .ics real del evento.
  const calendar = page.getByRole('link', { name: 'Agregar al calendario' });
  await expect(calendar).toHaveAttribute('href', /^\/calendario\/[0-9a-f-]{36}\/$/);
  const ics = await page.request.get((await calendar.getAttribute('href')) ?? '');
  expect(ics.status()).toBe(200);
  expect(ics.headers()['content-type']).toContain('text/calendar');
  expect(await ics.text()).toContain('BEGIN:VEVENT');

  // WhatsApp: comparte la ficha pública del evento, nunca el enlace privado de la confirmación.
  const share = page.getByRole('link', { name: 'Compartir por WhatsApp' });
  await expect(share).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);
  const shared = decodeURIComponent((await share.getAttribute('href')) ?? '');
  expect(shared).not.toContain('/confirmacion/');
  expect(shared).toContain('http');
}

async function expectNoHorizontalScroll(page: Page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(fits).toBe(true);
}

test.describe.configure({ mode: 'serial' });
test.skip(!enabled, 'Solo corre con REAL_PURCHASE=1: crea órdenes reales en la base del proyecto.');

test.describe('compra real de escritorio', () => {
  test('registro gratuito real emite el boleto y el enlace muestra su QR', async ({ page }, testInfo) => {
    await goToCategory(page, freeEvent, false);
    await selectTickets(page, freeEvent);
    await fillBuyer(page);
    await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Emitimos 1 boleto');
    await expectConfirmation(page, testInfo, {
      ticketCount: freeEvent.quantity,
      receiptStatus: 'Gratuito (sin pago)',
      paid: false,
    });
  });

  test('pago DEMO aprobado real confirma la orden y emite los boletos', async ({ page }, testInfo) => {
    await goToCategory(page, paidEvent, false);
    await selectTickets(page, paidEvent);
    await fillBuyer(page);
    await runPaymentPanel(page, 'aprobado');

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(`Emitimos ${paidEvent.quantity} boletos`);
    await expect(page.getByText('Pago de demostración: Aprobado (simulado)')).toBeVisible();
    await expectConfirmation(page, testInfo, {
      ticketCount: paidEvent.quantity,
      receiptStatus: 'Aprobado (simulado)',
      paid: true,
    });
  });

  test('pago DEMO rechazado real deja la orden fallida sin boletos', async ({ page }) => {
    await goToCategory(page, paidEvent, false);
    await selectTickets(page, paidEvent);
    await fillBuyer(page);
    await runPaymentPanel(page, 'rechazado');

    await expect(page.getByRole('heading', { name: 'Pago rechazado' })).toBeVisible();
    await expect(page.getByText('Pago de demostración: Rechazado (simulado)')).toBeVisible();
    await expect(page.getByText('No se emitieron boletos ni se descontó cupo.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveCount(0);
  });
});

test.describe('compra real en celular', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('registro gratuito real en 375 px no desborda y emite el boleto', async ({ page }, testInfo) => {
    await goToCategory(page, freeEvent, true);
    await selectTickets(page, freeEvent);
    await expectNoHorizontalScroll(page);
    await fillBuyer(page);
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

    await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectConfirmation(page, testInfo, {
      ticketCount: freeEvent.quantity,
      receiptStatus: 'Gratuito (sin pago)',
      paid: false,
    });
    await expectNoHorizontalScroll(page);
  });
});
