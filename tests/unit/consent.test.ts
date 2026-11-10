import { describe, expect, it } from 'vitest';

import { consentCookie, parseConsent } from '@/lib/analytics/consent';

describe('consentimiento de analítica', () => {
  it('sin cookie es unset', () => expect(parseConsent(undefined)).toBe('unset'));
  it('lee granted y denied', () => {
    expect(parseConsent('ticketera_consent=granted')).toBe('granted');
    expect(parseConsent('foo=1; ticketera_consent=denied')).toBe('denied');
  });
  it('la cookie dura 180 días y es SameSite=Lax', () => {
    expect(consentCookie('granted')).toContain('Max-Age=15552000');
    expect(consentCookie('granted')).toContain('SameSite=Lax');
  });
});
