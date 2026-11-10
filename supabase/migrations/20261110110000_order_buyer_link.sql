-- Fase 3 (CP-04): checkout con sesión y reclamo de compras de invitado.
-- create_pending_order recibe el id del usuario (solo lo pasa la API desde la sesión de las cookies; nunca
-- viene del cuerpo de la petición) y lo guarda en orders.buyer_user_id. Se elimina la firma anterior para
-- que no quede una función sin ese parámetro ejecutable, y se mantiene el acceso solo para service_role.
-- claim_order liga una compra de invitado a la cuenta que la reclama, solo si la orden no tiene dueño, el
-- token de la compra coincide y el correo de la cuenta es el mismo de la orden.

drop function public.create_pending_order(uuid, jsonb, text, text, text, integer, uuid, text);

create or replace function public.create_pending_order(
  p_event_id uuid,
  p_items jsonb,
  p_buyer_name text,
  p_buyer_email text,
  p_public_token_hash text,
  p_fee_percent integer,
  p_request_id uuid,
  p_buyer_phone text default null,
  p_buyer_user_id uuid default null
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
  v_phone text := nullif(btrim(p_buyer_phone), '');
  v_buyer_user_id uuid := p_buyer_user_id;
  v_existing record;
  v_inserted uuid;
  v_item record;
  v_ticket record;
  v_lines jsonb := '[]'::jsonb;
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

  if p_request_id is null then
    raise exception 'La solicitud de compra no es válida.' using errcode = '22023';
  end if;

  if v_phone is not null and v_phone !~ '^\+503[0-9]{8}$' then
    raise exception 'El teléfono debe tener el formato +503 seguido de 8 dígitos.' using errcode = '22023';
  end if;

  -- El id de usuario lo pasa la API desde la sesión. Si esa cuenta ya no existe, la compra sigue como invitado.
  if v_buyer_user_id is not null
     and not exists (select 1 from auth.users u where u.id = v_buyer_user_id) then
    v_buyer_user_id := null;
  end if;

  -- Reintento con el mismo request id: se devuelve la orden existente sin crear otra.
  select o.id, o.event_id, o.subtotal_cents, o.fee_cents, o.total_cents
    into v_existing
    from public.orders o
   where o.checkout_request_id = p_request_id;

  if found then
    if v_existing.event_id <> p_event_id then
      raise exception 'Esta solicitud ya se usó con otro evento.' using errcode = '22023';
    end if;

    return query
    select v_existing.id, v_existing.subtotal_cents, v_existing.fee_cents, v_existing.total_cents;
    return;
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
     and coalesce(e.ends_at, e.starts_at) >= now()
   for share;

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
        and t.event_id = v_event_id
      for share;

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
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'ticket_type_id', v_ticket.id,
      'unit_price_cents', v_ticket.price_cents,
      'quantity', v_item.quantity,
      'line_total_cents', v_ticket.price_cents * v_item.quantity
    ));
  end loop;

  v_fee_cents := round((v_subtotal_cents::numeric * p_fee_percent) / 100)::integer;

  insert into public.orders (
    id, public_token_hash, event_id, buyer_name, buyer_email, buyer_phone, checkout_request_id,
    buyer_user_id, status, subtotal_cents, fee_cents, total_cents
  ) values (
    v_order_id, p_public_token_hash, v_event_id, v_name, v_email, v_phone, p_request_id,
    v_buyer_user_id, 'pending', v_subtotal_cents, v_fee_cents, v_subtotal_cents + v_fee_cents
  )
  on conflict (checkout_request_id) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    -- Otra solicitud con el mismo request id ganó la carrera: se devuelve su orden.
    select o.id, o.event_id, o.subtotal_cents, o.fee_cents, o.total_cents
      into v_existing
      from public.orders o
     where o.checkout_request_id = p_request_id;

    if v_existing.event_id <> v_event_id then
      raise exception 'Esta solicitud ya se usó con otro evento.' using errcode = '22023';
    end if;

    return query
    select v_existing.id, v_existing.subtotal_cents, v_existing.fee_cents, v_existing.total_cents;
    return;
  end if;

  insert into public.order_items (
    order_id, ticket_type_id, unit_price_cents, quantity, line_total_cents
  )
  select
    v_order_id,
    lines.ticket_type_id,
    lines.unit_price_cents,
    lines.quantity,
    lines.line_total_cents
  from jsonb_to_recordset(v_lines) as lines(
    ticket_type_id uuid,
    unit_price_cents integer,
    quantity integer,
    line_total_cents integer
  );

  return query
  select v_order_id, v_subtotal_cents, v_fee_cents, v_subtotal_cents + v_fee_cents;
end;
$$;

revoke all on function public.create_pending_order(uuid, jsonb, text, text, text, integer, uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid, jsonb, text, text, text, integer, uuid, text, uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- Reclamo de compras de invitado
-- ---------------------------------------------------------------------------

create or replace function public.claim_order(p_order_id uuid, p_checkout_token_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_claimed uuid;
begin
  if v_user_id is null or p_order_id is null or p_checkout_token_hash is null then
    return false;
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_user_id;

  if v_email is null then
    return false;
  end if;

  update public.orders o
     set buyer_user_id = v_user_id
   where o.id = p_order_id
     and o.buyer_user_id is null
     and o.public_token_hash = p_checkout_token_hash
     and lower(o.buyer_email) = v_email
  returning o.id into v_claimed;

  return v_claimed is not null;
end;
$$;

revoke all on function public.claim_order(uuid, text) from public, anon;
grant execute on function public.claim_order(uuid, text) to authenticated;
