import { expect, test } from '@playwright/test';

/**
 * Destacados de la portada (D-35): el carrusel es una región con nombre, sus puntos siguen a la
 * diapositiva visible y los controles funcionan con teclado. Lee la base real con la clave anónima.
 */

test.describe('escritorio 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('el carrito de destacados se navega con los puntos y las flechas', async ({ page }) => {
    await page.goto('/');

    const region = page.getByRole('region', { name: 'Destacados', exact: true });
    await expect(region).toBeVisible();

    const segundo = page.getByRole('button', { name: /Mostrar destacado 2 de/ });
    await segundo.click();
    await expect(segundo).toHaveAttribute('aria-current', 'true');

    await page.getByRole('button', { name: 'Destacado anterior' }).click();
    await expect(page.getByRole('button', { name: /Mostrar destacado 1 de/ })).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('celular 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('la portada no desborda con el carrusel de destacados', async ({ page }) => {
    await page.goto('/');
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

    expect(fits).toBe(true);
  });
});
