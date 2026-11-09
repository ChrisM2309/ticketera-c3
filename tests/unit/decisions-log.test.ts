import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const text = readFileSync(join(process.cwd(), 'docs', 'DECISIONS.md'), 'utf8');
const rows = text.split(/\r?\n/).filter((line) => /^\| D-\d+ \|/.test(line));
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('registro de decisiones', () => {
  it('registra D-37 a D-57 sin saltos', () => {
    const ids = [...text.matchAll(/^\| D-(\d+) \|/gm)].map((m) => Number(m[1]));
    expect(ids).toEqual(expect.arrayContaining(range(37, 57)));
  });

  it('cada decisión nueva tiene estado y justificación', () => {
    for (const n of range(37, 57)) {
      const row = rows.find((line) => line.startsWith(`| D-${n} |`));
      expect(row, `D-${n}`).toBeDefined();
      const cells = row!.replace(/^\||\|$/g, '').split(/ \| /).map((c) => c.trim());
      expect(cells, `D-${n}`).toHaveLength(4);
      for (const cell of cells) expect(cell.length).toBeGreaterThan(0);
    }
  });
});
