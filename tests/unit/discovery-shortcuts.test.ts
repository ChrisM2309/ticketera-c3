import { describe, expect, it } from 'vitest';

import { discoveryShortcutLinks } from '../../src/components/catalog/discovery-shortcuts';

describe('atajos de descubrimiento', () => {
  it('ofrece los cuatro accesos buyer-first como enlaces de búsqueda', () => {
    expect(discoveryShortcutLinks.map((shortcut) => shortcut.label)).toEqual([
      'Este fin de semana',
      'Gratis',
      'En línea',
      'Cerca de mí',
    ]);
    expect(discoveryShortcutLinks.map((shortcut) => shortcut.href)).toEqual([
      '/buscar/?fecha=fin-de-semana',
      '/buscar/?precio=gratis',
      '/buscar/?modalidad=virtual',
      '/buscar/?ciudad=san-salvador',
    ]);
  });

  it('explica que «Cerca de mí» usa la ubicación demo disponible', () => {
    expect(discoveryShortcutLinks.at(-1)?.description).toContain('San Salvador');
  });
});
