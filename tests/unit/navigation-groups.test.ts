import { describe, expect, it } from 'vitest';

import { eventCategories } from '../../src/features/catalog/categories';
import { categoryGroups } from '../../src/lib/navigation';

describe('grupos del menú de categorías', () => {
  it('cada una de las 12 categorías aparece exactamente una vez', () => {
    const slugs = categoryGroups.flatMap((group) => group.items.map((item) => item.slug));

    expect(slugs.sort()).toEqual(eventCategories.map((categoria) => categoria.slug).sort());
  });

  it('las categorías dentro de cada grupo siguen el orden del Excel', () => {
    const order = eventCategories.map((categoria) => categoria.slug);

    for (const group of categoryGroups) {
      const positions = group.items.map((item) => order.indexOf(item.slug));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }
  });

  it('los nombres de grupo usan las palabras clave del equipo, sin nombres de marca', () => {
    const labels = categoryGroups.map((group) => group.label);

    expect(labels).toEqual(['Congresos y ferias', 'Competencias y hackathons', 'Formación', 'Comunidad']);
    for (const label of labels) {
      expect(label).not.toMatch(/\b(compite|crea|conecta)\b/i);
    }
  });

  it('cada enlace de categoría apunta a su ruta con barra final', () => {
    for (const group of categoryGroups) {
      for (const item of group.items) {
        expect(item.href).toBe(`/${item.slug}/`);
      }
    }
  });
});
