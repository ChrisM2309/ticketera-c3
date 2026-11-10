import { describe, expect, it } from 'vitest';

import { seedSql } from './helpers';

describe('seed.sql', () => {
  it('el seed no contiene caracteres de reemplazo', () => {
    expect(seedSql.includes('\uFFFD')).toBe(false);
  });
});
