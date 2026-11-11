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

it('no envía el token de una página de confirmación', () => {
  resetTrackedEventsForTests();
  vi.stubGlobal('document', { cookie: '', referrer: '' });
  vi.stubGlobal('window', { location: { pathname: '/' } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(undefined));
  document.cookie = 'ticketera_consent=granted';
  trackEvent('page_view', { path: '/confirmacion/11111111-1111-4111-8111-111111111111/secret-token/' });
  const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
  expect(body.path).toBe('/confirmacion/');
  expect(JSON.stringify(body)).not.toContain('secret-token');
});
