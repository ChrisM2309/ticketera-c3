import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { Icon, iconRegistry } from '../../src/components/ui/icon';
import { eventCategories } from '../../src/features/catalog/categories';
import { eventTypeIcon, iconForEventType, statusIcon, topicIcon } from '../../src/features/catalog/icons';

describe('iconos', () => {
  test('cada uno de los 12 tipos de evento tiene icono', () => {
    expect(eventCategories).toHaveLength(12);

    for (const { slug } of eventCategories) {
      const name = eventTypeIcon[slug];

      expect(name, slug).toBeDefined();
      expect(iconRegistry[name], slug).toBeTruthy();
      expect(iconForEventType(slug)).toBe(name);
    }
  });

  test('un slug desconocido usa el icono de boleto', () => {
    expect(iconForEventType('no-existe')).toBe('ticket');
  });

  test('los temas apuntan a nombres del registro', () => {
    expect(Object.keys(topicIcon)).toEqual(['cloud', 'inteligencia-artificial', 'programacion', 'python']);

    for (const name of Object.values(topicIcon)) {
      expect(iconRegistry[name]).toBeTruthy();
    }
  });

  test('todos los nombres del registro existen en lucide-react', () => {
    expect(Object.values(iconRegistry).every(Boolean)).toBe(true);
  });

  test('sin label es decorativo', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'ticket' }));

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain('data-icon="ticket"');
  });

  test('con label es accesible', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'tag', label: 'Gratis' }));

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Gratis"');
    expect(html).not.toContain('aria-hidden');
    expect(html).toContain('data-icon="tag"');
  });

  test('el tono crea usa el texto accesible y no el turquesa sobre fondo claro', () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: 'rocket', tone: 'crea' }));

    expect(html).toContain('text-crea-texto');
    expect(html).not.toMatch(/text-crea(?!-)/);
  });

  test('el tamaño por defecto es 20 y se puede cambiar', () => {
    expect(renderToStaticMarkup(createElement(Icon, { name: 'check' }))).toContain('width="20"');
    expect(renderToStaticMarkup(createElement(Icon, { name: 'check', size: 24 }))).toContain('width="24"');
  });

  test('cada estado tiene icono', () => {
    expect(Object.keys(statusIcon).sort()).toEqual(
      ['pending', 'published', 'rejected', 'confirmed', 'failed', 'cancelled', 'draft', 'archived'].sort(),
    );

    for (const name of Object.values(statusIcon)) {
      expect(iconRegistry[name]).toBeTruthy();
    }
  });
});
