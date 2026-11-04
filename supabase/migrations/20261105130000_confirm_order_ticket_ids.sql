-- T12: el servidor genera el id de cada boleto y su hash de QR; la RPC solo los inserta.
-- Así el QR se puede volver a derivar desde el token de checkout y el id del boleto (D-29).
-- Sustituye la firma de T10, que recibía solo hashes de QR sin id.

drop function if exists public.confirm_order(uuid, text, text, text, jsonb);

create or replace function public.confirm_order(
  p_order_id uuid,
  p_public_token_hash text,
  p_payment_outcome text,
  p_idempotency_key text,
  p_tickets jsonb
)
returns table (
  result_order_id uuid,
  result_status text,
  result_ticket_count integer,
  result_already_processed boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_line record;
  v_ticket record;
  v_expected_tickets integer;
begin
  if p_payment_outcome not in ('free', 'demo_approved', 'demo_rejected') then
    raise exception 'El resultado del pago no es válido.' using errcode = '22023';
  end if;

  if p_public_token_hash is null or p_public_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'El token de checkout no es válido.' using errcode = '22023';
  end if;

  -- Bloqueo de la orden: dos confirmaciones del mismo pedido se procesan en serie.
  -- Orden inexistente y token incorrecto devuelven el mismo error para no enumerar órdenes.
  select o.id, o.event_id, o.status, o.total_cents
    into v_order
    from public.orders o
   where o.id = p_order_id
     and o.public_token_hash = p_public_token_hash
   for update;

  if not found then
    raise exception 'La orden no existe o el token no coincide.' using errcode = '22023';
  end if;

  -- Reintento o doble clic: la orden ya fue procesada; no se toca inventario ni boletos.
  if v_order.status <> 'pending' then
    return query
    select o.id, o.status,
           (select count(*)::integer from public.tickets t where t.order_id = o.id),
           true
      from public.orders o
     where o.id = p_order_id;
    return;
  end if;

  if p_payment_outcome = 'free' and v_order.total_cents <> 0 then
    raise exception 'Esta orden tiene importe y requiere pago.' using errcode = '22023';
  end if;

  if p_payment_outcome <> 'free' and v_order.total_cents = 0 then
    raise exception 'Esta orden es gratuita y no requiere pago.' using errcode = '22023';
  end if;

  if p_payment_outcome <> 'free'
     and (p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 128) then
    raise exception 'La clave de pago no es válida.' using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.events e
     where e.id = v_order.event_id
       and e.status = 'published'
       and coalesce(e.ends_at, e.starts_at) >= now()
  ) then
    raise exception 'Este evento ya no está disponible para confirmar la compra.' using errcode = '22023';
  end if;

  -- Pago DEMO rechazado: la orden queda fallida, sin boletos y sin tocar inventario.
  if p_payment_outcome = 'demo_rejected' then
    insert into public.payments (order_id, status, amount_cents, idempotency_key)
    values (p_order_id, 'demo_rejected', v_order.total_cents, p_idempotency_key);

    update public.orders o
       set status = 'failed'
     where o.id = p_order_id;

    return query select p_order_id, 'failed'::text, 0, false;
    return;
  end if;

  select coalesce(sum(oi.quantity), 0)::integer
    into v_expected_tickets
    from public.order_items oi
   where oi.order_id = p_order_id;

  if jsonb_typeof(p_tickets) <> 'array'
     or jsonb_array_length(p_tickets) <> v_expected_tickets then
    raise exception 'La cantidad de boletos no coincide con la orden.' using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_tickets) as received(elem)
     where jsonb_typeof(received.elem) <> 'object'
        or (received.elem ->> 'ticketId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or (received.elem ->> 'qrTokenHash') !~ '^[0-9a-f]{64}$'
  ) then
    raise exception 'El código QR de un boleto no es válido.' using errcode = '22023';
  end if;

  if (select count(distinct received.elem ->> 'ticketId') from jsonb_array_elements(p_tickets) as received(elem))
     <> v_expected_tickets then
    raise exception 'Los boletos recibidos no son distintos.' using errcode = '22023';
  end if;

  -- Inventario: bloqueo de cada tipo en orden de id para evitar interbloqueos.
  for v_line in
    select oi.ticket_type_id, oi.quantity
      from public.order_items oi
     where oi.order_id = p_order_id
     order by oi.ticket_type_id
  loop
    select t.id, t.event_id, t.quantity_total, t.quantity_sold, t.max_per_order, t.is_active
      into v_ticket
      from public.ticket_types t
     where t.id = v_line.ticket_type_id
       for update;

    if not found or v_ticket.event_id <> v_order.event_id or not v_ticket.is_active then
      raise exception 'Esta entrada ya no está disponible.' using errcode = '22023';
    end if;

    if v_line.quantity > v_ticket.max_per_order then
      raise exception 'La cantidad supera el máximo permitido por orden.' using errcode = '22023';
    end if;

    if v_line.quantity > v_ticket.quantity_total - v_ticket.quantity_sold then
      raise exception 'La cantidad supera los cupos disponibles.' using errcode = '22023';
    end if;

    update public.ticket_types t
       set quantity_sold = t.quantity_sold + v_line.quantity
     where t.id = v_line.ticket_type_id;
  end loop;

  -- Un boleto por unidad comprada. La posición de cada unidad decide qué elemento de p_tickets recibe.
  insert into public.tickets (id, order_id, order_item_id, ticket_type_id, qr_token_hash)
  select (received.elem ->> 'ticketId')::uuid,
         p_order_id,
         units.order_item_id,
         units.ticket_type_id,
         received.elem ->> 'qrTokenHash'
    from (
      select oi.id as order_item_id,
             oi.ticket_type_id,
             row_number() over (order by oi.ticket_type_id, oi.id, expanded.n) as pos
        from public.order_items oi
        cross join lateral generate_series(1, oi.quantity) as expanded(n)
       where oi.order_id = p_order_id
    ) units
    join jsonb_array_elements(p_tickets) with ordinality as received(elem, pos)
      on received.pos = units.pos;

  if p_payment_outcome = 'demo_approved' then
    insert into public.payments (order_id, status, amount_cents, idempotency_key)
    values (p_order_id, 'demo_approved', v_order.total_cents, p_idempotency_key);
  end if;

  update public.orders o
     set status = 'confirmed',
         confirmed_at = now()
   where o.id = p_order_id;

  return query select p_order_id, 'confirmed'::text, v_expected_tickets, false;
end;
$$;

revoke all on function public.confirm_order(uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_order(uuid, text, text, text, jsonb) to service_role;
