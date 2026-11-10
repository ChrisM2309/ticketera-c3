-- Fase 6.1: validación atómica del QR por el organizador.
create or replace function public.organizer_check_in(p_event_id uuid, p_qr_hash text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket_id uuid;
  v_ticket_event_id uuid;
  v_order_status text;
  v_checked_in_at timestamptz;
  v_updated_id uuid;
begin
  if not public.owns_event(p_event_id) and not public.is_admin() then
    raise exception 'No tienes permiso para registrar ingresos de este evento.' using errcode = '42501';
  end if;

  select t.id, o.event_id, o.status, t.checked_in_at
    into v_ticket_id, v_ticket_event_id, v_order_status, v_checked_in_at
    from public.tickets t
    join public.orders o on o.id = t.order_id
   where t.qr_token_hash = p_qr_hash;

  if not found or v_order_status <> 'confirmed' then
    return 'not_found';
  end if;
  if v_ticket_event_id <> p_event_id then
    return 'wrong_event';
  end if;
  if v_checked_in_at is not null then
    return 'already_checked_in';
  end if;

  update public.tickets
     set checked_in_at = now()
   where id = v_ticket_id and checked_in_at is null
   returning id into v_updated_id;

  if v_updated_id is null then
    return 'already_checked_in';
  end if;
  return 'checked_in';
end;
$$;

revoke all on function public.organizer_check_in(uuid, text) from public, anon;
grant execute on function public.organizer_check_in(uuid, text) to authenticated;

create or replace function public.organizer_event_check_in_counts(p_event_id uuid)
returns table (issued integer, checked_in integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.owns_event(p_event_id) and not public.is_admin() then
    raise exception 'No tienes permiso para consultar los ingresos de este evento.' using errcode = '42501';
  end if;

  return query
    select count(*) filter (where o.status = 'confirmed')::integer,
           count(*) filter (where o.status = 'confirmed' and t.checked_in_at is not null)::integer
      from public.tickets t
      join public.orders o on o.id = t.order_id
     where o.event_id = p_event_id;
end;
$$;

revoke all on function public.organizer_event_check_in_counts(uuid) from public, anon;
grant execute on function public.organizer_event_check_in_counts(uuid) to authenticated;
