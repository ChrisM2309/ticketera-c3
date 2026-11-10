import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, test } from 'vitest';

const srcDir = join(process.cwd(), 'src');

/** Único lugar permitido para dibujar un SVG: el componente Icon (hoy delega en lucide-react y no lo necesita). */
const iconComponent = 'components/ui/icon.tsx';

/**
 * Archivos con SVG propio permitido (logos y marca). Descubierta con `grep -rln "<svg" src`:
 * a la fecha ningún logo ni marca se dibuja como SVG en src/ (el logo es imagen en /public), así que la lista está vacía.
 * Si se añade un SVG de marca, registrarlo aquí con la razón en un comentario.
 */
const allowlist: readonly string[] = [];

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('iconos', () => {
  test('ningún componente escribe SVG a mano', () => {
    const offenders = tsxFiles(srcDir)
      .map((file) => relative(srcDir, file).split(sep).join('/'))
      .filter((file) => file !== iconComponent && !allowlist.includes(file))
      .filter((file) => readFileSync(join(srcDir, file), 'utf8').includes('<svg'));

    expect(offenders).toEqual([]);
  });
});
