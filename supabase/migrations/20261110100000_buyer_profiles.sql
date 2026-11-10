-- Fase 3 (CP-02, CP-07): cuentas de comprador.
-- Todo usuario nuevo de Auth recibe un perfil `buyer`; el rol nunca viene del navegador ni de
-- user_metadata. Se guardan solo datos personales mínimos (nombre, universidad opcional y
-- consentimiento de correo desactivado por defecto) y cada comprador puede leer sus propias órdenes.

-- ---------------------------------------------------------------------------
-- Perfiles: rol buyer, universidad y consentimiento
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('buyer', 'organizer', 'admin'));
alter table public.profiles alter column role set default 'buyer';

alter table public.profiles
  add column university text,
  add column marketing_opt_in boolean not null default false,
  add column consented_at timestamptz,
  add constraint profiles_university_check check (university is null or char_length(university) <= 80);

-- consented_at lo fija el servidor: el cliente solo cambia marketing_opt_in.
create or replace function public.set_profile_consented_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.marketing_opt_in and not old.marketing_opt_in then
    new.consented_at := now();
  elsif not new.marketing_opt_in then
    new.consented_at := null;
  end if;
  return new;
end;
$$;

create trigger profiles_set_consented_at
  before update on public.profiles
  for each row execute function public.set_profile_consented_at();

-- El usuario edita solo su fila y solo estas columnas; `role` y `consented_at` quedan fuera.
grant update (display_name, university, marketing_opt_in) on public.profiles to authenticated;

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Alta automática del perfil buyer (no lee metadatos)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'buyer',
    nullif(left(split_part(coalesce(new.email, ''), '@', 1), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cuentas ya existentes sin perfil pasan a ser compradores.
insert into public.profiles (id, role, display_name)
select u.id, 'buyer', nullif(left(split_part(coalesce(u.email, ''), '@', 1), 120), '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------------
-- Órdenes del comprador
-- ---------------------------------------------------------------------------

alter table public.orders
  add column buyer_user_id uuid references auth.users (id) on delete set null;

create index orders_buyer_user_idx on public.orders (buyer_user_id) where buyer_user_id is not null;

create or replace function public.my_orders()
returns table (
  order_id uuid,
  status text,
  total_cents integer,
  created_at timestamptz,
  checkout_request_id uuid,
  event_id uuid,
  event_title text,
  event_starts_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.id, o.status, o.total_cents, o.created_at, o.checkout_request_id,
         e.id, e.title, e.starts_at
  from public.orders o
  join public.events e on e.id = o.event_id
  where o.buyer_user_id = auth.uid()
  order by o.created_at desc;
$$;

revoke all on function public.my_orders() from public, anon;
grant execute on function public.my_orders() to authenticated;
