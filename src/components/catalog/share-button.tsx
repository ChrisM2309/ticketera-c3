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
      aria-label="Compartir por WhatsApp"
      className={cn(
        buttonVariants({ variant: 'secundario' }),
        'w-full min-w-0 whitespace-normal px-3 text-xs normal-case tracking-normal sm:w-fit sm:whitespace-nowrap sm:px-5 sm:text-etiqueta sm:tracking-etiqueta print:hidden',
        className,
      )}
    >
      <Icon name="share" className="shrink-0" />
      <span className="sm:hidden">Compartir</span>
      <span className="hidden sm:inline">Compartir por WhatsApp</span>
    </a>
  );
}
