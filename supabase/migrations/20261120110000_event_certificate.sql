alter table public.events add column includes_certificate boolean not null default false;

create function public.create_organizer_event(
  p_organizer_id uuid, p_slug text, p_title text, p_description text, p_agenda text,
  p_mode text, p_venue text, p_image_path text, p_starts_at timestamptz, p_ends_at timestamptz,
  p_event_type_id uuid, p_topic_id uuid, p_location_id uuid, p_ticket_types jsonb,
  p_speakers jsonb, p_includes_certificate boolean
) returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_event_id uuid;
begin
  if p_includes_certificate is null then
    raise exception 'La opción de certificado no es válida.' using errcode = '22023';
  end if;
  v_event_id := public.create_organizer_event(p_organizer_id, p_slug, p_title, p_description,
    p_agenda, p_mode, p_venue, p_image_path, p_starts_at, p_ends_at, p_event_type_id,
    p_topic_id, p_location_id, p_ticket_types, p_speakers);
  update public.events set includes_certificate = p_includes_certificate where id = v_event_id;
  return v_event_id;
end;
$$;
revoke all on function public.create_organizer_event(uuid,text,text,text,text,text,text,text,timestamptz,timestamptz,uuid,uuid,uuid,jsonb,jsonb,boolean) from public, anon;
grant execute on function public.create_organizer_event(uuid,text,text,text,text,text,text,text,timestamptz,timestamptz,uuid,uuid,uuid,jsonb,jsonb,boolean) to authenticated;
