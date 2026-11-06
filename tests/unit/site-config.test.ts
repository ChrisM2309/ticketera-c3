import { describe, expect, it } from 'vitest';

import { siteConfig } from '../../src/lib/site-config';

describe('siteConfig', () => {
  it('exposes the academic demo identity and USD currency', () => {
    expect(siteConfig.demoLabel).toBe('DEMO');
    expect(siteConfig.currency).toBe('USD');
    expect(siteConfig.demoCommissionPercent).toBe(5);
  });
});
