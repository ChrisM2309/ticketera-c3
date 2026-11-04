import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Crear orden DEMO' }).click();

  await expect(page.getByRole('heading', { name: 'Orden pendiente creada' })).toBeVisible();
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
