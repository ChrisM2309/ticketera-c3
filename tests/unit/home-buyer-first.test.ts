import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync('src/app/page.tsx', 'utf8');

describe('composición buyer-first del Home', () => {
  it('pone búsqueda y atajos dentro del hero antes de próximos eventos', () => {
    const heroEnd = homeSource.indexOf('aria-labelledby="proximos"');

    expect(homeSource).toContain("import { SiteSearch } from '@/components/layout/site-search';");
    expect(homeSource).toContain("import { DiscoveryShortcuts } from '@/components/catalog/discovery-shortcuts';");
    expect(homeSource.indexOf('<SiteSearch')).toBeGreaterThan(-1);
    expect(homeSource.indexOf('<DiscoveryShortcuts')).toBeGreaterThan(-1);
    expect(homeSource.indexOf('<SiteSearch')).toBeLessThan(heroEnd);
    expect(homeSource.indexOf('<DiscoveryShortcuts')).toBeLessThan(heroEnd);
    expect(homeSource).toContain('inputId="buscar-eventos-home"');
  });

  it('no presenta publicar en el hero y conserva la CTA contextual inferior', () => {
    const heroEnd = homeSource.indexOf('aria-labelledby="proximos"');
    const publishInHero = homeSource.slice(0, heroEnd).includes('panel/eventos/nuevo');

    expect(publishInHero).toBe(false);
    expect(homeSource).toContain('¿Organizás un evento?');
    expect(homeSource).toContain('href="/panel/eventos/nuevo/"');
  });

  it('explica cuando un filtro válido no devuelve coincidencias', () => {
    const searchSource = readFileSync('src/app/buscar/page.tsx', 'utf8');

    expect(searchSource).toContain('hasActiveFilters');
    expect(searchSource).toContain('Ningún evento coincide con estos filtros');
    expect(searchSource).toContain('Quitar filtros');
  });
});
