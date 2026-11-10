import { describe, expect, it } from 'vitest';

import {
  adminNavigation,
  isConsoleItemActive,
  organizerNavigation,
  type ConsoleItem,
} from '@/lib/console-navigation';

const allItems = (navigation: typeof adminNavigation): ConsoleItem[] =>
  navigation.groups.flatMap((group) => group.items);

describe('isConsoleItemActive', () => {
  const resumen: ConsoleItem = { href: '/admin/', label: 'Resumen', icon: 'layoutDashboard', exact: true };
  const ajustes: ConsoleItem = { href: '/admin/ajustes/', label: 'Ajustes', icon: 'settings' };

  it('marca el inicio solo en su propia ruta', () => {
    expect(isConsoleItemActive('/admin/', resumen)).toBe(true);
    expect(isConsoleItemActive('/admin/ajustes/', resumen)).toBe(false);
  });

  it('marca una sección también en sus subrutas', () => {
    expect(isConsoleItemActive('/admin/ajustes/', ajustes)).toBe(true);
    expect(isConsoleItemActive('/admin/contenido/blog/nuevo/', { ...ajustes, href: '/admin/contenido/', label: 'Textos' })).toBe(true);
  });

  it('acepta rutas sin barra final y con query (D-23)', () => {
    expect(isConsoleItemActive('/admin/ajustes', ajustes)).toBe(true);
    expect(isConsoleItemActive('/admin/ajustes/?ok=guardar', ajustes)).toBe(true);
  });

  it('no confunde prefijos parciales de otra sección', () => {
    expect(isConsoleItemActive('/admin/ajustesx/', ajustes)).toBe(false);
  });
});

describe('navegación de administración y organizador', () => {
  it.each([
    ['admin', adminNavigation],
    ['organizador', organizerNavigation],
  ])('las rutas de %s terminan en barra y son únicas', (_, navigation) => {
    const hrefs = allItems(navigation).map((item) => item.href);

    expect(hrefs.every((href) => href.startsWith('/') && href.endsWith('/'))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('cada zona tiene exactamente un inicio exacto', () => {
    expect(allItems(adminNavigation).filter((item) => item.exact).map((item) => item.href)).toEqual(['/admin/']);
    expect(allItems(organizerNavigation).filter((item) => item.exact).map((item) => item.href)).toEqual(['/panel/']);
  });

  it('incluye todas las rutas de administración que ya existen', () => {
    const hrefs = allItems(adminNavigation).map((item) => item.href);
    for (const href of ['/admin/', '/admin/organizadores/', '/admin/destacados/', '/admin/contenido/', '/admin/metricas/', '/admin/ajustes/']) {
      expect(hrefs).toContain(href);
    }
  });
});
