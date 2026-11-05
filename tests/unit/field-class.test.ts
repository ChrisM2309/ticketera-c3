import { describe, expect, it } from 'vitest';

import { fieldClass } from '../../src/components/ui/field';

describe('fieldClass', () => {
  it('usa radio de 6 px (radius-sm) y altura táctil de 44 px (D-33)', () => {
    expect(fieldClass).toContain('rounded-sm');
    expect(fieldClass).not.toContain('rounded-md');
    expect(fieldClass).toContain('min-h-11');
  });

  it('conserva el anillo de foco de teclado', () => {
    expect(fieldClass).toContain('focus-visible:ring-2');
    expect(fieldClass).toContain('focus-visible:ring-foco');
  });
});
