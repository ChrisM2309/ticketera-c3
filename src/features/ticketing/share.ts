const shareDateFormatter = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/El_Salvador',
});

/**
 * Enlace de WhatsApp para compartir un evento: título, fecha y hora de El Salvador, y la URL pública
 * de la ficha. Nunca recibe datos de la orden: quien lo comparte no debe exponer su confirmación.
 */
export function buildWhatsAppShareUrl(input: { title: string; startsAt: Date; eventUrl: string }): string {
  const text = [input.title, shareDateFormatter.format(input.startsAt), input.eventUrl].join(' · ');

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
