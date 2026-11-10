-- Fase 4 (BM-05): paquete anual para empresas y seguimiento.

create table public.business_packages (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  price_cents integer not null check (price_cents >= 0),
  benefits jsonb not null,
  featured_days_remaining integer not null check (featured_days_remaining >= 0),
  events_remaining integer not null check (events_remaining >= 0),
  status text not null check (status in ('active', 'payment_failed', 'expired')),
  created_at timestamptz not null default now(),
  constraint business_packages_dates_check check (ends_on >= starts_on)
);

create unique index business_packages_one_active_per_organizer
  on public.business_packages (organizer_id) where status = 'active';

create table public.package_followup_requests (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.business_packages (id) on delete cascade,
  message text not null check (char_length(message) between 5 and 500),
  status text not null default 'open' check (status in ('open', 'answered')),
  created_at timestamptz not null default now()
);

alter table public.business_packages enable row level security;
alter table public.package_followup_requests enable row level security;

revoke all on public.business_packages, public.package_followup_requests from anon, authenticated;
grant select on public.business_packages, public.package_followup_requests to authenticated;

create policy business_packages_owner_read on public.business_packages
  for select to authenticated
  using (public.owns_organizer(organizer_id));

create policy business_packages_admin_read on public.business_packages
  for select to authenticated
  using (public.is_admin());

create policy package_followup_owner_read on public.package_followup_requests
  for select to authenticated
  using (exists (
    select 1 from public.business_packages p
    where p.id = package_id and public.owns_organizer(p.organizer_id)
  ));

create policy package_followup_admin_read on public.package_followup_requests
  for select to authenticated
  using (public.is_admin());

create or replace function public.purchase_business_package(p_organizer_id uuid, p_decision text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_price integer;
  v_benefits jsonb;
  v_featured_days integer;
  v_events integer;
  v_id uuid;
begin
  if not public.owns_organizer(p_organizer_id) then
    raise exception 'Solo puedes comprar un paquete para tu propio organizador.' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'La decisión del pago simulado no es válida.' using errcode = '22023';
  end if;

  select (value #>> '{}')::integer into v_price
    from public.site_settings
   where key = 'package_annual_price_cents'
     and jsonb_typeof(value) = 'number'
     and (value #>> '{}') ~ '^[0-9]+$';
  if v_price is null then
    raise exception 'El precio anual del paquete aún está por definir.' using errcode = '22023';
  end if;
  if exists (select 1 from public.business_packages where organizer_id = p_organizer_id and status = 'active') then
    raise exception 'El organizador ya tiene un paquete activo.' using errcode = '23505';
  end if;

  select coalesce((select value from public.site_settings where key = 'package_benefits'),
    '{"eventsIncluded":10,"featuredDaysIncluded":30,"featuredDiscountPercent":50,"personalizedFollowUp":true,"advancedReport":true}'::jsonb)
    into v_benefits;
  v_featured_days := greatest(0, coalesce((v_benefits ->> 'featuredDaysIncluded')::integer, 30));
  v_events := greatest(0, coalesce((v_benefits ->> 'eventsIncluded')::integer, 10));

  insert into public.business_packages (
    organizer_id, starts_on, ends_on, price_cents, benefits,
    featured_days_remaining, events_remaining, status
  ) values (
    p_organizer_id, current_date, current_date + 365, v_price, v_benefits,
    case when p_decision = 'approved' then v_featured_days else 0 end,
    case when p_decision = 'approved' then v_events else 0 end,
    case when p_decision = 'approved' then 'active' else 'payment_failed' end
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.request_package_followup(p_package_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if not exists (
    select 1 from public.business_packages
    where id = p_package_id and status = 'active' and public.owns_organizer(organizer_id)
  ) then
    raise exception 'Solo el dueño puede pedir seguimiento de un paquete activo.' using errcode = '42501';
  end if;
  if p_message is null or char_length(btrim(p_message)) not between 5 and 500 then
    raise exception 'El mensaje debe tener entre 5 y 500 caracteres.' using errcode = '22023';
  end if;
  insert into public.package_followup_requests (package_id, message) values (p_package_id, btrim(p_message)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.answer_package_followup(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede contestar seguimientos.' using errcode = '42501';
  end if;
  update public.package_followup_requests set status = 'answered' where id = p_id and status = 'open';
  if not found then raise exception 'El seguimiento no está abierto.' using errcode = '22023'; end if;
end;
$$;

-- Sustituye la lógica de tarifa de 4.2 para aplicar los beneficios del paquete.
create or replace function public.request_paid_featured(
  p_event_id uuid, p_starts_on date, p_days integer, p_decision text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organizer_id uuid;
  v_daily_rate integer;
  v_placement_id uuid;
  v_free_days integer := 0;
  v_discount integer := 0;
  v_total integer;
  v_package_id uuid;
  v_remaining integer;
  v_benefits jsonb;
begin
  if not public.owns_event(p_event_id) then raise exception 'Solo puedes destacar un evento propio.' using errcode = '42501'; end if;
  select organizer_id into v_organizer_id from public.events where id = p_event_id and status = 'published';
  if v_organizer_id is null then raise exception 'Solo se destacan eventos publicados.' using errcode = '22023'; end if;
  if p_days is null or p_days not between 1 and 30 then raise exception 'Los días deben estar entre 1 y 30.' using errcode = '22023'; end if;
  if p_starts_on is null or p_starts_on < current_date then raise exception 'La fecha de inicio no puede estar en el pasado.' using errcode = '22023'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'La decisión del pago simulado no es válida.' using errcode = '22023'; end if;

  select (value #>> '{}')::integer into v_daily_rate from public.site_settings
   where key = 'featured_daily_rate_cents' and jsonb_typeof(value) = 'number' and (value #>> '{}') ~ '^[0-9]+$';
  if v_daily_rate is null then raise exception 'La tarifa diaria de destacados aún está por definir.' using errcode = '22023'; end if;

  select id, featured_days_remaining, benefits into v_package_id, v_remaining, v_benefits
    from public.business_packages where organizer_id = v_organizer_id and status = 'active' and ends_on >= current_date for update;
  if v_package_id is not null then
    v_free_days := least(p_days, v_remaining);
    v_discount := least(100, greatest(0, coalesce((v_benefits ->> 'featuredDiscountPercent')::integer, 0)));
  end if;
  if p_decision = 'rejected' then
    v_free_days := 0;
    v_discount := 0;
  end if;
  v_total := round(((p_days - v_free_days) * v_daily_rate * (100 - v_discount))::numeric / 100)::integer;

  insert into public.featured_placements (event_id, source, starts_on, ends_on, daily_rate_cents, free_days, total_cents, status, requested_by)
  values (p_event_id, 'paid', p_starts_on, p_starts_on + p_days - 1, v_daily_rate, v_free_days, v_total,
          case when p_decision = 'approved' then 'pending' else 'payment_failed' end, auth.uid()) returning id into v_placement_id;
  if p_decision = 'approved' and v_package_id is not null then
    update public.business_packages set featured_days_remaining = featured_days_remaining - v_free_days where id = v_package_id;
  end if;
  return v_placement_id;
end;
$$;

revoke all on function public.purchase_business_package(uuid, text), public.request_package_followup(uuid, text), public.answer_package_followup(uuid) from public, anon;
grant execute on function public.purchase_business_package(uuid, text), public.request_package_followup(uuid, text), public.answer_package_followup(uuid) to authenticated;
