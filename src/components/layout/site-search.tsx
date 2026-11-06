import { Button } from '@/components/ui/button';

type SiteSearchProps = Readonly<{
  defaultValue?: string;
}>;

function IconoLupa({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function SiteSearch({ defaultValue = '' }: SiteSearchProps) {
  return (
    <form action="/buscar/" method="get" role="search" className="flex w-full gap-2 md:max-w-md md:flex-1">
      <label htmlFor="buscar-eventos" className="sr-only">
        Buscar eventos
      </label>
      <div className="relative min-w-0 flex-1">
        <IconoLupa className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave" />
        <input
          id="buscar-eventos"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Buscar eventos, temas o ciudades"
          className="h-11 w-full min-w-0 rounded-sm border border-borde-fuerte bg-superficie pl-10 pr-3 text-base text-texto placeholder:text-texto-suave"
        />
      </div>
      <Button type="submit" className="gap-2">
        <IconoLupa className="md:hidden" />
        Buscar
      </Button>
    </form>
  );
}
