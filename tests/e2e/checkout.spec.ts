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
      requestId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
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
        feeCents: 0,
        totalCents: 4500,
        checkoutToken: 'secreto-solo-de-sesion',
      }),
    });
  });
  let paymentStarts = 0;
  await page.route('**/api/checkout/orders/33333333-3333-4333-8333-333333333333/pago/', async (route) => {
    paymentStarts += 1;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'No pudimos iniciar el pago. Intenta nuevamente.' }),
    });
  });
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: storedCart });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Finaliza tu compra' })).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('required', '');

  await page.getByLabel('Nombre completo').fill('Ana DEMO');
  await page.getByLabel('Correo electrónico').fill('ana@example.test');
  await expect(page.getByText('Comisión')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pagar $45' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Pago de demostración' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos iniciar el pago.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pagar \$45 con Wompi/ })).toBeVisible();
  expect(paymentStarts).toBe(1);
  await expect(page.locator('dd').filter({ hasText: /^\$45$/ }).first()).toBeVisible();
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

  await page.getByRole('button', { name: 'Pagar $45' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Ingresa tu nombre completo.' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Ingresa un correo electrónico válido.' })).toBeVisible();
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

/** Nombre accesible del botón principal del checkout según el total. */
function submitName(totalCents: number): string {
  return totalCents === 0 ? 'Confirmar registro gratuito' : 'Pagar $45';
}

/** Crea la orden; las entradas pagadas inician Wompi y las gratuitas se confirman automáticamente. */
async function reachPaymentStep(
  page: Page,
  cart: typeof storedCart,
  totalCents: number,
  paymentStart: 'error' | 'redirect' = 'error',
  freeConfirmStatus = 200,
) {
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
  if (totalCents === 0) {
    await page.route(`**/api/checkout/orders/${orderId}/confirm/`, async (route) => {
      await route.fulfill({
        status: freeConfirmStatus,
        contentType: 'application/json',
        body: JSON.stringify(freeConfirmStatus === 200
          ? { orderId, status: 'confirmed', ticketCount: 2, alreadyProcessed: false }
          : { error: 'La cantidad supera los cupos disponibles.' }),
      });
    });
  } else {
    if (paymentStart === 'redirect') {
      await page.route('https://pay.test/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Pago Wompi de prueba</h1>' });
      });
    }
    await page.route(`**/api/checkout/orders/${orderId}/pago/`, async (route) => {
      if (paymentStart === 'redirect') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ redirectUrl: 'https://pay.test/checkout/1' }) });
      } else {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'No pudimos iniciar el pago. Intenta nuevamente.' }) });
      }
    });
  }
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: cart });
  await page.reload();
  await page.getByLabel('Nombre completo').fill('Ana DEMO');
  await page.getByLabel('Correo electrónico').fill('ana@example.test');
  await page.getByRole('button', { name: submitName(totalCents) }).click();
  if (totalCents === 0 && freeConfirmStatus === 200) {
    await expect(page.getByRole('heading', { level: 1, name: 'Orden confirmada' })).toBeVisible();
  } else if (totalCents === 0) {
    await expect(page.getByRole('alert')).toBeVisible();
  } else if (paymentStart === 'redirect') {
    await expect(page.getByRole('heading', { name: 'Pago Wompi de prueba' })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { level: 1, name: 'Pago de demostración' })).toBeVisible();
  }
}

test('registro gratuito se confirma sin pasarela y muestra los boletos emitidos', async ({ page }) => {
  await reachPaymentStep(page, freeCart, 0);
  await expect(page.getByRole('heading', { name: 'Orden confirmada' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Emitimos 2 boletos para esta orden.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver mis boletos' })).toHaveAttribute(
    'href',
    `/confirmacion/${orderId}/${checkoutToken}/`,
  );
});

test('un clic crea la orden e inicia el pago Wompi', async ({ page }) => {
  const paymentRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(`/api/checkout/orders/${orderId}/pago/`)) paymentRequests.push(request.url());
  });
  await reachPaymentStep(page, storedCart, 4500, 'redirect');
  expect(paymentRequests).toHaveLength(1);
  await expect(page).toHaveURL('https://pay.test/checkout/1');
  await expect(page.getByRole('heading', { name: 'Pago Wompi de prueba' })).toBeVisible();
});

test('el token sigue en sesión y no se agrega a la URL de Wompi', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4500, 'redirect');
  await expect(page).toHaveURL('https://pay.test/checkout/1');
  await expect(page).not.toHaveURL(new RegExp(checkoutToken));
});

test('el inicio de pago fallido deja un reintento claro', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4500);
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos iniciar el pago.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pagar \$45 con Wompi/ })).toBeVisible();
});

test('reintenta Wompi sin crear una orden adicional', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4500);
  await page.route(`**/api/checkout/orders/${orderId}/pago/`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ redirectUrl: 'https://pay.test/checkout/1' }) });
  });
  await page.route('https://pay.test/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Pago Wompi de prueba</h1>' });
  });
  await page.getByRole('button', { name: /Pagar \$45 con Wompi/ }).click();
  await expect(page.getByRole('heading', { name: 'Pago Wompi de prueba' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Finaliza tu compra|Pago de demostración/ })).toHaveCount(0);
});

test('Wompi fallido no confirma ni emite boletos', async ({ page }) => {
  const confirmations: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(`/api/checkout/orders/${orderId}/confirm/`)) confirmations.push(request.url());
  });
  await reachPaymentStep(page, storedCart, 4500);
  expect(confirmations).toHaveLength(0);
  await expect(page.getByText('No pudimos iniciar el pago.')).toBeVisible();
});

test('el token de confirmación no aparece en la URL ni en el botón de pago', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4500);
  await expect(page).not.toHaveURL(new RegExp(checkoutToken));
  await expect(page.getByRole('button', { name: /Pagar \$45 con Wompi/ })).toBeVisible();
});

test('el fallo de cupo en un registro gratuito es recuperable', async ({ page }) => {
  await reachPaymentStep(page, freeCart, 0, 'error', 400);
  const alert = page.getByRole('alert').filter({ hasText: 'Ya no hay entradas disponibles' });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
  await expect(alert.getByRole('link', { name: 'Volver al evento' })).toHaveAttribute(
    'href',
    '/congresos/inteligencia-artificial/congreso-demo-ia/',
  );
});

test('el total y la etiqueta del checkout caben en la vista móvil', async ({ page }) => {
  await reachPaymentStep(page, storedCart, 4500);
  const button = page.getByRole('button', { name: /Pagar \$45 con Wompi/ });
  await expect(button).toBeVisible();
  expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test.describe('móvil de 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.evaluate(({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    }, { key: cartStorageKey, value: storedCart });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Finaliza tu compra' })).toBeVisible();
  });

  test('subtotal y total se ven antes del botón de pago', async ({ page }) => {
    const boton = page.getByRole('button', { name: 'Pagar $45' });
    await expect(boton).toBeVisible();
    const botonBox = await boton.boundingBox();
    expect(botonBox).not.toBeNull();

    for (const nombre of ['Subtotal', 'Total provisional']) {
      const fila = page.locator('dt').filter({ hasText: nombre });
      await expect(fila).toBeVisible();
      const filaBox = await fila.boundingBox();
      expect(filaBox).not.toBeNull();
      expect(filaBox!.y + filaBox!.height).toBeLessThanOrEqual(botonBox!.y);
    }

    await expect(page.locator('dd').filter({ hasText: /^\$45$/ }).first()).toBeVisible();
    await expect(page.getByText('Comisión')).toHaveCount(0);
  });

  test('el botón de pago está dentro del primer scroll tras llenar los datos', async ({ page }) => {
    await page.getByLabel('Nombre completo').fill('Ana DEMO');
    await page.getByLabel('Correo electrónico').fill('ana@example.test');

    const boton = page.getByRole('button', { name: 'Pagar $45' });
    await expect(boton).toBeVisible();
    const box = await boton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThanOrEqual(812);
    const textoCabe = await boton.evaluate((element) => element.scrollWidth <= element.clientWidth);
    expect(textoCabe).toBe(true);

    const sinScrollHorizontal = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(sinScrollHorizontal).toBe(true);
    expect(await boton.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
});
