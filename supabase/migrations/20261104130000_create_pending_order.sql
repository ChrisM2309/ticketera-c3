-- T09: una orden de invitado se crea desde el servidor con precios y cupos recalculados.
-- La confirmación, el inventario y los boletos siguen siendo responsabilidad de T10/T11.

create or replace function public.create_pending_order(
  p_event_id uuid,
  p_items jsonb,
  p_buyer_name text,
  p_buyer_email text,
  p_public_token_hash text,
  p_fee_percent integer
)
returns table (
  order_id uuid,
  subtotal_cents integer,
  fee_cents integer,
  total_cents integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_subtotal_cents integer := 0;
  v_fee_cents integer;
  v_name text := btrim(p_buyer_name);
  v_email text := lower(btrim(p_buyer_email));
  v_item record;
  v_ticket record;
begin
  if p_fee_percent is null or p_fee_percent not between 0 and 100 then
    raise exception 'Comisión DEMO inválida.' using errcode = '22023';
  end if;

  if v_name is null or char_length(v_name) not between 2 and 120 then
    raise exception 'El nombre debe tener entre 2 y 120 caracteres.' using errcode = '22023';
  end if;

  if v_email is null
     or char_length(v_email) not between 5 and 254
     or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'El correo electrónico no es válido.' using errcode = '22023';
  end if;

  if p_public_token_hash is null or p_public_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'El token de checkout no es válido.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Selecciona al menos una entrada.' using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_items) as selected(item)
     where jsonb_typeof(selected.item) <> 'object'
        or jsonb_typeof(selected.item -> 'ticketTypeId') <> 'string'
        or jsonb_typeof(selected.item -> 'quantity') <> 'number'
        or (selected.item ->> 'ticketTypeId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or (selected.item ->> 'quantity') !~ '^[1-9][0-9]*$'
  ) then
    raise exception 'La selección de entradas no es válida.' using errcode = '22023';
  end if;

  select e.id
    into v_event_id
    from public.events e
   where e.id = p_event_id
     and e.status = 'published'
     and coalesce(e.ends_at, e.starts_at) >= now();

  if not found then
    raise exception 'Este evento no está disponible para compra.' using errcode = '22023';
  end if;

  for v_item in
    select (selected.item ->> 'ticketTypeId')::uuid as ticket_type_id,
           sum((selected.item ->> 'quantity')::integer)::integer as quantity
      from jsonb_array_elements(p_items) as selected(item)
     group by (selected.item ->> 'ticketTypeId')::uuid
  loop
    select t.id, t.price_cents, t.quantity_total, t.quantity_sold, t.max_per_order, t.is_active
      into v_ticket
      from public.ticket_types t
     where t.id = v_item.ticket_type_id
       and t.event_id = v_event_id;

    if not found or not v_ticket.is_active then
      raise exception 'Esta entrada ya no está disponible.' using errcode = '22023';
    end if;

    if v_item.quantity > v_ticket.max_per_order then
      raise exception 'La cantidad supera el máximo permitido por orden.' using errcode = '22023';
    end if;

    if v_item.quantity > v_ticket.quantity_total - v_ticket.quantity_sold then
      raise exception 'La cantidad supera los cupos disponibles.' using errcode = '22023';
    end if;

    v_subtotal_cents := v_subtotal_cents + (v_ticket.price_cents * v_item.quantity);
  end loop;

  v_fee_cents := round((v_subtotal_cents::numeric * p_fee_percent) / 100)::integer;

  insert into public.orders (
    id, public_token_hash, event_id, buyer_name, buyer_email,
    status, subtotal_cents, fee_cents, total_cents
  ) values (
    v_order_id, p_public_token_hash, v_event_id, v_name, v_email,
    'pending', v_subtotal_cents, v_fee_cents, v_subtotal_cents + v_fee_cents
  );

  insert into public.order_items (
    order_id, ticket_type_id, unit_price_cents, quantity, line_total_cents
  )
  select
    v_order_id,
    t.id,
    t.price_cents,
    grouped.quantity,
    t.price_cents * grouped.quantity
  from (
    select (selected.item ->> 'ticketTypeId')::uuid as ticket_type_id,
           sum((selected.item ->> 'quantity')::integer)::integer as quantity
      from jsonb_array_elements(p_items) as selected(item)
     group by (selected.item ->> 'ticketTypeId')::uuid
  ) as grouped
  join public.ticket_types t on t.id = grouped.ticket_type_id and t.event_id = v_event_id;

  return query
  select v_order_id, v_subtotal_cents, v_fee_cents, v_subtotal_cents + v_fee_cents;
end;
$$;

revoke all on function public.create_pending_order(uuid, jsonb, text, text, text, integer) from public;
grant execute on function public.create_pending_order(uuid, jsonb, text, text, text, integer) to service_role;
