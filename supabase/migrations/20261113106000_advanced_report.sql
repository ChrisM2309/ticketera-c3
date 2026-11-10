-- Fase 6.3: agregados superiores disponibles al dueño con paquete activo y al admin.
create or replace function public.organizer_event_daily_issuance(p_event_id uuid)
returns table (day date, issued integer, checked_in integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() and (
    not public.owns_event(p_event_id)
    or not exists (
      select 1
        from public.events e
        join public.business_packages bp on bp.organizer_id = e.organizer_id
       where e.id = p_event_id and bp.status = 'active'
    )
  ) then
    raise exception 'El reporte superior requiere ser dueño del evento y tener un paquete activo.' using errcode = '42501';
  end if;

  return query
    select (t.issued_at at time zone 'UTC')::date,
           count(t.id)::integer,
           count(t.id) filter (where t.checked_in_at is not null)::integer
      from public.orders o
      join public.tickets t on t.order_id = o.id
     where o.event_id = p_event_id and o.status = 'confirmed'
     group by (t.issued_at at time zone 'UTC')::date
     order by (t.issued_at at time zone 'UTC')::date;
end;
$$;

create or replace function public.organizer_event_ticket_type_breakdown(p_event_id uuid)
returns table (ticket_type_name text, issued integer, checked_in integer, subtotal_cents integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() and (
    not public.owns_event(p_event_id)
    or not exists (
      select 1
        from public.events e
        join public.business_packages bp on bp.organizer_id = e.organizer_id
       where e.id = p_event_id and bp.status = 'active'
    )
  ) then
    raise exception 'El reporte superior requiere ser dueño del evento y tener un paquete activo.' using errcode = '42501';
  end if;

  return query
    with ticket_totals as (
      select t.ticket_type_id,
             count(t.id)::integer as issued,
             count(t.id) filter (where t.checked_in_at is not null)::integer as checked_in
        from public.tickets t
        join public.orders o on o.id = t.order_id
       where o.event_id = p_event_id and o.status = 'confirmed'
       group by t.ticket_type_id
    ), subtotals as (
      select oi.ticket_type_id, sum(oi.line_total_cents)::integer as subtotal_cents
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
       where o.event_id = p_event_id and o.status = 'confirmed'
       group by oi.ticket_type_id
    )
    select tt.name, totals.issued, totals.checked_in, coalesce(subtotals.subtotal_cents, 0)::integer
      from ticket_totals totals
      join public.ticket_types tt on tt.id = totals.ticket_type_id
      left join subtotals on subtotals.ticket_type_id = totals.ticket_type_id
     order by tt.name, tt.id;
end;
$$;

revoke all on function public.organizer_event_daily_issuance(uuid), public.organizer_event_ticket_type_breakdown(uuid) from public, anon;
grant execute on function public.organizer_event_daily_issuance(uuid), public.organizer_event_ticket_type_breakdown(uuid) to authenticated;
