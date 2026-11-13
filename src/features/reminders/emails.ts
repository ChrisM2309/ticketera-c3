import { escapeHtml } from '@/features/ticketing/email/ticket-email';
import { readBrevoConfig, sendBrevoEmail } from '@/features/ticketing/email/brevo';
import { siteConfig } from '@/lib/site-config';

export function buildReminderEmail(title: string, url: string) {
  const safeTitle = escapeHtml(title);
  const subject = `Recordatorio DEMO: ${title}`;
  const text = `DEMO · Tu selección para ${title} sigue disponible. Revisá precios y cupos: ${url}`;
  const html = `<div style="font-family:Arial;color:#0f203e"><b style="background:#33BEAC">DEMO</b><h1>Tu carrito te espera</h1><p>Tu selección para <strong>${safeTitle}</strong> sigue disponible. Precios y cupos pueden cambiar.</p><a href="${escapeHtml(url)}">Revisar carrito</a></div>`;
  return { subject, text, html };
}

export function buildWeeklyEmail(events: { title: string; url: string; startsAt: string }[]) {
  const subject = 'Eventos recomendados esta semana · Ticketera C3 DEMO';
  const text = ['DEMO · Eventos recomendados esta semana:', ...events.map(e => `${e.title} · ${e.startsAt} · ${e.url}`), `Preferencias: ${siteConfig.siteUrl}/cuenta/`].join('\n');
  const html = `<div style="font-family:Arial;color:#0f203e"><b style="background:#33BEAC">DEMO</b><h1>Eventos recomendados esta semana</h1>${events.map(e => `<p><a href="${escapeHtml(e.url)}">${escapeHtml(e.title)}</a> · ${escapeHtml(e.startsAt)}</p>`).join('')}<p><a href="${escapeHtml(`${siteConfig.siteUrl}/cuenta/`)}">Cambiar preferencias</a></p></div>`;
  return { subject, text, html };
}

export async function sendReminder(to: string, name: string | undefined, title: string, url: string, tag: string) {
  const config = readBrevoConfig();
  if (!config) return false;
  const mail = buildReminderEmail(title, url);
  const result = await sendBrevoEmail(config, { to: { email: to, name }, ...mail, tag });
  return result.ok;
}
