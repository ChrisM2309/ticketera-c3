import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const docsDir = join(root, 'docs');
const index = readFileSync(join(docsDir, 'README.md'), 'utf8');

const indexedDirs = ['product', 'architecture', 'design', 'checkout', 'testing', 'analisis'];

const markdownFiles = (dir: string): string[] =>
  readdirSync(join(docsDir, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => posix.join(dir, entry.name));

describe('índice documental', () => {
  it('docs/README.md enlaza cada documento de docs/product, architecture, design, checkout, testing, analisis y DECISIONS.md', () => {
    const expected = [...indexedDirs.flatMap(markdownFiles), 'DECISIONS.md'];
    expect(expected.length).toBeGreaterThan(8);
    for (const path of expected) {
      expect(index, path).toContain(`\`${path}\``);
    }
  });

  it('docs/README.md enlaza PRODUCT.md y los planes de 2026-11-02 a 2026-11-09', () => {
    expect(index).toContain('`../PRODUCT.md`');
    const plans = readdirSync(join(docsDir, 'superpowers', 'plans')).filter((name) =>
      /^2026-11-\d{2}-.*\.md$/.test(name),
    );
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans) {
      expect(index, plan).toContain(`superpowers/plans/${plan}`);
    }
  });

  it('README.md ya no dice que el paquete no contiene la aplicación', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    expect(readme).not.toMatch(/NO contiene una aplicación Next\.js/);
  });
});
