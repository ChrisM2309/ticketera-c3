-- Edición acotada y archivo reversible de eventos desde el panel del organizador.
-- No modifica tipos de entrada, pedidos ni boletos.
create or replace function public.organizer_update_event_details(p_event_id uuid, p_details jsonb)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  if auth.uid() is null or not public.owns_event(p_event_id) then
    raise exception 'No tienes permiso para editar este evento.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_details) <> 'object'
     or jsonb_typeof(p_details -> 'title') <> 'string'
     or jsonb_typeof(p_details -> 'description') <> 'string'
     or jsonb_typeof(p_details -> 'mode') <> 'string'
     or jsonb_typeof(p_details -> 'starts_at') <> 'string'
     or jsonb_typeof(p_details -> 'event_type_id') <> 'string'
     or jsonb_typeof(p_details -> 'includes_certificate') <> 'boolean'
     or jsonb_typeof(p_details -> 'speakers') <> 'array' then
    raise exception 'Los datos del evento no son válidos.' using errcode = '22023';
  end if;

  if char_length(btrim(p_details ->> 'title')) not between 3 and 160
     or char_length(btrim(p_details ->> 'description')) not between 10 and 4000
     or char_length(coalesce(p_details ->> 'agenda', '')) > 4000
     or p_details ->> 'mode' not in ('presencial', 'virtual')
     or not public.is_valid_speakers(p_details -> 'speakers') then
    raise exception 'Revisa los datos del evento.' using errcode = '22023';
  end if;

  v_starts_at := (p_details ->> 'starts_at')::timestamptz;
  v_ends_at := nullif(p_details ->> 'ends_at', '')::timestamptz;
  if v_starts_at <= now() or (v_ends_at is not null and v_ends_at <= v_starts_at) then
    raise exception 'Las fechas del evento no son válidas.' using errcode = '22023';
  end if;

  if p_details ->> 'mode' = 'presencial'
     and (nullif(p_details ->> 'venue', '') is null or nullif(p_details ->> 'location_id', '') is null) then
    raise exception 'Los eventos presenciales requieren lugar y ciudad.' using errcode = '22023';
  end if;
  if p_details ->> 'mode' = 'virtual'
     and (nullif(p_details ->> 'venue', '') is not null or nullif(p_details ->> 'location_id', '') is not null) then
    raise exception 'Los eventos virtuales no llevan lugar ni ciudad.' using errcode = '22023';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status = 'archived' then
    raise exception 'El evento no está disponible para edición.' using errcode = '22023';
  end if;

  update public.events set
    title = btrim(p_details ->> 'title'),
    description = btrim(p_details ->> 'description'),
    agenda = nullif(btrim(p_details ->> 'agenda'), ''),
    mode = p_details ->> 'mode',
    venue = nullif(btrim(p_details ->> 'venue'), ''),
    location_id = nullif(p_details ->> 'location_id', '')::uuid,
    event_type_id = (p_details ->> 'event_type_id')::uuid,
    topic_id = nullif(p_details ->> 'topic_id', '')::uuid,
    image_path = nullif(btrim(p_details ->> 'image_path'), ''),
    starts_at = v_starts_at,
    ends_at = v_ends_at,
    speakers = p_details -> 'speakers',
    includes_certificate = (p_details ->> 'includes_certificate')::boolean,
    status = case when v_event.status = 'draft' then 'draft' else 'pending' end
  where id = p_event_id;

  return case when v_event.status = 'draft' then 'draft' else 'pending' end;
end;
$$;

create or replace function public.organizer_archive_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.owns_event(p_event_id) then
    raise exception 'No tienes permiso para archivar este evento.' using errcode = '42501';
  end if;

  update public.events set status = 'archived'
   where id = p_event_id and status <> 'archived';
  if not found then
    raise exception 'El evento no existe.' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.organizer_update_event_details(uuid, jsonb), public.organizer_archive_event(uuid) from public, anon;
grant execute on function public.organizer_update_event_details(uuid, jsonb), public.organizer_archive_event(uuid) to authenticated;
