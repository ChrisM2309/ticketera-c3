import { describe, expect, it } from 'vitest';

import { eventCategories } from '../../src/features/catalog/categories';
import { accountLinks, accountLinksFor, categoryLinks } from '../../src/lib/navigation';

const orderedSlugs = [
  'congresos',
  'competencias',
  'networking',
  'workshops',
  'bootcamps',
  'concursos',
  'webinars',
  'conferencias',
  'hackathons',
  'meetups',
  'charlas',
  'ferias-tecnologicas',
];

describe('event categories', () => {
  it('keeps the twelve categories in the documented Excel order', () => {
    expect(eventCategories.map((categoria) => categoria.slug)).toEqual(orderedSlugs);
  });

  it('uses the visible Spanish labels for the category menu', () => {
    expect(eventCategories.at(-1)).toEqual({
      slug: 'ferias-tecnologicas',
      label: 'Ferias tecnológicas',
    });
  });
});

describe('navigation', () => {
  it('links each category to its trailing-slash path', () => {
    expect(categoryLinks.map((link) => link.href)).toEqual(
      orderedSlugs.map((slug) => `/${slug}/`),
    );
  });

  it('keeps «Inicio» out of the menu: the logo leads to the home page', () => {
    const items = [...accountLinks, ...categoryLinks];

    expect(items.map((item) => item.label.toLowerCase())).not.toContain('inicio');
    expect(items.map((item) => item.href)).not.toContain('/');
  });

  it('muestra Ingresar sin sesión y Mis boletos y Mi cuenta con sesión', () => {
    const anonymous = accountLinksFor(false);
    const signedIn = accountLinksFor(true);

    expect(anonymous).toEqual(accountLinks);
    expect(anonymous.map((link) => link.href)).toContain('/ingresar/');
    expect(signedIn.map((link) => link.href)).toEqual(['/panel/eventos/nuevo/', '/mis-boletos/', '/cuenta/']);
    expect(signedIn.map((link) => link.label)).toEqual(['Publicar evento', 'Mis boletos', 'Mi cuenta']);
    expect(signedIn.map((link) => link.icon)).toEqual(['calendarPlus', 'ticket', 'user']);
    expect(signedIn.map((link) => link.href)).not.toContain('/ingresar/');
  });
});
