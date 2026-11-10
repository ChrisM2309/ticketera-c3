import { expect, test, type Page } from '@playwright/test';

/**
 * Iconos en cada componente (DI-04, D-33): sin desbordamiento horizontal, con nombre accesible
 * cuando tienen significado y siempre junto a su texto. Lee el catálogo de la base real con la clave anónima.
 */

const viewports = [
  { nombre: 'móvil 375 px', width: 375, height: 812 },
  { nombre: 'escritorio 1280 px', width: 1280, height: 800 },
] as const;

const ficha = '/congresos/inteligencia-artificial/congreso-demo-ia/';
const rutas = ['/', '/congresos/', ficha, '/carrito/', '/ingresar/'] as const;

async function primeraFicha(page: Page): Promise<string> {
  await page.goto('/congresos/');
  const enlace = page.locator('article h3 a').first();
  await expect(enlace).toBeVisible();

  return (await enlace.getAttribute('href')) ?? ficha;
}

for (const viewport of viewports) {
  test.describe(viewport.nombre, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('no hay scroll horizontal', async ({ page }) => {
      for (const ruta of rutas) {
        await page.goto(ruta);

        const cabe = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(cabe, `${ruta} a ${viewport.width} px`).toBe(true);
      }
    });

    test('todo icono con significado tiene nombre accesible', async ({ page }) => {
      for (const ruta of rutas) {
        await page.goto(ruta);

        const sinNombre = await page.evaluate(() =>
          [...document.querySelectorAll('svg[data-icon]')]
            .filter((svg) => svg.getAttribute('aria-hidden') !== 'true')
            .filter((svg) => svg.getAttribute('role') !== 'img' || !svg.getAttribute('aria-label')?.trim())
            .map((svg) => svg.getAttribute('data-icon')),
        );

        expect(sinNombre, ruta).toEqual([]);
      }
    });

    test('la tarjeta de evento muestra fecha, lugar y precio con icono', async ({ page }) => {
      await page.goto('/congresos/');

      const tarjeta = page.locator('article').first();
      await expect(tarjeta).toBeVisible();

      // La fecha y la hora van en la «entrada», el lugar o la modalidad y el precio en el cuerpo.
      await expect(tarjeta.locator('svg[data-icon="calendar"]')).toHaveCount(1);
      await expect(tarjeta.locator('svg[data-icon="clock"]')).toHaveCount(1);
      await expect(tarjeta.locator('svg[data-icon="mapPin"], svg[data-icon="monitor"]')).toHaveCount(1);
      await expect(tarjeta.locator('svg[data-icon="tag"]')).toHaveCount(1);

      // Ningún icono va solo: el texto de cada dato sigue visible.
      const precio = tarjeta.locator('p', { has: page.locator('svg[data-icon="tag"]') });
      await expect(precio).toHaveText(/Gratis|Desde|Sin entradas/);
      const lugar = tarjeta.locator('p', { has: page.locator('svg[data-icon="mapPin"], svg[data-icon="monitor"]') });
      await expect(lugar).toHaveText(/Presencial|En línea/);
    });

    test('la ficha, los filtros y el pie usan iconos junto a su texto', async ({ page }) => {
      const href = await primeraFicha(page);

      await page.goto('/congresos/');
      for (const nombre of ['mapPin', 'monitor', 'tag', 'calendar']) {
        await expect(page.locator(`form[aria-label="Filtrar eventos"] svg[data-icon="${nombre}"]`), nombre).toHaveCount(1);
      }

      await page.goto(href);
      const datos = page.locator('dl').first();
      for (const nombre of ['calendar', 'clock', 'building', 'ticket']) {
        await expect(datos.locator(`svg[data-icon="${nombre}"]`), nombre).toHaveCount(1);
      }
      await expect(datos.locator('svg[data-icon="mapPin"], svg[data-icon="monitor"]')).toHaveCount(1);

      const pie = page.locator('footer');
      await expect(pie.locator('svg[data-icon="mail"]')).toHaveCount(1);
      await expect(pie.locator('a[href="/privacidad/"] svg[data-icon="lock"]')).toHaveCount(1);
      await expect(pie.locator('a[href="/terminos/"] svg[data-icon="lock"]')).toHaveCount(1);
    });

    test('la cabecera tiene buscar, cuenta, carrito y menú con icono y texto', async ({ page }) => {
      await page.goto('/');

      const cabecera = page.locator('header').first();
      await expect(cabecera.locator('svg[data-icon="search"]').first()).toBeAttached();
      await expect(cabecera.locator('a[href="/carrito/"] svg[data-icon="cart"]')).toBeAttached();
      // Entrar vive en la barra de escritorio y en el menú móvil; basta con que exista con su icono.
      await expect(cabecera.locator('a[href="/ingresar/"] svg[data-icon="logIn"]').first()).toBeAttached();

      if (viewport.width < 768) {
        await expect(cabecera.getByRole('button', { name: 'Menú' }).locator('svg[data-icon="menu"]')).toBeVisible();
      }
    });
  });
}
