-- Fase 4 (BM-01): configuración pública de ingresos y SEO.
-- No se insertan valores iniciales: la ausencia de una tarifa significa que aún está por definir.

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated
  using (key in (
    'featured_daily_rate_cents',
    'package_annual_price_cents',
    'package_benefits',
    'indexing_enabled'
  ));

create or replace function public.admin_set_setting(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated_by uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede cambiar la configuración.' using errcode = '42501';
  end if;

  if p_key not in (
    'featured_daily_rate_cents',
    'package_annual_price_cents',
    'package_benefits',
    'indexing_enabled'
  ) then
    raise exception 'La clave de configuración no está permitida.' using errcode = '22023';
  end if;

  if p_value is null then
    delete from public.site_settings where key = p_key;
    return;
  end if;

  if p_key in ('featured_daily_rate_cents', 'package_annual_price_cents') then
    if jsonb_typeof(p_value) <> 'number'
       or (p_value #>> '{}') !~ '^[0-9]+$'
       or (p_value #>> '{}')::numeric > 2147483647 then
      raise exception 'La tarifa debe ser un entero no negativo en centavos.' using errcode = '22023';
    end if;
  elsif p_key = 'package_benefits' then
    if jsonb_typeof(p_value) <> 'object' then
      raise exception 'Los beneficios deben ser un objeto.' using errcode = '22023';
    end if;
  elsif jsonb_typeof(p_value) <> 'boolean' then
    raise exception 'indexing_enabled debe ser verdadero o falso.' using errcode = '22023';
  end if;

  insert into public.site_settings (key, value, updated_by, updated_at)
  values (p_key, p_value, v_updated_by, now())
  on conflict (key) do update
    set value = excluded.value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_set_setting(text, jsonb) from public, anon;
grant execute on function public.admin_set_setting(text, jsonb) to authenticated;
