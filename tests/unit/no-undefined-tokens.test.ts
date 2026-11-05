import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Clases de color o sombra que ya no existen en el sistema de marca (D-33). */
const removedClasses = ['text-compite-claro', 'bg-compra', 'text-compra', 'hover:bg-compra', 'shadow-tarjeta', 'shadow-lg'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(tsx|ts)$/.test(entry.name) ? [path] : [];
  });
}

describe('clases de marca', () => {
  it('ningún componente usa una clase de color o sombra que no existe', () => {
    const offenders = sourceFiles('src').flatMap((file) => {
      const text = readFileSync(file, 'utf8');

      return removedClasses.filter((name) => new RegExp(`(^|[\\s'"\`])${name}(?![\\w-])`).test(text)).map((name) => `${file}: ${name}`);
    });

    expect(offenders).toEqual([]);
  });
});
