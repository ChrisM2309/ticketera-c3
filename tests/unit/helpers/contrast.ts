import { readFileSync } from 'node:fs';

const css = readFileSync('src/app/globals.css', 'utf8');

/** Lee los tokens hex de un bloque CSS (`:root {` o `[data-theme='oscuro'] {`). */
export function readTokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const end = css.indexOf('}', start);
  const block = css.slice(start, end);

  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map((match) => [match[1], match[2]]),
  );
}

/** Luminancia relativa WCAG 2.x. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos colores hex. */
export function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (high + 0.05) / (low + 0.05);
}

export const lightTokens = readTokens(':root {');
export const darkTokens = readTokens("[data-theme='oscuro'] {");
