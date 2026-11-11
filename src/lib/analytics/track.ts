import { parseConsent } from './consent';
import { captureCampaign } from './campaign';

export const analyticsEventNames = [
  'page_view', 'event_view', 'begin_checkout', 'purchase_confirmed', 'featured_purchased', 'package_purchased', 'check_in',
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

const sentEvents = new Set<string>();

export function trackEvent(name: AnalyticsEventName, options: { path?: string } = {}): void {
  if (typeof document === 'undefined' || parseConsent(document.cookie) !== 'granted') return;
  try { if (window.location.search && window.sessionStorage) captureCampaign(window.location.search, window.sessionStorage); } catch { /* almacenamiento bloqueado */ }
  const rawPath = options.path ?? window.location.pathname;
  if (!rawPath.startsWith('/') || rawPath.length > 200) return;
  const path = rawPath.startsWith('/confirmacion/') ? '/confirmacion/' : rawPath.split(/[?#]/, 1)[0];
  const key = `${name}:${path}`;
  if (sentEvents.has(key)) return;
  sentEvents.add(key);
  const body = JSON.stringify({ name, path, referrerHost: document.referrer ? new URL(document.referrer).host : null });
  void fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
}

export function resetTrackedEventsForTests(): void {
  sentEvents.clear();
}
