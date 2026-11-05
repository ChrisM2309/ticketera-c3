-- T16: moderación mínima.
-- 1) El administrador aprueba o rechaza un evento pendiente. La transición se hace en una
--    sola función: solo pending -> published o pending -> rejected, con bloqueo de la fila.
-- 2) El organizador ve cuántos boletos emitidos tiene cada uno de sus eventos, sin acceder
--    a órdenes ni boletos de nadie (la lectura de tickets es solo del administrador).

-- ---------------------------------------------------------------------------
-- Revisión de eventos (solo administrador)
-- ---------------------------------------------------------------------------

create or replace function public.review_organizer_event(
  p_event_id uuid,
  p_decision text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event record;
  v_next_status text;
begin
  -- Comprobación en servidor de base de datos: no depende de que el cliente llame bien.
  if not public.is_admin() then
    raise exception 'Solo el administrador puede revisar eventos.' using errcode = '42501';
  end if;

  if p_decision not in ('approve', 'reject') then
    raise exception 'La decisión de revisión no es válida.' using errcode = '22023';
  end if;

  select e.id, e.status, e.starts_at, e.ends_at
    into v_event
    from public.events e
   where e.id = p_event_id
     for update;

  if not found then
    raise exception 'El evento no existe.' using errcode = '22023';
  end if;

  if v_event.status <> 'pending' then
    raise exception 'Solo se revisan eventos pendientes.' using errcode = '22023';
  end if;

  if p_decision = 'approve' and coalesce(v_event.ends_at, v_event.starts_at) < now() then
    raise exception 'El evento ya terminó y no puede publicarse.' using errcode = '22023';
  end if;

  v_next_status := case when p_decision = 'approve' then 'published' else 'rejected' end;

  update public.events e
     set status = v_next_status
   where e.id = p_event_id;

  return v_next_status;
end;
$$;

revoke all on function public.review_organizer_event(uuid, text) from public, anon;
grant execute on function public.review_organizer_event(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Conteo de boletos emitidos por evento (solo para el propietario)
-- ---------------------------------------------------------------------------

create or replace function public.organizer_event_ticket_counts()
returns table (
  event_id uuid,
  tickets_issued bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select e.id, count(tk.id)
    from public.events e
    join public.organizers o on o.id = e.organizer_id
    left join public.ticket_types tt on tt.event_id = e.id
    left join public.tickets tk on tk.ticket_type_id = tt.id
   where o.owner_user_id = auth.uid()
   group by e.id;
$$;

revoke all on function public.organizer_event_ticket_counts() from public, anon;
grant execute on function public.organizer_event_ticket_counts() to authenticated;
