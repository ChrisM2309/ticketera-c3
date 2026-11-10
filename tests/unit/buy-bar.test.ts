import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { MobileBuyBar } from '../../src/components/catalog/mobile-buy-bar';
import { SpeakersList } from '../../src/components/catalog/speakers-list';
import { priceFromLabel } from '../../src/features/catalog/format';

describe('barra de compra móvil', () => {
  test('priceFromLabel muestra Gratis, Desde $18 y Desde $10.50', () => {
    expect(priceFromLabel(0, true)).toBe('Gratis');
    expect(priceFromLabel(1800, false)).toBe('Desde $18');
    expect(priceFromLabel(1050, false)).toBe('Desde $10.50');
    expect(priceFromLabel(null, false)).toBe('');
  });

  test('la barra no se renderiza si no hay entradas', () => {
    const closed = renderToStaticMarkup(
      createElement(MobileBuyBar, { label: 'Desde $18', available: false, anchorId: 'entradas' }),
    );

    expect(closed).toBe('');
  });

  test('la barra enlaza a la caja de compra y se oculta desde md', () => {
    const open = renderToStaticMarkup(
      createElement(MobileBuyBar, { label: 'Desde $18', available: true, anchorId: 'entradas' }),
    );

    expect(open).toContain('href="#entradas"');
    expect(open).toContain('Desde $18');
    expect(open).toContain('md:hidden');
  });
});

describe('lista de ponentes', () => {
  test('no se renderiza sin ponentes', () => {
    expect(renderToStaticMarkup(createElement(SpeakersList, { speakers: [] }))).toBe('');
  });

  test('muestra nombre y rol, y omite el rol vacío', () => {
    const html = renderToStaticMarkup(
      createElement(SpeakersList, {
        speakers: [
          { name: 'Ponente DEMO 1', role: 'Rol de ejemplo (DEMO)' },
          { name: 'Ponente DEMO 2', role: '' },
        ],
      }),
    );

    expect(html).toContain('Ponente DEMO 1');
    expect(html).toContain('Rol de ejemplo (DEMO)');
    expect(html).toContain('Ponente DEMO 2');
    expect(html).toContain('Ponentes');
  });
});
