-- CO-02: ponentes del evento. Lista corta de nombre y rol que se muestra en la ficha pública.
-- Los límites viven en la base (hasta 8 ponentes, nombre de 1 a 80 y rol de 0 a 120 caracteres);
-- el formulario ofrece seis filas y el servidor repite la validación antes de llamar a la base.

create or replace function public.is_valid_speakers(value jsonb)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when value is null or jsonb_typeof(value) <> 'array' then false
    when jsonb_array_length(value) > 8 then false
    else not exists (
      select 1
        from jsonb_array_elements(value) as item
       where jsonb_typeof(item) <> 'object'
          or jsonb_typeof(item -> 'name') is distinct from 'string'
          or jsonb_typeof(item -> 'role') is distinct from 'string'
          or btrim(item ->> 'name') = ''
          or char_length(item ->> 'name') > 80
          or char_length(item ->> 'role') > 120
    )
  end
$$;

alter table public.events
  add column speakers jsonb not null default '[]'::jsonb,
  add constraint events_speakers_check check (public.is_valid_speakers(speakers));

-- La función gana un parámetro con valor por defecto: se elimina la firma anterior para que
-- no queden dos versiones y se vuelven a conceder los mismos permisos (security invoker).
drop function public.create_organizer_event(
  uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, uuid, uuid, uuid, jsonb
);

create function public.create_organizer_event(
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
  p_ticket_types jsonb,
  p_speakers jsonb default '[]'::jsonb
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
    mode, venue, image_path, starts_at, ends_at, speakers, status
  ) values (
    p_organizer_id, p_event_type_id, p_topic_id, p_location_id, p_slug, p_title, p_description, p_agenda,
    p_mode, p_venue, p_image_path, p_starts_at, p_ends_at, coalesce(p_speakers, '[]'::jsonb), 'pending'
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
  uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, uuid, uuid, uuid, jsonb, jsonb
) from public, anon;
grant execute on function public.create_organizer_event(
  uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, uuid, uuid, uuid, jsonb, jsonb
) to authenticated;
