import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetTrackedEventsForTests, trackEvent } from '@/lib/analytics/track';

describe('tracking de analítica', () => {
  beforeEach(() => {
    resetTrackedEventsForTests();
    vi.stubGlobal('document', { cookie: '', referrer: '' });
    vi.stubGlobal('window', { location: { pathname: '/' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(undefined));
  });

  it('sin consentimiento no se envía nada', () => {
    trackEvent('page_view');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('con consentimiento envía una vez', () => {
    document.cookie = 'ticketera_consent=granted';
    trackEvent('page_view');
    trackEvent('page_view');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
