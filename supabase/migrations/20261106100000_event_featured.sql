-- Destacados de la portada (D-35): el administrador elige hasta cuatro eventos publicados.
-- La tabla no se escribe desde el navegador: solo la función del administrador cambia filas.
-- Por eso el organizador no puede destacar su propio evento, aunque edite el suyo.

create table public.event_featured (
  event_id uuid primary key references public.events (id) on delete cascade,
  position smallint not null unique check (position between 1 and 4),
  created_at timestamptz not null default now()
);

alter table public.event_featured enable row level security;

-- Lectura pública: la portada solo muestra eventos publicados, y eso lo filtra la consulta de catálogo.
revoke all on public.event_featured from anon, authenticated;
grant select on public.event_featured to anon, authenticated;

create policy event_featured_public_read on public.event_featured
  for select to anon, authenticated
  using (true);

create or replace function public.admin_set_featured(
  p_event_id uuid,
  p_featured boolean
)
returns smallint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_position smallint;
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede destacar eventos.' using errcode = '42501';
  end if;

  select e.status into v_status from public.events e where e.id = p_event_id for update;

  if not found then
    raise exception 'El evento no existe.' using errcode = '22023';
  end if;

  if p_featured then
    if v_status <> 'published' then
      raise exception 'Solo se destacan eventos publicados.' using errcode = '22023';
    end if;

    if exists (select 1 from public.event_featured f where f.event_id = p_event_id) then
      select f.position into v_position from public.event_featured f where f.event_id = p_event_id;
      return v_position;
    end if;

    select min(slot) into v_position
      from generate_series(1, 4) as slot
     where not exists (select 1 from public.event_featured f where f.position = slot);

    if v_position is null then
      raise exception 'Ya hay cuatro destacados. Quita uno antes de agregar otro.' using errcode = '22023';
    end if;

    insert into public.event_featured (event_id, position) values (p_event_id, v_position);
    return v_position;
  end if;

  delete from public.event_featured f where f.event_id = p_event_id;
  return null;
end;
$$;

revoke all on function public.admin_set_featured(uuid, boolean) from public, anon;
grant execute on function public.admin_set_featured(uuid, boolean) to authenticated;
