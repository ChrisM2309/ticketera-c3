-- Guarda el formulario de ajustes completo como una sola transacción.
create or replace function public.admin_set_settings(p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede cambiar la configuración.' using errcode = '42501';
  end if;

  if p_settings is null or jsonb_typeof(p_settings) <> 'object' then
    raise exception 'Los ajustes deben enviarse como un objeto.' using errcode = '22023';
  end if;

  if not (p_settings ?& array[
       'featured_daily_rate_cents',
       'package_annual_price_cents',
       'package_benefits'
     ]) then
    raise exception 'El formulario debe incluir todas las claves de ajustes requeridas.' using errcode = '22023';
  end if;

  perform public.admin_set_setting(
    'featured_daily_rate_cents',
    case when p_settings->'featured_daily_rate_cents' = 'null'::jsonb
      then null else p_settings->'featured_daily_rate_cents' end
  );
  perform public.admin_set_setting(
    'package_annual_price_cents',
    case when p_settings->'package_annual_price_cents' = 'null'::jsonb
      then null else p_settings->'package_annual_price_cents' end
  );
  perform public.admin_set_setting('package_benefits', p_settings->'package_benefits');
end;
$$;

revoke all on function public.admin_set_settings(jsonb) from public, anon;
grant execute on function public.admin_set_settings(jsonb) to authenticated;
