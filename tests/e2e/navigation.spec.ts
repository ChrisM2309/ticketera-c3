import { expect, test, type Page } from '@playwright/test';

/**
 * Navegación del header (D-34): cuatro grupos desplegables, carrito visible en móvil y menú que se cierra.
 * Lee el catálogo de la base real con la clave anónima, igual que el resto de las pruebas de lectura.
 */

// El móvil y el escritorio comparten el nombre accesible; solo cuenta la lista que se ve.
const categoriasVisibles = (page: Page) =>
  page.locator('nav[aria-label="Categorías de eventos"]:visible').last();

test.describe('escritorio 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('cada grupo es un desplegable y un enlace lleva a su categoría', async ({ page }) => {
    await page.goto('/');

    const formacion = categoriasVisibles(page).locator('summary', { hasText: 'Formación' });
    await expect(formacion).toBeVisible();
    await formacion.click();
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Workshops' })).toBeVisible();

    await categoriasVisibles(page).getByRole('link', { name: 'Workshops' }).click();
    await expect(page).toHaveURL(/\/workshops\/$/);
  });

  test('Escape cierra el desplegable abierto', async ({ page }) => {
    await page.goto('/');

    await categoriasVisibles(page).locator('summary', { hasText: 'Competencias y hackathons' }).click();
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Hackathons' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(categoriasVisibles(page).getByRole('link', { name: 'Hackathons' })).toBeHidden();
  });

  test('no hay desplazamiento horizontal con la cabecera completa', async ({ page }) => {
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

  test('el menú abre los grupos como acordeones, navega y se cierra al cambiar de página', async ({ page }) => {
    await page.goto('/');

    const boton = page.getByRole('button', { name: 'Menú' });
    await boton.click();
    await expect(boton).toHaveAttribute('aria-expanded', 'true');

    await categoriasVisibles(page).locator('summary', { hasText: 'Competencias y hackathons' }).click();
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
