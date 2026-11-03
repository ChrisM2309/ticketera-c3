import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('repository hygiene', () => {
  it('ignores Playwright output artifacts', () => {
    const gitignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf8');

    expect(gitignore).toContain('/test-results/');
    expect(gitignore).toContain('/playwright-report/');
  });
});
