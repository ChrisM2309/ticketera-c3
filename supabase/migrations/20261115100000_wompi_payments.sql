-- Wompi El Salvador en sandbox (plan docs/superpowers/plans/2026-11-11-wompi-sandbox.md, v2).
-- El token de checkout se guarda cifrado (AES-256-GCM, clave solo en el servidor) para que el webhook
-- pueda emitir boletos; sigue sin verse en claro en la base. Solo service_role accede a estas columnas.

alter table public.orders
  add column if not exists wompi_link_id bigint,
  add column if not exists wompi_link_url text
    check (wompi_link_url is null or char_length(wompi_link_url) <= 500),
  add column if not exists checkout_token_encrypted text
    check (checkout_token_encrypted is null or char_length(checkout_token_encrypted) <= 512);

alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments
  add constraint payments_provider_check check (provider in ('demo', 'wompi'));

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('demo_initiated', 'demo_approved', 'demo_rejected', 'wompi_approved'));

alter table public.payments
  add column if not exists provider_transaction_id text
    check (provider_transaction_id is null or char_length(provider_transaction_id) between 1 and 100);

create unique index if not exists payments_provider_transaction_key
  on public.payments (provider_transaction_id)
  where provider_transaction_id is not null;

-- Registro de webhooks recibidos: deduplica (transacción + resultado) y deja rastro sin datos del comprador.
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'wompi'),
  transaction_id text not null check (char_length(transaction_id) between 1 and 100),
  result_code text not null check (char_length(result_code) between 1 and 100),
  order_id uuid references public.orders (id) on delete set null,
  received_at timestamptz not null default now(),
  unique (provider, transaction_id, result_code)
);

alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from public, anon, authenticated;
grant select, insert, update on public.payment_webhook_events to service_role;

create policy payment_webhook_events_service_role_all on public.payment_webhook_events
  for all to service_role
  using (true)
  with check (true);

-- confirm_order: mismo bloqueo, inventario e idempotencia; se añade el resultado wompi_approved.
-- La clave de idempotencia de Wompi es 'wompi:' más el id de transacción: un webhook repetido no emite dos veces.
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
  if p_payment_outcome not in ('free', 'demo_approved', 'demo_rejected', 'wompi_approved') then
    raise exception 'El resultado del pago no es válido.' using errcode = '22023';
  end if;

  if p_public_token_hash is null or p_public_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'El token de checkout no es válido.' using errcode = '22023';
  end if;

  select o.id, o.event_id, o.status, o.total_cents
    into v_order
    from public.orders o
   where o.id = p_order_id
     and o.public_token_hash = p_public_token_hash
   for update;

  if not found then
    raise exception 'La orden no existe o el token no coincide.' using errcode = '22023';
  end if;

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

  if p_payment_outcome = 'wompi_approved' and left(p_idempotency_key, 6) <> 'wompi:' then
    raise exception 'La clave de pago de Wompi no es válida.' using errcode = '22023';
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

  if p_payment_outcome = 'wompi_approved' then
    insert into public.payments (order_id, provider, status, amount_cents, idempotency_key, provider_transaction_id)
    values (p_order_id, 'wompi', 'wompi_approved', v_order.total_cents, p_idempotency_key, substr(p_idempotency_key, 7));
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
