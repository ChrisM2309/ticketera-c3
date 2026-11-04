import { expect, test } from '@playwright/test';

const cartStorageKey = 'ticketera-c3-cart-v1';
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
  await page.goto('/carrito/');
  await page.evaluate((key) => window.localStorage.removeItem(key), cartStorageKey);
});

test('carrito local permite editar cantidades y conserva la selección', async ({ page }) => {
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: storedCart });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Tu carrito' })).toBeVisible();
  await expect(page.getByText('Congreso demo de IA')).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de General' })).toHaveValue('2');
  await expect(page.getByRole('spinbutton', { name: 'Cantidad de Premium' })).toHaveValue('1');
  await expect(page.getByText(/Comisión DEMO/)).toContainText('5 %');
  await expect(page.getByText('Total provisional')).toBeVisible();

  await page.getByRole('spinbutton', { name: 'Cantidad de General' }).fill('3');
  await page.goto('/carrito/');

  await expect(page.getByRole('spinbutton', { name: 'Cantidad de General' })).toHaveValue('3');
  await expect(page.getByText('Un evento por orden', { exact: true })).toBeVisible();
});

test('carrito directo sin snapshot muestra estado vacío', async ({ page }) => {
  await page.goto('/carrito/');

  await expect(page.getByRole('heading', { name: 'Tu carrito' })).toBeVisible();
  await expect(page.getByText('Todavía no agregaste entradas.')).toBeVisible();
});

test('query inválida no reemplaza el error con un snapshot local de otro evento', async ({ page }) => {
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: cartStorageKey, value: storedCart });
  await page.goto('/carrito/?evento=&entradas=general%3A1');

  await expect(page.getByRole('heading', { name: 'No pudimos leer esa selección.' })).toBeVisible();
  await expect(page.getByText('Congreso demo de IA')).toHaveCount(0);
});
