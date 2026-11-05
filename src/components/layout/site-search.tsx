import { Button } from '@/components/ui/button';

type SiteSearchProps = Readonly<{
  defaultValue?: string;
}>;

export function SiteSearch({ defaultValue = '' }: SiteSearchProps) {
  return (
    <form
      action="/buscar/"
      method="get"
      role="search"
      className="flex w-full gap-2 md:max-w-md md:flex-1"
    >
      <label htmlFor="buscar-eventos" className="sr-only">
        Buscar eventos
      </label>
      <input
        id="buscar-eventos"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Buscar eventos, temas o ciudades"
        className="h-11 min-w-0 flex-1 rounded-sm border border-borde-fuerte bg-superficie px-3 text-base text-texto placeholder:text-texto-suave"
      />
      <Button type="submit">Buscar</Button>
    </form>
  );
}
