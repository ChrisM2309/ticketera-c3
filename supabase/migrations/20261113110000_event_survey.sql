-- Fase 6.4: respuestas de encuesta con acceso únicamente por enlace de orden validado.
create table public.event_survey_responses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now()
);
create index event_survey_responses_event_idx on public.event_survey_responses (event_id, created_at);

alter table public.event_survey_responses enable row level security;
revoke all on public.event_survey_responses from public, anon, authenticated;
grant select, insert on public.event_survey_responses to service_role;

alter table public.notification_outbox drop constraint notification_outbox_template_check;
alter table public.notification_outbox
  add constraint notification_outbox_template_check check (template in ('ticket', 'reminder_24h', 'survey'));

create or replace function public.submit_survey(
  p_order_id uuid,
  p_token_hash text,
  p_rating smallint,
  p_comment text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
  v_order_status text;
  v_starts_at timestamptz;
  v_inserted_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'La calificación debe estar entre 1 y 5.' using errcode = '22023';
  end if;
  if p_comment is not null and char_length(p_comment) > 500 then
    raise exception 'El comentario no puede superar 500 caracteres.' using errcode = '22023';
  end if;

  select o.event_id, o.status, e.starts_at
    into v_event_id, v_order_status, v_starts_at
    from public.orders o
    join public.events e on e.id = o.event_id
   where o.id = p_order_id and o.public_token_hash = p_token_hash;

  if not found or v_order_status <> 'confirmed' then
    return 'invalid';
  end if;
  if v_starts_at > now() then
    return 'too_early';
  end if;

  insert into public.event_survey_responses (order_id, event_id, rating, comment)
  values (p_order_id, v_event_id, p_rating, nullif(btrim(p_comment), ''))
  on conflict (order_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return 'already_answered';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.submit_survey(uuid, text, smallint, text) from public;
grant execute on function public.submit_survey(uuid, text, smallint, text) to anon, authenticated;

-- Completa los agregados del reporte sin devolver los comentarios.
create or replace function public.organizer_event_report(p_event_id uuid)
returns table (
  issued integer,
  checked_in integer,
  subtotal_cents integer,
  fee_cents integer,
  event_ended boolean,
  survey_count integer,
  survey_average numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.owns_event(p_event_id) and not public.is_admin() then
    raise exception 'No tienes permiso para consultar el reporte de este evento.' using errcode = '42501';
  end if;

  return query
    select
      (select count(*)::integer from public.tickets t join public.orders o on o.id = t.order_id
        where o.event_id = e.id and o.status = 'confirmed'),
      (select count(*)::integer from public.tickets t join public.orders o on o.id = t.order_id
        where o.event_id = e.id and o.status = 'confirmed' and t.checked_in_at is not null),
      (select coalesce(sum(o.subtotal_cents), 0)::integer from public.orders o
        where o.event_id = e.id and o.status = 'confirmed'),
      (select coalesce(sum(o.fee_cents), 0)::integer from public.orders o
        where o.event_id = e.id and o.status = 'confirmed'),
      coalesce(e.ends_at, e.starts_at) <= now(),
      (select count(*)::integer from public.event_survey_responses s where s.event_id = e.id),
      (select round(avg(s.rating)::numeric, 1) from public.event_survey_responses s where s.event_id = e.id)
    from public.events e
    where e.id = p_event_id;
end;
$$;

revoke all on function public.organizer_event_report(uuid) from public, anon;
grant execute on function public.organizer_event_report(uuid) to authenticated;
