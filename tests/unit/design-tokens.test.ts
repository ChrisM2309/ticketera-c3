import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

/** Lee los tokens hex de un bloque CSS (`:root {` o `[data-theme='oscuro'] {`). */
function readTokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const end = css.indexOf('}', start);
  const block = css.slice(start, end);

  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map((match) => [match[1], match[2]]),
  );
}

/** Luminancia relativa WCAG 2.x. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos colores hex. */
function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (high + 0.05) / (low + 0.05);
}

const light = readTokens(':root {');
const dark = readTokens("[data-theme='oscuro'] {");

describe('tokens de marca: contraste AA', () => {
  it('texto inverso sobre la acción cumple 4.5:1 en claro y en oscuro (botón primario)', () => {
    expect(contrast(light['texto-inverso'], light.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-inverso'], light['accion-intensa'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-inverso'], dark.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-inverso'], dark['accion-intensa'])).toBeGreaterThanOrEqual(4.5);
  });

  it('texto y texto suave cumplen 4.5:1 sobre el fondo y las superficies', () => {
    expect(contrast(light.texto, light.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-suave'], light.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-suave'], light['superficie-sutil'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.texto, dark.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-suave'], dark.superficie)).toBeGreaterThanOrEqual(4.5);
  });

  it('el foco cumple 3:1 y el enlace 4.5:1 contra su fondo', () => {
    expect(contrast(light.foco, light.superficie)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.foco, dark.fondo)).toBeGreaterThanOrEqual(3);
    expect(contrast(light.enlace, light.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.enlace, dark.fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('el borde de campos cumple 3:1 sobre la superficie clara', () => {
    expect(contrast(light['borde-fuerte'], light.superficie)).toBeGreaterThanOrEqual(3);
  });
});
