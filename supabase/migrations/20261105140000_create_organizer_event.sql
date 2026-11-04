-- T15: el organizador crea un evento con sus tipos de entrada en una sola llamada.
-- Corre con los permisos del usuario (security invoker): RLS decide si puede insertar y leer.
-- El estado es siempre 'pending'; solo el administrador publica (T16).

create or replace function public.create_organizer_event(
  p_organizer_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_agenda text,
  p_mode text,
  p_venue text,
  p_image_path text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_event_type_id uuid,
  p_topic_id uuid,
  p_location_id uuid,
  p_ticket_types jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
begin
  if jsonb_typeof(p_ticket_types) <> 'array' or jsonb_array_length(p_ticket_types) = 0 then
    raise exception 'Agrega al menos un tipo de entrada.' using errcode = '22023';
  end if;

  insert into public.events (
    organizer_id, event_type_id, topic_id, location_id, slug, title, description, agenda,
    mode, venue, image_path, starts_at, ends_at, status
  ) values (
    p_organizer_id, p_event_type_id, p_topic_id, p_location_id, p_slug, p_title, p_description, p_agenda,
    p_mode, p_venue, p_image_path, p_starts_at, p_ends_at, 'pending'
  )
  returning id into v_event_id;

  insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order, is_active)
  select v_event_id, received.name, received.price_cents, received.quantity_total, received.max_per_order, true
    from jsonb_to_recordset(p_ticket_types) as received(
      name text,
      price_cents integer,
      quantity_total integer,
      max_per_order integer
    );

  return v_event_id;
end;
$$;

revoke all on function public.create_organizer_event(
  uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, uuid, uuid, uuid, jsonb
) from public, anon;
grant execute on function public.create_organizer_event(
  uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, uuid, uuid, uuid, jsonb
) to authenticated;
