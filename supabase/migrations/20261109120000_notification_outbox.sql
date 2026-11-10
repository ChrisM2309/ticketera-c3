-- CO-04: outbox de notificaciones simuladas. No se envía nada real: cada fila registra qué boleto
-- "se envió" por correo o WhatsApp y a qué destino enmascarado. Nunca guarda el correo ni el teléfono
-- completos. Solo service_role lee y escribe; el navegador no tiene acceso.

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  template text not null check (template in ('ticket', 'reminder_24h')),
  destination_masked text not null,
  status text not null default 'simulated' check (status in ('simulated', 'cancelled')),
  scheduled_for timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (order_id, channel, template)
);

alter table public.notification_outbox enable row level security;

revoke all on public.notification_outbox from public, anon, authenticated;
grant select, insert, update on public.notification_outbox to service_role;

-- Supabase ya exime a service_role de RLS; la política lo deja explícito y mantiene el acceso
-- idéntico en entornos donde ese rol no omite RLS.
create policy notification_outbox_service_role_all on public.notification_outbox
  for all to service_role
  using (true)
  with check (true);
