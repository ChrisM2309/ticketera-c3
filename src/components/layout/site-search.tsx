import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type SiteSearchProps = Readonly<{
  defaultValue?: string;
  className?: string;
  inputId?: string;
  searchLabel?: string;
}>;

export function SiteSearch({
  defaultValue = '',
  className,
  inputId = 'buscar-eventos',
  searchLabel = 'Buscar eventos',
}: SiteSearchProps) {
  return (
    <form action="/buscar/" method="get" role="search" aria-label={searchLabel} className={cn('flex w-full gap-2 md:max-w-md md:flex-1', className)}>
      <label htmlFor={inputId} className="sr-only">
        {searchLabel}
      </label>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave" />
        <input
          id={inputId}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Buscar eventos, temas o ciudades"
          className="h-11 w-full min-w-0 rounded-sm border border-borde-fuerte bg-superficie pl-10 pr-3 text-base text-texto placeholder:text-texto-suave"
        />
      </div>
      <Button type="submit" className="gap-2">
        <Icon name="search" className="md:hidden" />
        Buscar
      </Button>
    </form>
  );
}
