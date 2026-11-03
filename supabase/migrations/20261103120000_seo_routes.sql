-- Árbol SEO del Excel "Avance 2 - proyecto mercadeo.xlsx" (pestaña ARQUITECTURA).
-- Registra qué rutas existen, su palabra clave principal y el volumen aportado por el equipo.
-- Las rutas de organizador (/claude/, /copa/) no se registran (D-18).
-- Profundidad: 1 = tipo, tema o ciudad; 2 = tipo + tema; 3 = tipo + tema + modalidad o precio.
-- Ver docs/architecture/SEO_ROUTES.md (secciones 1 a 3) y docs/DECISIONS.md (D-24).

create table public.seo_routes (
  path text primary key,
  kind text not null check (kind in ('event_type', 'topic', 'location', 'subtopic', 'modality')),
  keyword text check (char_length(keyword) <= 120),
  search_volume integer check (search_volume is null or search_volume >= 0),
  is_indexable boolean not null default true,
  sort_order integer not null,
  constraint seo_routes_path_format_check check (path ~ '^(/[a-z0-9]+(-[a-z0-9]+)*){1,3}/$'),
  constraint seo_routes_depth_check check (
    (kind in ('event_type', 'topic', 'location')
      and array_length(string_to_array(trim(both '/' from path), '/'), 1) = 1)
    or (kind = 'subtopic'
      and array_length(string_to_array(trim(both '/' from path), '/'), 1) = 2)
    or (kind = 'modality'
      and array_length(string_to_array(trim(both '/' from path), '/'), 1) = 3)
  ),
  constraint seo_routes_modality_check check (
    kind <> 'modality'
    or split_part(trim(both '/' from path), '/', 3) in ('virtual', 'presencial', 'gratis')
  )
);

grant select on public.seo_routes to anon, authenticated;
grant insert, update, delete on public.seo_routes to authenticated;

alter table public.seo_routes enable row level security;

-- Lectura pública del árbol; escritura solo para administradores (igual que categories).
create policy seo_routes_public_read on public.seo_routes
  for select to anon, authenticated
  using (true);

create policy seo_routes_admin_write on public.seo_routes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
