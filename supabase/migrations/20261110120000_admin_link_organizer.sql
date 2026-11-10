-- Fase 3 (CP-09): alta de organizadores por el administrador.
-- La administración vincula una cuenta existente (por correo) con una organización nueva. La cuenta pasa
-- de comprador a organizador en la misma transacción; un administrador nunca baja de rol. Todo ocurre en
-- una función SECURITY DEFINER que repite la comprobación de rol con is_admin(): el correo vive en
-- auth.users, que ningún cliente puede leer, y el rol nunca viene del navegador ni de user_metadata.

-- ---------------------------------------------------------------------------
-- Vincular un organizador (solo administrador)
-- ---------------------------------------------------------------------------

create or replace function public.admin_link_organizer(
  p_name text,
  p_slug text,
  p_description text,
  p_owner_email text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := btrim(p_name);
  v_slug text := btrim(p_slug);
  v_description text := nullif(btrim(p_description), '');
  v_email text := lower(btrim(p_owner_email));
  v_owner_id uuid;
  v_organizer_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede vincular organizadores.' using errcode = '42501';
  end if;

  if v_name is null or char_length(v_name) not between 3 and 120 then
    raise exception 'El nombre debe tener entre 3 y 120 caracteres.' using errcode = '22023';
  end if;

  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 80 then
    raise exception 'El identificador de la URL no es válido.' using errcode = '22023';
  end if;

  if v_description is not null and char_length(v_description) > 500 then
    raise exception 'La descripción no puede pasar de 500 caracteres.' using errcode = '22023';
  end if;

  if v_email is null or v_email = '' then
    raise exception 'No existe una cuenta con ese correo.' using errcode = '22023';
  end if;

  select u.id
    into v_owner_id
    from auth.users u
   where lower(u.email) = v_email
   limit 1;

  if v_owner_id is null then
    raise exception 'No existe una cuenta con ese correo.' using errcode = '22023';
  end if;

  if exists (select 1 from public.organizers o where o.slug = v_slug) then
    raise exception 'Ese identificador de URL ya está en uso.' using errcode = '23505';
  end if;

  insert into public.organizers (name, slug, description, owner_user_id)
  values (v_name, v_slug, v_description, v_owner_id)
  returning id into v_organizer_id;

  -- Solo sube de comprador a organizador; un organizador o un administrador conserva su rol.
  update public.profiles
     set role = 'organizer'
   where id = v_owner_id
     and role = 'buyer';

  return v_organizer_id;
end;
$$;

revoke all on function public.admin_link_organizer(text, text, text, text) from public, anon;
grant execute on function public.admin_link_organizer(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Lista de organizadores con el correo del dueño (solo administrador)
-- ---------------------------------------------------------------------------
-- El correo sale de auth.users; la página lo enmascara antes de mostrarlo.

create or replace function public.admin_list_organizers()
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  owner_email text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede ver los organizadores.' using errcode = '42501';
  end if;

  return query
    select o.id, o.name, o.slug, o.status, u.email::text, o.created_at
      from public.organizers o
      left join auth.users u on u.id = o.owner_user_id
     order by o.created_at desc, o.name;
end;
$$;

revoke all on function public.admin_list_organizers() from public, anon;
grant execute on function public.admin_list_organizers() to authenticated;
