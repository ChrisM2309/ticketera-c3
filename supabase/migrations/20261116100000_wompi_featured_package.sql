-- Destacados y paquete empresas con Wompi sandbox (decisión D-68).
-- La compra nace `awaiting_payment` con su enlace de Wompi; el webhook la liquida:
--   destacado aprobado → `pending` (lo revisa el administrador, como antes) y descuenta los días gratis del paquete;
--   paquete aprobado   → `active` con los beneficios del paquete.
-- Un destacado cubierto por completo por el paquete (total 0) no pasa por Wompi: queda `pending` al iniciarse.
-- Las funciones de simulación (request_paid_featured, purchase_business_package) dejan de ser ejecutables
-- por usuarios: la compra ya no puede aprobarse desde el navegador.

-- 1. Estados y columnas de Wompi.
alter table public.featured_placements drop constraint if exists featured_placements_status_check;
alter table public.featured_placements
  add constraint featured_placements_status_check
  check (status in ('awaiting_payment', 'pending', 'approved', 'rejected', 'payment_failed', 'cancelled'));

alter table public.business_packages drop constraint if exists business_packages_status_check;
alter table public.business_packages
  add constraint business_packages_status_check
  check (status in ('awaiting_payment', 'active', 'payment_failed', 'expired'));

alter table public.featured_placements
  add column if not exists wompi_link_id bigint,
  add column if not exists wompi_link_url text check (wompi_link_url is null or char_length(wompi_link_url) <= 500),
  add column if not exists provider_transaction_id text
    check (provider_transaction_id is null or char_length(provider_transaction_id) between 1 and 100);

alter table public.business_packages
  add column if not exists wompi_link_id bigint,
  add column if not exists wompi_link_url text check (wompi_link_url is null or char_length(wompi_link_url) <= 500),
  add column if not exists provider_transaction_id text
    check (provider_transaction_id is null or char_length(provider_transaction_id) between 1 and 100);

create unique index if not exists featured_placements_provider_tx_key
  on public.featured_placements (provider_transaction_id) where provider_transaction_id is not null;
create unique index if not exists business_packages_provider_tx_key
  on public.business_packages (provider_transaction_id) where provider_transaction_id is not null;

-- 2. Inicio de la compra por el organizador. Aplica las reglas del paquete (días gratis y descuento)
--    igual que la simulación, pero sin descontar nada todavía: eso ocurre al aprobar el pago.
create or replace function public.start_paid_featured(
  p_event_id uuid,
  p_starts_on date,
  p_days integer
)
returns table (placement_id uuid, total_cents integer, event_title text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organizer_id uuid;
  v_title text;
  v_daily_rate integer;
  v_free_days integer := 0;
  v_discount integer := 0;
  v_total integer;
  v_package_id uuid;
  v_remaining integer;
  v_benefits jsonb;
  v_id uuid;
begin
  if not public.owns_event(p_event_id) then
    raise exception 'Solo puedes destacar un evento propio.' using errcode = '42501';
  end if;

  select e.organizer_id, e.title into v_organizer_id, v_title
    from public.events e
   where e.id = p_event_id
     and e.status = 'published';

  if v_organizer_id is null then
    raise exception 'Solo se destacan eventos publicados.' using errcode = '22023';
  end if;

  if p_days is null or p_days not between 1 and 30 then
    raise exception 'Los días deben estar entre 1 y 30.' using errcode = '22023';
  end if;

  if p_starts_on is null or p_starts_on < current_date then
    raise exception 'La fecha de inicio no puede estar en el pasado.' using errcode = '22023';
  end if;

  select (s.value #>> '{}')::integer
    into v_daily_rate
    from public.site_settings s
   where s.key = 'featured_daily_rate_cents'
     and jsonb_typeof(s.value) = 'number'
     and (s.value #>> '{}') ~ '^[0-9]+$';

  if v_daily_rate is null then
    raise exception 'La tarifa diaria de destacados aún está por definir.' using errcode = '22023';
  end if;

  select id, featured_days_remaining, benefits into v_package_id, v_remaining, v_benefits
    from public.business_packages
   where organizer_id = v_organizer_id
     and status = 'active'
     and ends_on >= current_date;

  if v_package_id is not null then
    v_free_days := least(p_days, v_remaining);
    v_discount := least(100, greatest(0, coalesce((v_benefits ->> 'featuredDiscountPercent')::integer, 0)));
  end if;

  v_total := round(((p_days - v_free_days) * v_daily_rate * (100 - v_discount))::numeric / 100)::integer;

  insert into public.featured_placements (
    event_id, source, starts_on, ends_on, daily_rate_cents, free_days, total_cents, status, requested_by
  ) values (
    p_event_id, 'paid', p_starts_on, p_starts_on + p_days - 1, v_daily_rate, v_free_days, v_total,
    case when v_total = 0 then 'pending' else 'awaiting_payment' end,
    auth.uid()
  ) returning id into v_id;

  -- Cubierto por el paquete: no hay pago. Los días gratis se descuentan ya porque no depende de Wompi.
  if v_total = 0 and v_package_id is not null then
    update public.business_packages
       set featured_days_remaining = featured_days_remaining - v_free_days
     where id = v_package_id;
  end if;

  return query select v_id, v_total, v_title;
end;
$$;

create or replace function public.start_package_purchase(p_organizer_id uuid)
returns table (package_id uuid, price_cents integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_price integer;
  v_benefits jsonb;
  v_id uuid;
begin
  if not public.owns_organizer(p_organizer_id) then
    raise exception 'Solo puedes comprar un paquete para tu propio organizador.' using errcode = '42501';
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

  insert into public.business_packages (
    organizer_id, starts_on, ends_on, price_cents, benefits,
    featured_days_remaining, events_remaining, status
  ) values (
    p_organizer_id, current_date, current_date + 365, v_price, v_benefits, 0, 0, 'awaiting_payment'
  ) returning id into v_id;

  return query select v_id, v_price;
end;
$$;

-- 3. Liquidación por el webhook (solo service_role). Idempotente por id de transacción.
create or replace function public.settle_featured_payment(p_id uuid, p_transaction_id text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row record;
  v_package_id uuid;
begin
  select f.status, f.provider_transaction_id, f.free_days, f.event_id into v_row
    from public.featured_placements f
   where f.id = p_id
   for update;

  if not found then
    raise exception 'El destacado no existe.' using errcode = '22023';
  end if;

  if v_row.provider_transaction_id = p_transaction_id then
    return 'already_settled';
  end if;

  if v_row.status <> 'awaiting_payment' then
    raise exception 'El destacado no espera pago.' using errcode = '22023';
  end if;

  update public.featured_placements
     set status = 'pending', provider_transaction_id = p_transaction_id
   where id = p_id;

  -- Al aprobarse, los días gratis del paquete se gastan (si el paquete sigue activo).
  if v_row.free_days > 0 then
    select p.id into v_package_id
      from public.business_packages p
      join public.events e on e.organizer_id = p.organizer_id
     where e.id = v_row.event_id
       and p.status = 'active'
       and p.ends_on >= current_date
     for update of p;

    if v_package_id is not null then
      update public.business_packages p
         set featured_days_remaining = greatest(0, p.featured_days_remaining - v_row.free_days)
       where p.id = v_package_id;
    end if;
  end if;

  return 'settled';
end;
$$;

create or replace function public.settle_package_payment(p_id uuid, p_transaction_id text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row record;
begin
  select p.status, p.provider_transaction_id, p.organizer_id, p.benefits into v_row
    from public.business_packages p
   where p.id = p_id
   for update;

  if not found then
    raise exception 'El paquete no existe.' using errcode = '22023';
  end if;

  if v_row.provider_transaction_id = p_transaction_id then
    return 'already_settled';
  end if;

  if v_row.status <> 'awaiting_payment' then
    raise exception 'El paquete no espera pago.' using errcode = '22023';
  end if;

  if exists (select 1 from public.business_packages where organizer_id = v_row.organizer_id and status = 'active') then
    raise exception 'El organizador ya tiene un paquete activo.' using errcode = '23505';
  end if;

  update public.business_packages
     set status = 'active',
         provider_transaction_id = p_transaction_id,
         featured_days_remaining = greatest(0, coalesce((v_row.benefits ->> 'featuredDaysIncluded')::integer, 30)),
         events_remaining = greatest(0, coalesce((v_row.benefits ->> 'eventsIncluded')::integer, 10))
   where id = p_id;

  return 'settled';
end;
$$;

-- 4. Permisos.
revoke all on function public.start_paid_featured(uuid, date, integer) from public, anon;
grant execute on function public.start_paid_featured(uuid, date, integer) to authenticated;
revoke all on function public.start_package_purchase(uuid) from public, anon;
grant execute on function public.start_package_purchase(uuid) to authenticated;

revoke all on function public.settle_featured_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.settle_featured_payment(uuid, text) to service_role;
revoke all on function public.settle_package_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.settle_package_payment(uuid, text) to service_role;

-- La simulación queda sin ejecución para usuarios: ninguna compra puede aprobarse desde el navegador.
revoke execute on function public.request_paid_featured(uuid, date, integer, text) from authenticated;
revoke execute on function public.purchase_business_package(uuid, text) from authenticated;
