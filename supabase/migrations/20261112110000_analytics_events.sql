-- Fase 5 (LG-02, MK-01, MK-02): analítica propia con consentimiento.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  name text not null check (name in ('page_view', 'event_view', 'begin_checkout', 'purchase_confirmed', 'featured_purchased', 'package_purchased', 'check_in')),
  path text not null check (char_length(path) <= 200),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 100),
  anon_id uuid,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant insert on public.analytics_events to service_role;
create policy analytics_service_insert on public.analytics_events for insert to service_role with check (true);

create or replace function public.admin_analytics_summary(p_from date, p_to date)
returns table(day date, name text, total bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede consultar métricas.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'El intervalo de fechas no es válido.' using errcode = '22023';
  end if;

  return query
    select a.created_at::date as day, a.name, count(*)::bigint as total
    from public.analytics_events a
    where a.created_at >= p_from::timestamptz
      and a.created_at < (p_to + 1)::timestamptz
    group by a.created_at::date, a.name
    order by a.created_at::date, a.name;
end;
$$;

revoke all on function public.admin_analytics_summary(date, date) from public, anon;
grant execute on function public.admin_analytics_summary(date, date) to authenticated;
