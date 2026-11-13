-- Solicitudes de correo DEMO. Solo service_role puede leer datos personales.
create table public.cart_email_reminders (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 5 and 254),
  event_id uuid not null references public.events(id) on delete cascade,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  token_hash text not null unique check (char_length(token_hash) = 64),
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index cart_email_reminders_due_idx on public.cart_email_reminders(updated_at) where status='pending';
alter table public.cart_email_reminders enable row level security;
revoke all on public.cart_email_reminders from public, anon, authenticated;
grant all on public.cart_email_reminders to service_role;
create policy cart_email_reminders_service on public.cart_email_reminders for all to service_role using (true) with check (true);

create table public.weekly_event_email_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  status text not null check (status in ('pending','sent','failed')),
  created_at timestamptz not null default now(),
  primary key(user_id, week_start)
);
alter table public.weekly_event_email_deliveries enable row level security;
revoke all on public.weekly_event_email_deliveries from public, anon, authenticated;
grant all on public.weekly_event_email_deliveries to service_role;
create policy weekly_event_email_deliveries_service on public.weekly_event_email_deliveries for all to service_role using (true) with check (true);
