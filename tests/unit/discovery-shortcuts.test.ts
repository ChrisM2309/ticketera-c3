import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { discoveryShortcutLinks } from '../../src/components/catalog/discovery-shortcuts';

const shortcutsSource = readFileSync('src/components/catalog/discovery-shortcuts.tsx', 'utf8');

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

  it('usa solo icono y título, sin subtítulo adicional', () => {
    expect(shortcutsSource).not.toContain('description');
    expect(shortcutsSource).not.toContain('title={shortcut.description}');
    expect(shortcutsSource).not.toContain('line-clamp-1');
  });

  it('usa una presentación compacta y estable para no deformar la fila', () => {
    expect(shortcutsSource).toContain('min-h-16');
    expect(shortcutsSource).toContain('grid-cols-2 gap-3');
    expect(shortcutsSource).not.toContain('md:grid-cols-4');
    expect(shortcutsSource).not.toContain('flex-col justify-between');
  });
});
