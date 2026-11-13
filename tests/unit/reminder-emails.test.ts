import { describe, expect, it } from 'vitest';
import { buildReminderEmail, buildWeeklyEmail } from '@/features/reminders/emails';

describe('emails de recordatorios DEMO', () => {
  it('escapa títulos y conserva enlace y etiqueta DEMO en el recordatorio', () => {
    const mail = buildReminderEmail('<script>alert(1)</script>', 'https://example.test/carrito/');
    expect(mail.subject).toContain('DEMO');
    expect(mail.html).not.toContain('<script>');
    expect(mail.text).toContain('https://example.test/carrito/');
  });

  it('arma novedades con hasta los eventos provistos y enlace a preferencias', () => {
    const mail = buildWeeklyEmail([{ title: '<Evento>', url: 'https://example.test/evento/', startsAt: 'lunes' }]);
    expect(mail.subject).toContain('DEMO');
    expect(mail.html).toContain('&lt;Evento&gt;');
    expect(mail.html).toContain('/cuenta/');
    expect(mail.text).toContain('https://example.test/evento/');
  });
});
