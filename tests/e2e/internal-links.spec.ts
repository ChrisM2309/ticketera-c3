import { expect, test } from '@playwright/test';

const categorySlugs = [
  'congresos', 'competencias', 'networking', 'workshops', 'bootcamps', 'concursos',
  'webinars', 'conferencias', 'hackathons', 'meetups', 'charlas', 'ferias-tecnologicas',
];

test('la portada enlaza las doce categorías', async ({ page }) => {
  await page.goto('/');
  for (const slug of categorySlugs) {
    await expect(page.locator(`a[href="/${slug}/"]`).first()).toHaveAttribute('href', `/${slug}/`);
  }
});

test('una ficha enlaza tipo, tema y ciudad cuando existen', async ({ page }) => {
  await page.goto('/');
  const eventLink = page.locator('main article h3 a').first();
  await expect(eventLink).toBeVisible();
  const href = await eventLink.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.getByRole('heading', { name: 'Sobre el evento' })).toBeVisible();
  const segments = href!.split('/').filter(Boolean);
  await expect(page.locator(`nav[aria-label="Ruta de navegación"] a[href="/${segments[0]}/"]`)).toBeVisible();
  if (segments.length === 3) {
    await expect(page.locator(`nav[aria-label="Ruta de navegación"] a[href="/${segments[0]}/${segments[1]}/"]`)).toBeVisible();
  }
  const locationLink = page.locator('dl a[href^="/"]');
  if (await locationLink.count()) await expect(locationLink.first()).toBeVisible();
});

test('el pie enlaza privacidad, términos, blog y para empresas', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacidad/');
  await expect(footer.getByRole('link', { name: 'Términos' })).toHaveAttribute('href', '/terminos/');
  await expect(footer.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog/');
  await expect(footer.getByRole('link', { name: 'Para empresas' })).toHaveAttribute('href', '/para-empresas/');
});
