import { expect, test } from '@playwright/test';

/** Pie de página enlaza privacidad y términos; ambas páginas cargan en móvil y escritorio. */

for (const viewport of [
  { name: 'celular 375 px', width: 375, height: 812 },
  { name: 'escritorio 1280 px', width: 1280, height: 800 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('el pie enlaza privacidad y términos y ambas páginas cargan', async ({ page }) => {
      await page.goto('/');
      const pie = page.getByRole('navigation', { name: 'Enlaces del pie' });

      await pie.getByRole('link', { name: 'Privacidad' }).click();
      await expect(page).toHaveURL(/\/privacidad\/$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeVisible();

      await page.getByRole('navigation', { name: 'Enlaces del pie' }).getByRole('link', { name: 'Términos' }).click();
      await expect(page).toHaveURL(/\/terminos\/$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Términos de uso' })).toBeVisible();
      await expect(page.getByText('no es un servicio oficial de C3')).toBeVisible();

      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      expect(fits).toBe(true);
    });
  });
}
