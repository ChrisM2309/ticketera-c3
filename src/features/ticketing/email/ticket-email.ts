/** Plantilla del correo de compra confirmada. Función pura: no toca la base ni la red. */

export type TicketEmailInput = {
  buyerName: string;
  eventTitle: string;
  eventStartsAt: Date;
  ticketCount: number;
  /** Enlace a la confirmación con el token de la compra; se construye en el servidor. */
  confirmationUrl: string;
};

export type TicketEmail = { subject: string; html: string; text: string };

const LOCALE = 'es-SV';
const TIME_ZONE = 'America/El_Salvador';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStart(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: TIME_ZONE,
  }).format(date);
}

function ticketsLabel(count: number): string {
  return count === 1 ? '1 boleto' : `${count} boletos`;
}

/** Solo acepta enlaces https o http hacia la propia URL pública; cualquier otra cosa se rechaza antes de enviar. */
export function isSafeConfirmationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function buildTicketEmail(input: TicketEmailInput): TicketEmail {
  const greeting = input.buyerName.trim() ? `Hola ${input.buyerName.trim()}` : 'Hola';
  const when = formatStart(input.eventStartsAt);
  const count = ticketsLabel(input.ticketCount);
  const subject = `Tus boletos para ${input.eventTitle} · Ticketera C3 DEMO`;

  const text = [
    `${greeting}:`,
    '',
    'Tu compra quedó confirmada. Esta es una demostración: el pago fue simulado y no hubo cobro real.',
    '',
    `Evento: ${input.eventTitle}`,
    `Fecha: ${when}`,
    `Entradas: ${count}`,
    '',
    `Consulta tus boletos y sus códigos QR aquí: ${input.confirmationUrl}`,
    '',
    'Ticketera C3 · DEMO',
  ].join('\n');

  const html = [
    '<!doctype html>',
    '<html lang="es"><body style="margin:0;padding:24px;background:#f6f8fb;font-family:Poppins,Arial,sans-serif;color:#0f203e">',
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px">',
    `<p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#0f203e;background:#33BEAC;display:inline-block;padding:2px 8px;border-radius:2px">DEMO</p>`,
    `<h1 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:0 0 12px">${escapeHtml(greeting)}:</h1>`,
    '<p style="margin:0 0 16px;line-height:1.6">Tu compra quedó confirmada. Esta es una demostración: el pago fue simulado y no hubo cobro real.</p>',
    '<table role="presentation" style="border-collapse:collapse;margin:0 0 20px">',
    `<tr><td style="padding:4px 16px 4px 0;color:#536178">Evento</td><td style="padding:4px 0"><strong>${escapeHtml(input.eventTitle)}</strong></td></tr>`,
    `<tr><td style="padding:4px 16px 4px 0;color:#536178">Fecha</td><td style="padding:4px 0">${escapeHtml(when)}</td></tr>`,
    `<tr><td style="padding:4px 16px 4px 0;color:#536178">Entradas</td><td style="padding:4px 0">${escapeHtml(count)}</td></tr>`,
    '</table>',
    isSafeConfirmationUrl(input.confirmationUrl)
      ? `<p style="margin:0 0 8px"><a href="${escapeHtml(input.confirmationUrl)}" style="display:inline-block;background:#6548c7;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:600">Ver mis boletos y códigos QR</a></p>`
      : '',
    '<p style="margin:16px 0 0;font-size:12px;color:#536178">Ticketera C3 · DEMO</p>',
    '</div></body></html>',
  ].join('');

  return { subject, html, text };
}
