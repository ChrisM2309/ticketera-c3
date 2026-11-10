/**
 * Archivo .ics (RFC 5545) de un evento. Solo lleva datos públicos del evento:
 * nunca datos del comprador ni de la orden.
 */

export type IcsEvent = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  url: string;
};

const CRLF = '\r\n';
const MAX_LINE_OCTETS = 75;
const DEFAULT_DURATION_MS = 60 * 60 * 1000;
const UID_DOMAIN = 'ticketera.c3.com.sv';

/** `YYYYMMDDTHHMMSSZ` en UTC. */
function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Valor de tipo TEXT: escapa la barra invertida, `;` y `,`, y convierte cualquier salto de línea en `\n`. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/[\u0000-\u001f\u007f]/g, ' ');
}

/** Valor de tipo URI: no admite escapes, así que solo se quitan los caracteres de control y los espacios. */
function sanitizeUri(value: string): string {
  return value.replace(/[\u0000- \u007f]/g, '');
}

const encoder = new TextEncoder();

/** Pliega una línea lógica a 75 octetos por línea física sin partir caracteres UTF-8. */
function foldLine(line: string): string[] {
  const physical: string[] = [];
  let current = '';
  let currentOctets = 0;

  for (const char of line) {
    const octets = encoder.encode(char).length;
    // Las líneas de continuación empiezan con un espacio, que también cuenta.
    const limit = physical.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;

    if (currentOctets + octets > limit) {
      physical.push(physical.length === 0 ? current : ` ${current}`);
      current = '';
      currentOctets = 0;
    }

    current += char;
    currentOctets += octets;
  }

  physical.push(physical.length === 0 ? current : ` ${current}`);

  return physical;
}

export function buildEventIcs(event: IcsEvent): string {
  const endsAt = event.endsAt ?? new Date(event.startsAt.getTime() + DEFAULT_DURATION_MS);
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ticketera C3 DEMO//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${sanitizeUri(event.id)}@${UID_DOMAIN}`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(endsAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    `URL:${sanitizeUri(event.url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return content.flatMap(foldLine).join(CRLF) + CRLF;
}
