import { expect, test } from '@playwright/test';

/** Lista de categorías que se ve en este tamaño (el móvil y el escritorio comparten el nombre accesible). */
const categoriasVisibles = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Categorías de eventos' }).locator('visible=true');

/**
 * Navegación del header (D-34): grupos de categorías, carrito visible en móvil y menú que se cierra.
 * Lee el catálogo de la base real con la clave anónima, igual que el resto de las pruebas de lectura.
 */

test.describe('escritorio 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('los tres grupos abren su lista de categorías y el enlace lleva a la categoría', async ({ page }) => {
    await page.goto('/');

    const categorias = categoriasVisibles(page);
    await categorias.locator('summary', { hasText: 'Aprender' }).click();
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Workshops' })).toBeVisible();
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Charlas' })).toBeVisible();

    await categoriasVisibles(page).getByRole('link', { name: 'Workshops' }).click();
    await expect(page).toHaveURL(/\/workshops\/$/);
  });

  test('Escape cierra el desplegable abierto', async ({ page }) => {
    await page.goto('/');

    const categorias = categoriasVisibles(page);
    await categorias.locator('summary', { hasText: 'Competir' }).click();
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Hackathons' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Hackathons' })).toBeHidden();
  });

  test('no hay desplazamiento horizontal con las tres categorías visibles', async ({ page }) => {
    await page.goto('/');
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

    expect(fits).toBe(true);
  });
});

test.describe('celular 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('el carrito se ve sin abrir el menú', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Carrito' })).toBeVisible();
  });

  test('el menú muestra los tres grupos, navega y se cierra al cambiar de página', async ({ page }) => {
    await page.goto('/');

    const boton = page.getByRole('button', { name: 'Menú' });
    await boton.click();
    await expect(boton).toHaveAttribute('aria-expanded', 'true');
    await expect(categoriasVisibles(page).getByRole('heading', { name: 'Aprender' })).toBeVisible();
    await expect(categoriasVisibles(page).getByRole('heading', { name: 'Conocer y conectar' })).toBeVisible();
    await expect(categoriasVisibles(page).getByRole('heading', { name: 'Competir' })).toBeVisible();

    await categoriasVisibles(page).getByRole('link', { name: 'Hackathons' }).click();
    await expect(page).toHaveURL(/\/hackathons\/$/);
    await expect(page.getByRole('button', { name: 'Menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape cierra el menú y devuelve el foco al botón', async ({ page }) => {
    await page.goto('/');

    const boton = page.getByRole('button', { name: 'Menú' });
    await boton.click();
    await page.keyboard.press('Escape');

    await expect(boton).toHaveAttribute('aria-expanded', 'false');
    await expect(boton).toBeFocused();
  });

  test('no hay desplazamiento horizontal con el menú abierto', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menú' }).click();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

    expect(fits).toBe(true);
  });
});
