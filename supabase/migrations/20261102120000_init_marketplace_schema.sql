-- Esquema base de Ticketera C3 (T03).
-- Montos en centavos USD (enteros). No se guardan datos de tarjetas en ninguna tabla.
-- Taxonomía en `categories` con `kind` (event_type, topic, location, organizer).
-- Ver docs/architecture/DATA.md y docs/DECISIONS.md (D-15).

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'organizer' check (role in ('organizer', 'admin')),
  display_name text check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event_type', 'topic', 'location', 'organizer')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  keyword text check (char_length(keyword) <= 120),
  search_volume integer check (search_volume is null or search_volume >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, slug),
  -- Objetivo de las FKs compuestas de events: impide asignar un tipo donde va una ciudad.
  unique (id, kind)
);

create table public.organizers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 2000),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers (id) on delete restrict,
  event_type_kind text not null default 'event_type' check (event_type_kind = 'event_type'),
  event_type_id uuid not null,
  topic_kind text not null default 'topic' check (topic_kind = 'topic'),
  topic_id uuid,
  location_kind text not null default 'location' check (location_kind = 'location'),
  location_id uuid,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('virtual', 'presencial', 'gratis')),
  title text not null check (char_length(title) between 3 and 160),
  description text not null check (char_length(description) <= 4000),
  agenda text check (char_length(agenda) <= 4000),
  mode text not null check (mode in ('presencial', 'virtual')),
  venue text check (char_length(venue) <= 200),
  image_path text check (char_length(image_path) <= 300),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'archived', 'rejected')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_event_type_fk foreign key (event_type_id, event_type_kind)
    references public.categories (id, kind),
  constraint events_topic_fk foreign key (topic_id, topic_kind)
    references public.categories (id, kind),
  constraint events_location_fk foreign key (location_id, location_kind)
    references public.categories (id, kind),
  constraint events_dates_check check (ends_at is null or ends_at > starts_at),
  -- Presencial exige ciudad; virtual no la tiene.
  constraint events_location_by_mode_check check ((mode = 'presencial') = (location_id is not null)),
  constraint events_venue_by_mode_check check (mode = 'presencial' or venue is null)
);

create index events_catalog_idx on public.events (status, starts_at);
create index events_organizer_idx on public.events (organizer_id);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  price_cents integer not null check (price_cents >= 0),
  quantity_total integer not null check (quantity_total >= 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  max_per_order integer not null default 10 check (max_per_order between 1 and 10),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, name),
  constraint ticket_types_sold_within_total check (quantity_sold <= quantity_total)
);

create index ticket_types_event_idx on public.ticket_types (event_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Hash del token secreto de confirmación; el token en claro nunca se guarda.
  public_token_hash text not null unique check (char_length(public_token_hash) = 64),
  event_id uuid not null references public.events (id) on delete restrict,
  buyer_name text not null check (char_length(buyer_name) between 2 and 120),
  buyer_email text not null
    check (char_length(buyer_email) between 5 and 254 and buyer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'cancelled')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  fee_cents integer not null default 0 check (fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint orders_total_check check (total_cents = subtotal_cents + fee_cents),
  constraint orders_confirmed_at_check check ((status = 'confirmed') = (confirmed_at is not null))
);

create index orders_event_idx on public.orders (event_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete restrict,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_cents integer not null check (line_total_cents >= 0),
  unique (order_id, ticket_type_id),
  constraint order_items_line_total_check check (line_total_cents = unit_price_cents * quantity)
);

create index order_items_ticket_type_idx on public.order_items (ticket_type_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'demo' check (provider = 'demo'),
  status text not null check (status in ('demo_initiated', 'demo_approved', 'demo_rejected')),
  amount_cents integer not null check (amount_cents >= 0),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 128),
  created_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete restrict,
  -- Hash del token del QR; el valor aleatorio solo viaja al comprador.
  qr_token_hash text not null unique check (char_length(qr_token_hash) = 64),
  issued_at timestamptz not null default now(),
  checked_in_at timestamptz
);

create index tickets_order_idx on public.tickets (order_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (security definer, search_path vacío)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.owns_organizer(target_organizer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizers o
    where o.id = target_organizer_id and o.owner_user_id = auth.uid()
  );
$$;

create or replace function public.owns_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.organizers o on o.id = e.organizer_id
    where e.id = target_event_id and o.owner_user_id = auth.uid()
  );
$$;

revoke execute on function public.is_admin(), public.owns_organizer(uuid), public.owns_event(uuid)
  from public, anon;
grant execute on function public.is_admin(), public.owns_organizer(uuid), public.owns_event(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos base: se parte de cero y luego se concede lo mínimo necesario.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.categories, public.organizers, public.events,
  public.ticket_types, public.orders, public.order_items, public.payments, public.tickets
  from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Catálogo público: RLS limita las filas (solo eventos publicados, etc.).
grant select on public.categories, public.events, public.ticket_types to anon, authenticated;
-- Organizadores: anon no ve owner_user_id.
grant select (id, name, slug, description, status, created_at) on public.organizers to anon;
grant select on public.organizers to authenticated;

-- Escritura solo para usuarios autenticados y siempre filtrada por RLS.
grant insert, update, delete on public.categories, public.organizers, public.events,
  public.ticket_types to authenticated;

-- Órdenes, pagos y boletos: sin acceso público; el administrador solo lee por RLS.
grant select on public.profiles, public.orders, public.order_items, public.payments,
  public.tickets to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.organizers enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.tickets enable row level security;

-- profiles: cada usuario ve su perfil; solo el servidor cambia roles.
create policy profiles_read_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- categories: lectura pública; escritura solo administrador.
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (true);

create policy categories_admin_write on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- organizers: públicos solo los activos; el propietario ve el suyo; admin gestiona.
create policy organizers_public_read on public.organizers
  for select to anon, authenticated
  using (status = 'active');

create policy organizers_owner_read on public.organizers
  for select to authenticated
  using (owner_user_id = auth.uid());

create policy organizers_admin_all on public.organizers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- events: el público solo ve published; el propietario ve y edita los suyos hasta publicación.
create policy events_public_read on public.events
  for select to anon, authenticated
  using (status = 'published');

create policy events_owner_read on public.events
  for select to authenticated
  using (public.owns_organizer(organizer_id));

create policy events_owner_insert on public.events
  for insert to authenticated
  with check (public.owns_organizer(organizer_id) and status in ('draft', 'pending'));

create policy events_owner_update on public.events
  for update to authenticated
  using (public.owns_organizer(organizer_id) and status in ('draft', 'pending', 'rejected'))
  with check (public.owns_organizer(organizer_id) and status in ('draft', 'pending'));

create policy events_owner_delete on public.events
  for delete to authenticated
  using (public.owns_organizer(organizer_id) and status = 'draft');

create policy events_admin_all on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ticket_types: visibles solo si el evento está publicado y el tipo activo.
create policy ticket_types_public_read on public.ticket_types
  for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id and e.status = 'published'
    )
  );

create policy ticket_types_owner_read on public.ticket_types
  for select to authenticated
  using (public.owns_event(event_id));

create policy ticket_types_owner_write on public.ticket_types
  for all to authenticated
  using (
    public.owns_event(event_id)
    and exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id and e.status in ('draft', 'pending', 'rejected')
    )
  )
  with check (
    public.owns_event(event_id)
    and exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id and e.status in ('draft', 'pending')
    )
  );

create policy ticket_types_admin_all on public.ticket_types
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- orders, order_items, payments, tickets: solo administrador lee; las escrituras
-- llegarán por funciones transaccionales (T09/T10), nunca desde el navegador.
create policy orders_admin_read on public.orders
  for select to authenticated
  using (public.is_admin());

create policy order_items_admin_read on public.order_items
  for select to authenticated
  using (public.is_admin());

create policy payments_admin_read on public.payments
  for select to authenticated
  using (public.is_admin());

create policy tickets_admin_read on public.tickets
  for select to authenticated
  using (public.is_admin());
