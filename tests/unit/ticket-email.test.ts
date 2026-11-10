import { describe, expect, it } from 'vitest';

import { buildTicketEmail, escapeHtml, isSafeConfirmationUrl } from '@/features/ticketing/email/ticket-email';

const base = {
  buyerName: 'Ana',
  eventTitle: 'Congreso de IA',
  eventStartsAt: new Date('2026-12-05T18:00:00Z'),
  ticketCount: 2,
  confirmationUrl: 'https://demo.ticketera.c3.com.sv/confirmacion/abc/token123/',
};

describe('buildTicketEmail', () => {
  it('lleva la etiqueta DEMO en asunto y cuerpo y aclara que el pago fue simulado', () => {
    const email = buildTicketEmail(base);

    expect(email.subject).toContain('DEMO');
    expect(email.text).toContain('DEMO');
    expect(email.html).toContain('DEMO');
    expect(email.text).toContain('pago fue simulado');
  });

  it('incluye el enlace de confirmación en texto y HTML', () => {
    const email = buildTicketEmail(base);

    expect(email.text).toContain(base.confirmationUrl);
    expect(email.html).toContain(`href="${base.confirmationUrl}"`);
  });

  it('usa singular y plural según la cantidad de boletos', () => {
    expect(buildTicketEmail({ ...base, ticketCount: 1 }).text).toContain('Entradas: 1 boleto');
    expect(buildTicketEmail({ ...base, ticketCount: 3 }).text).toContain('Entradas: 3 boletos');
  });

  it('escapa nombre y título del evento en el HTML', () => {
    const email = buildTicketEmail({
      ...base,
      buyerName: '<img src=x onerror=alert(1)>',
      eventTitle: 'Evento "<script>" & más',
    });

    expect(email.html).not.toContain('<img src=x');
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(email.html).toContain('Evento &quot;&lt;script&gt;&quot; &amp; más');
  });

  it('formatea la fecha en la zona horaria de El Salvador', () => {
    // 18:00 UTC equivale a 12:00 en El Salvador (UTC-6).
    expect(buildTicketEmail(base).text).toMatch(/12:00/);
  });

  it('usa un saludo genérico cuando no hay nombre', () => {
    expect(buildTicketEmail({ ...base, buyerName: '   ' }).text.startsWith('Hola:')).toBe(true);
  });
});

describe('escapeHtml y enlaces', () => {
  it('escapa los cinco caracteres peligrosos', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('acepta solo http y https válidos', () => {
    expect(isSafeConfirmationUrl('https://demo.ticketera.c3.com.sv/confirmacion/a/b/')).toBe(true);
    expect(isSafeConfirmationUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeConfirmationUrl('no es una url')).toBe(false);
  });
});
