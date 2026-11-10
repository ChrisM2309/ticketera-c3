import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { buildWhatsAppShareUrl } from '@/features/ticketing/share';
import { cn } from '@/lib/utils';

type ShareButtonProps = Readonly<{
  title: string;
  /** Fecha de inicio en ISO 8601. */
  startsAt: string;
  /** URL pública y absoluta de la ficha del evento. */
  eventUrl: string;
  className?: string;
}>;

/** Enlace para compartir el evento por WhatsApp en una pestaña nueva. */
export function ShareButton({ title, startsAt, eventUrl, className }: ShareButtonProps) {
  const href = buildWhatsAppShareUrl({ title, startsAt: new Date(startsAt), eventUrl });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: 'secundario' }), 'w-full sm:w-fit print:hidden', className)}
    >
      <Icon name="share" />
      Compartir por WhatsApp
    </a>
  );
}
