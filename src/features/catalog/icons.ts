import type { IconName } from '@/components/ui/icon';

/** Icono de cada uno de los 12 tipos de evento (slugs del Excel, ver categories.ts). */
export const eventTypeIcon: Record<string, IconName> = {
  congresos: 'building',
  competencias: 'trophy',
  networking: 'handshake',
  workshops: 'wrench',
  bootcamps: 'rocket',
  concursos: 'target',
  webinars: 'monitorPlay',
  conferencias: 'mic',
  hackathons: 'code',
  meetups: 'users',
  charlas: 'message',
  'ferias-tecnologicas': 'store',
};

/** Icono de los temas de la navegación. */
export const topicIcon: Record<string, IconName> = {
  cloud: 'cloud',
  'inteligencia-artificial': 'cpu',
  programacion: 'code',
  python: 'terminal',
};

/** Icono del tipo de evento; `ticket` si el slug no existe. */
export function iconForEventType(slug: string): IconName {
  return Object.hasOwn(eventTypeIcon, slug) ? eventTypeIcon[slug] : 'ticket';
}

/** Icono por estado (de evento, orden o boleto); siempre se muestra junto al texto del estado. */
export const statusIcon: Record<
  'pending' | 'published' | 'rejected' | 'confirmed' | 'failed' | 'cancelled' | 'draft' | 'archived',
  IconName
> = {
  pending: 'clock',
  published: 'check',
  rejected: 'close',
  confirmed: 'check',
  failed: 'alert',
  cancelled: 'close',
  draft: 'edit',
  archived: 'lock',
};
