-- Fase 4 (BM-02): destacados manuales y pagados con vigencia.

create table public.featured_placements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  source text not null check (source in ('manual', 'paid')),
  starts_on date not null,
  ends_on date not null,
  days integer generated always as (ends_on - starts_on + 1) stored,
  daily_rate_cents integer,
  free_days integer not null default 0 check (free_days >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  status text not null check (status in ('pending', 'approved', 'rejected', 'payment_failed', 'cancelled')),
  requested_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint featured_placements_dates_check check (ends_on >= starts_on),
  constraint featured_placements_paid_days_check check (ends_on - starts_on + 1 <= 30 or source = 'manual')
);

alter table public.featured_placements enable row level security;

revoke all on public.featured_placements from anon, authenticated;
grant select on public.featured_placements to anon, authenticated;

create policy featured_placements_public_read on public.featured_placements
  for select to anon
  using (status = 'approved' and current_date between starts_on and ends_on);

create policy featured_placements_owner_read on public.featured_placements
  for select to authenticated
  using (public.owns_event(event_id));

create or replace function public.request_paid_featured(
  p_event_id uuid,
  p_starts_on date,
  p_days integer,
  p_decision text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_organizer_id uuid;
  v_daily_rate integer;
  v_placement_id uuid;
  v_total integer;
begin
  if not public.owns_event(p_event_id) then
    raise exception 'Solo puedes destacar un evento propio.' using errcode = '42501';
  end if;

  select e.organizer_id
    into v_event_organizer_id
    from public.events e
   where e.id = p_event_id
     and e.status = 'published';

  if v_event_organizer_id is null then
    raise exception 'Solo se destacan eventos publicados.' using errcode = '22023';
  end if;

  if p_days is null or p_days not between 1 and 30 then
    raise exception 'Los días deben estar entre 1 y 30.' using errcode = '22023';
  end if;

  if p_starts_on is null or p_starts_on < current_date then
    raise exception 'La fecha de inicio no puede estar en el pasado.' using errcode = '22023';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'La decisión del pago simulado no es válida.' using errcode = '22023';
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

  v_total := round((p_days * v_daily_rate)::numeric)::integer;

  insert into public.featured_placements (
    event_id, source, starts_on, ends_on, daily_rate_cents, total_cents, status, requested_by
  ) values (
    p_event_id,
    'paid',
    p_starts_on,
    p_starts_on + p_days - 1,
    v_daily_rate,
    v_total,
    case when p_decision = 'approved' then 'pending' else 'payment_failed' end,
    auth.uid()
  )
  returning id into v_placement_id;

  return v_placement_id;
end;
$$;

create or replace function public.admin_review_featured(p_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede revisar destacados.' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'La decisión de revisión no es válida.' using errcode = '22023';
  end if;

  update public.featured_placements
     set status = p_decision,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_id
     and status = 'pending';

  if not found then
    raise exception 'El destacado no está pendiente de revisión.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.admin_create_manual_featured(
  p_event_id uuid,
  p_starts_on date,
  p_ends_on date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_placement_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede crear destacados manuales.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.events where id = p_event_id and status = 'published') then
    raise exception 'Solo se destacan eventos publicados.' using errcode = '22023';
  end if;

  if p_starts_on is null or p_ends_on is null or p_ends_on < p_starts_on then
    raise exception 'El rango de fechas no es válido.' using errcode = '22023';
  end if;

  insert into public.featured_placements (
    event_id, source, starts_on, ends_on, daily_rate_cents, total_cents, status, reviewed_by, reviewed_at
  ) values (
    p_event_id, 'manual', p_starts_on, p_ends_on, null, 0, 'approved', auth.uid(), now()
  ) returning id into v_placement_id;

  return v_placement_id;
end;
$$;

create or replace function public.admin_cancel_featured(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede cancelar destacados.' using errcode = '42501';
  end if;

  update public.featured_placements
     set status = 'cancelled', reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id
     and status <> 'cancelled';

  if not found then
    raise exception 'El destacado no existe o ya está cancelado.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.active_featured(
  p_limit integer default 4,
  p_event_type_id uuid default null
)
returns table (placement_id uuid, event_id uuid, source text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ranked.placement_id, ranked.event_id, ranked.source
    from (
      select distinct on (fp.event_id)
        fp.id as placement_id,
        fp.event_id,
        fp.source,
        case when fp.source = 'manual' then 0 else 1 end as source_order,
        fp.starts_on,
        fp.created_at
        from public.featured_placements fp
        join public.events e on e.id = fp.event_id
       where fp.status = 'approved'
         and current_date between fp.starts_on and fp.ends_on
         and e.status = 'published'
         and coalesce(e.ends_at, e.starts_at) >= now()
         and (p_event_type_id is null or e.event_type_id = p_event_type_id)
       order by fp.event_id, source_order, fp.starts_on, fp.created_at, fp.id
    ) as ranked
   order by ranked.source_order, ranked.starts_on, ranked.created_at, ranked.placement_id
   limit greatest(coalesce(p_limit, 0), 0);
$$;

revoke all on function public.request_paid_featured(uuid, date, integer, text) from public, anon;
grant execute on function public.request_paid_featured(uuid, date, integer, text) to authenticated;
revoke all on function public.admin_review_featured(uuid, text) from public, anon;
grant execute on function public.admin_review_featured(uuid, text) to authenticated;
revoke all on function public.admin_create_manual_featured(uuid, date, date) from public, anon;
grant execute on function public.admin_create_manual_featured(uuid, date, date) to authenticated;
revoke all on function public.admin_cancel_featured(uuid) from public, anon;
grant execute on function public.admin_cancel_featured(uuid) to authenticated;
revoke all on function public.active_featured(integer, uuid) from public;
grant execute on function public.active_featured(integer, uuid) to anon, authenticated;

insert into public.featured_placements (event_id, source, starts_on, ends_on, status)
select event_id, 'manual', current_date, current_date + 365, 'approved'
  from public.event_featured;

drop function public.admin_set_featured(uuid, boolean);
drop table public.event_featured;
