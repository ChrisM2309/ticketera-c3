-- Fase 5 (CT-02): contenido editorial y escritura administrativa.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug <> 'nuevo'),
  title text not null check (char_length(title) between 5 and 70),
  description text not null check (char_length(description) between 50 and 160),
  body_md text not null check (char_length(body_md) <= 20000),
  keyword text,
  topic text not null check (topic in ('eventos', 'cultura', 'fechas-mixtas')),
  related_type_slugs text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint blog_posts_published_requirements check (status = 'draft' or (keyword is not null and char_length(body_md) >= 200 and published_at is not null))
);

create table public.editorial_pages (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references public.categories (id) on delete cascade,
  intro_md text not null check (char_length(intro_md) <= 4000),
  faq jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;
alter table public.editorial_pages enable row level security;
revoke all on public.blog_posts, public.editorial_pages from anon, authenticated;
grant select on public.blog_posts, public.editorial_pages to anon, authenticated;

create policy blog_posts_public_read on public.blog_posts for select to anon, authenticated using (status = 'published');
create policy editorial_pages_public_read on public.editorial_pages for select to anon, authenticated using (status = 'published');

create or replace function public.admin_save_blog_post(
  p_id uuid, p_slug text, p_title text, p_description text, p_body_md text,
  p_keyword text, p_topic text, p_related_type_slugs text[], p_status text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_published_at timestamptz;
begin
  if not public.is_admin() then raise exception 'Solo el administrador puede guardar contenido.' using errcode = '42501'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or p_slug = 'nuevo' then raise exception 'El slug no es válido.' using errcode = '22023'; end if;
  if p_title is null or char_length(p_title) not between 5 and 70 then raise exception 'El título debe tener entre 5 y 70 caracteres.' using errcode = '22023'; end if;
  if p_description is null or char_length(p_description) not between 50 and 160 then raise exception 'La descripción debe tener entre 50 y 160 caracteres.' using errcode = '22023'; end if;
  if p_body_md is null or char_length(p_body_md) > 20000 then raise exception 'El cuerpo supera el límite permitido.' using errcode = '22023'; end if;
  if p_topic not in ('eventos', 'cultura', 'fechas-mixtas') then raise exception 'El tema no es válido.' using errcode = '22023'; end if;
  if p_status not in ('draft', 'published') then raise exception 'El estado no es válido.' using errcode = '22023'; end if;
  if p_status = 'published' and (p_keyword is null or char_length(p_body_md) < 200) then raise exception 'Publicar exige palabra clave y al menos 200 caracteres.' using errcode = '22023'; end if;
  if exists (select 1 from unnest(coalesce(p_related_type_slugs, '{}')) as related_slug(value) where not exists (select 1 from public.categories c where c.kind = 'event_type' and c.slug = related_slug.value)) then
    raise exception 'Hay un tipo relacionado inexistente.' using errcode = '22023';
  end if;
  select published_at into v_published_at from public.blog_posts where id = v_id;
  if p_status = 'published' and v_published_at is null then v_published_at := now(); end if;
  insert into public.blog_posts (id, slug, title, description, body_md, keyword, topic, related_type_slugs, status, published_at, author_id, updated_at)
  values (v_id, p_slug, p_title, p_description, p_body_md, nullif(p_keyword, ''), p_topic, coalesce(p_related_type_slugs, '{}'), p_status, v_published_at, auth.uid(), now())
  on conflict (id) do update set slug = excluded.slug, title = excluded.title, description = excluded.description, body_md = excluded.body_md, keyword = excluded.keyword, topic = excluded.topic, related_type_slugs = excluded.related_type_slugs, status = excluded.status, published_at = excluded.published_at, author_id = excluded.author_id, updated_at = excluded.updated_at;
  return v_id;
end;
$$;

create or replace function public.admin_save_editorial_page(p_category_id uuid, p_intro_md text, p_faq jsonb, p_status text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_item jsonb;
begin
  if not public.is_admin() then raise exception 'Solo el administrador puede guardar contenido.' using errcode = '42501'; end if;
  if not exists (select 1 from public.categories where id = p_category_id) then raise exception 'La categoría no existe.' using errcode = '22023'; end if;
  if p_intro_md is null or char_length(p_intro_md) > 4000 then raise exception 'La introducción supera el límite permitido.' using errcode = '22023'; end if;
  if p_status not in ('draft', 'published') then raise exception 'El estado no es válido.' using errcode = '22023'; end if;
  if jsonb_typeof(p_faq) <> 'array' or jsonb_array_length(p_faq) > 8 then raise exception 'La FAQ debe tener como máximo 8 preguntas.' using errcode = '22023'; end if;
  for v_item in select value from jsonb_array_elements(p_faq) loop
    if jsonb_typeof(v_item) <> 'object' or jsonb_typeof(v_item->'q') <> 'string' or jsonb_typeof(v_item->'a') <> 'string' or char_length(v_item->>'q') not between 5 and 200 or char_length(v_item->>'a') not between 10 and 600 then raise exception 'Cada pregunta de FAQ no cumple los límites.' using errcode = '22023'; end if;
  end loop;
  insert into public.editorial_pages (category_id, intro_md, faq, status, updated_by, updated_at) values (p_category_id, p_intro_md, p_faq, p_status, auth.uid(), now())
  on conflict (category_id) do update set intro_md = excluded.intro_md, faq = excluded.faq, status = excluded.status, updated_by = excluded.updated_by, updated_at = excluded.updated_at
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_delete_blog_post(p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Solo el administrador puede borrar contenido.' using errcode = '42501'; end if;
  delete from public.blog_posts where id = p_id;
end;
$$;

revoke all on function public.admin_save_blog_post(uuid, text, text, text, text, text, text, text[], text), public.admin_save_editorial_page(uuid, text, jsonb, text), public.admin_delete_blog_post(uuid) from public, anon;
grant execute on function public.admin_save_blog_post(uuid, text, text, text, text, text, text, text[], text), public.admin_save_editorial_page(uuid, text, jsonb, text), public.admin_delete_blog_post(uuid) to authenticated;
