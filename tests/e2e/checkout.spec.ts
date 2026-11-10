import { expect, test, type Page } from '@playwright/test';

const cartStorageKey = 'ticketera-c3-cart-v1';
const checkoutStorageKey = 'ticketera-c3-checkout-v1';
const storedCart = {
  version: 1,
  event: {
    id: 'event-ia',
    slug: 'congreso-demo-ia',
    title: 'Congreso demo de IA',
    startsAt: '2027-04-15T21:00:00Z',
    mode: 'presencial',
    venue: 'Sede DEMO, San Salvador',
    eventType: { slug: 'congresos', name: 'Congresos' },
    topic: { slug: 'inteligencia-artificial', name: 'Inteligencia artificial' },
    ticketTypes: [
      {
        id: 'general',
        name: 'General',
        priceCents: 1000,
        quantityTotal: 150,
        quantitySold: 0,
        maxPerOrder: 4,
        isActive: true,
      },
      {
        id: 'premium',
        name: 'Premium',
        priceCents: 2500,
        quantityTotal: 40,
        quantitySold: 0,
        maxPerOrder: 2,
        isActive: true,
      },
    ],
  },
  items: [
    { ticketTypeId: 'general', quantity: 2 },
    { ticketTypeId: 'premium', quantity: 1 },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.goto('/checkout/');
  await page.evaluate(({ cartKey, checkoutKey }) => {
    window.localStorage.removeItem(cartKey);
    window.sessionStorage.removeItem(checkoutKey);
  }, { cartKey: cartStorageKey, checkoutKey: checkoutStorageKey });
});

test('checkout de invitado envía solo selección y muestra los importes verificados', async ({ page }) => {
  await page.route('**/api/checkout/orders', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      eventId: 'event-ia',
      items: [
        { ticketTypeId: 'general', quantity: 2 },
        { ticketTypeId: 'premium', quantity: 1 },
      ],
      buyer: { name: 'Ana DEMO', email: 'ana@example.test' },
    });
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: '33333333-3333-4333-8333-333333333333',
        subtotalCents: 4500,
        feeCents: 225,
        totalCents: 4725,
        checkoutToken: 'secreto-solo-de-sesion',
      }),
    });
  });
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: storedCart });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Finalizá tu compra' })).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('required', '');

  await page.getByLabel('Nombre completo').fill('Ana DEMO');
  await page.getByLabel('Correo electrónico').fill('ana@example.test');
  await page.getByRole('button', { name: 'Pagar $47.25 · pago de demostración' }).click();

  await expect(page.getByRole('heading', { name: 'Elegí el resultado del pago' })).toBeVisible();
  await expect(page.getByText('Total verificado')).toBeVisible();
  await expect(page.getByText('$47.25')).toBeVisible();
  await expect(page).not.toHaveURL(/secreto-solo-de-sesion/);
  await expect
    .poll(() => page.evaluate(({ cartKey, checkoutKey }) => ({
      cart: window.localStorage.getItem(cartKey),
      checkout: window.sessionStorage.getItem(checkoutKey),
    }), { cartKey: cartStorageKey, checkoutKey: checkoutStorageKey }))
    .toEqual({
      cart: null,
      checkout: JSON.stringify({
        orderId: '33333333-3333-4333-8333-333333333333',
        checkoutToken: 'secreto-solo-de-sesion',
      }),
    });
});

test('checkout vacío explica cómo volver al evento', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Todavía no agregaste entradas.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver al carrito' })).toBeVisible();
});

test('checkout anuncia los errores de datos de comprador', async ({ page }) => {
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: storedCart });
  await page.reload();

  await page.getByRole('button', { name: 'Pagar $47.25 · pago de demostración' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Ingresá tu nombre completo.' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Ingresá un correo electrónico válido.' })).toBeVisible();
});

const orderId = '44444444-4444-4444-8444-444444444444';
const checkoutToken = 'T'.repeat(43);
const freeCart = {
  ...storedCart,
  event: {
    ...storedCart.event,
    ticketTypes: [
      {
        id: 'free',
        name: 'Registro gratuito',
        priceCents: 0,
        quantityTotal: 200,
        quantitySold: 0,
        maxPerOrder: 4,
        isActive: true,
      },
    ],
  },
  items: [{ ticketTypeId: 'free', quantity: 2 }],
};

/** Nombre accesible del botón principal del checkout según el total (gratuito o pago de demostración). */
function submitName(totalCents: number): string {
  return totalCents === 0 ? 'Confirmar registro gratuito' : 'Pagar $47.25 · pago de demostración';
}

/** Crea la orden con la API simulada y deja la página en el paso de pago. */
async function reachPaymentStep(page: Page, cart: typeof storedCart, totalCents: number) {
  await page.route('**/api/checkout/orders', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId,
        subtotalCents: totalCents === 0 ? 0 : 4500,
        feeCents: totalCents === 0 ? 0 : 225,
        totalCents,
        checkoutToken,
      }),
    });
  });
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: cart });
  await page.reload();
  await page.getByLabel('Nombre completo').fill('Ana DEMO');
  await page.getByLabel('Correo electrónico').fill('ana@example.test');
  await page.getByRole('button', { name: submitName(totalCents) }).click();
  await expect(page.getByRole('heading', { name: /Confirmá tu registro|Elegí el resultado del pago/ })).toBeVisible();
}

test('registro gratuito se confirma sin pasarela y muestra los boletos emitidos', async ({ page }) => {
  await reachPaymentStep(page, freeCart, 0);
  await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ checkoutToken, decision: null });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId,
        status: 'confirmed',
        ticketCount: 2,
        alreadyProcessed: false,
        tickets: ['qr-1', 'qr-2'],
      }),
    });
  });

  await page.getByRole('button', { name: 'Confirmar registro gratuito' }).click();

  await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Emitimos 2 boletos para esta orden.' })).toBeVisible();
  await expect(page.getByText('Modo demostración')).toHaveCount(0);
});

test('pago DEMO aprobado confirma la orden y explica que no hubo cobro', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4725);
  await expect(page.getByText('no se cobrará dinero ni se solicitará información bancaria')).toBeVisible();
  await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ checkoutToken, decision: 'approved' });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orderId, status: 'confirmed', ticketCount: 3, alreadyProcessed: false, tickets: [] }),
    });
  });

  await page.getByRole('button', { name: 'Simular pago aprobado' }).click();

  await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Emitimos 3 boletos para esta orden.' })).toBeVisible();
});

test('pago DEMO rechazado deja la orden fallida sin boletos', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4725);
  await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ checkoutToken, decision: 'rejected' });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orderId, status: 'failed', ticketCount: 0, alreadyProcessed: false, tickets: [] }),
    });
  });

  await page.getByRole('button', { name: 'Simular pago rechazado' }).click();

  await expect(page.getByRole('heading', { name: 'Pago rechazado' })).toBeVisible();
  await expect(page.getByText('No se emitieron boletos ni se descontó cupo.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
});

test('un error del servidor se anuncia y el comprador puede reintentar', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4725);
  let attempts = 0;
  await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
    attempts += 1;
    await route.fulfill({
      status: attempts === 1 ? 500 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        attempts === 1
          ? { error: 'No pudimos confirmar la orden. Intentá nuevamente.' }
          : { orderId, status: 'confirmed', ticketCount: 3, alreadyProcessed: false, tickets: [] },
      ),
    });
  });

  await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos confirmar la orden.' })).toBeVisible();

  await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
  await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
});

test.describe('móvil de 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.evaluate(({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    }, { key: cartStorageKey, value: storedCart });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Finalizá tu compra' })).toBeVisible();
  });

  test('subtotal, comisión y total se ven antes del botón de pago', async ({ page }) => {
    const boton = page.getByRole('button', { name: 'Pagar $47.25 · pago de demostración' });
    await expect(boton).toBeVisible();
    const botonBox = await boton.boundingBox();
    expect(botonBox).not.toBeNull();

    for (const nombre of ['Subtotal', /^Comisión DEMO/, 'Total provisional']) {
      const fila = page.locator('dt').filter({ hasText: nombre });
      await expect(fila).toBeVisible();
      const filaBox = await fila.boundingBox();
      expect(filaBox).not.toBeNull();
      expect(filaBox!.y + filaBox!.height).toBeLessThanOrEqual(botonBox!.y);
    }

    await expect(page.locator('dd').filter({ hasText: /^\$45$/ })).toBeVisible();
    await expect(page.locator('dd').filter({ hasText: /^\$2\.25$/ })).toBeVisible();
    await expect(page.locator('dd').filter({ hasText: /^\$47\.25$/ })).toBeVisible();
  });

  test('el botón de pago está dentro del primer scroll tras llenar los datos', async ({ page }) => {
    await page.getByLabel('Nombre completo').fill('Ana DEMO');
    await page.getByLabel('Correo electrónico').fill('ana@example.test');

    const boton = page.getByRole('button', { name: 'Pagar $47.25 · pago de demostración' });
    await expect(boton).toBeVisible();
    const box = await boton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThanOrEqual(812);

    const sinScrollHorizontal = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(sinScrollHorizontal).toBe(true);
  });
});
