# Editorial Blog Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enriquecer cinco artículos DEMO con palabras clave visibles, portadas locales, autores y contenido SEO más completo, y corregir el renderizado de enlaces internos.

**Architecture:** Una migración idempotente amplía `public.blog_posts` con `cover_image_path` y `author_name`, conservando `author_id` para cuentas reales. Las consultas tipadas llevan esos metadatos al listado y a la ficha; el parser Markdown acepta rutas internas seguras y la vista los presenta con portada, keyword, byline y JSON-LD.

**Tech Stack:** Next.js 16 App Router, TypeScript estricto, Tailwind CSS, Supabase/PostgreSQL, Vitest y fotografías locales ya acreditadas.

**Spec:** `docs/superpowers/specs/2026-11-11-editorial-blog-enrichment-design.md`

## Global Constraints

- Idioma español; contenido marcado como DEMO y sin afiliaciones inventadas.
- No borrar artículos, seed, ilustraciones ni fotografías existentes.
- Las imágenes nuevas o reutilizadas deben ser locales y usar rutas permitidas por `publicImagePath`.
- El Markdown no permite HTML arbitrario, `javascript:`, `http://` ni URLs protocol-relative.
- Las migraciones deben ser idempotentes y solo modificar los cinco slugs editoriales del alcance.

## Review Focus

- Enlace interno `/charlas/`: se renderiza como `<a>` y no como texto crudo; test de parser.
- URL insegura `//otro.com` o `javascript:`: permanece texto; test de seguridad Markdown.
- Portada nula/inválida: la página no falla; prueba de consulta/render y validación local.
- Autor o keyword existentes: aparecen en consulta y página; test de mapping/JSON-LD.
- Reejecución de migración: conserva exactamente cinco artículos DEMO y no duplica entradas; test DB de idempotencia.

---

### Task 1: Markdown interno seguro

**Files:**
- Modify: `tests/unit/markdown.test.ts`
- Modify: `src/lib/content/markdown.ts`

**Interfaces:**
- Produces `parseMarkdown()` blocks where safe internal links have `{ t: 'link', href, v }`.

- [ ] Escribir test RED para `[/charlas/]`, `/workshops/` y rechazo de `//otro.com`/`javascript:`.
- [ ] Ejecutar `npm.cmd exec -- vitest run tests/unit/markdown.test.ts` y observar el fallo por rutas internas tratadas como texto.
- [ ] Extender el patrón y la extracción de enlaces para aceptar solo `https://` o rutas internas con un único `/` y segmentos seguros.
- [ ] Ejecutar el test focalizado y confirmar GREEN.

### Task 2: Modelo, consultas y UI editorial

**Files:**
- Modify: `tests/unit/content-queries.test.ts`
- Modify: `tests/unit/seo-jsonld.test.ts`
- Modify: `src/features/content/queries.ts`
- Modify: `src/components/content/post-card.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`
- Modify: `src/lib/seo/jsonld.ts`

**Interfaces:**
- `BlogPostSummary` and `PublishedPost` expose `keyword`, `authorName` and `coverImagePath`.
- `articleJsonLd()` accepts optional author/image metadata.

- [ ] Escribir tests RED para mapping metadata/JSON-LD.
- [ ] Ejecutar tests focalizados y observar los campos ausentes.
- [ ] Añadir columnas a las consultas, usar `publicImagePath()` para validar portadas, renderizar imagen en cards/ficha, y mostrar keyword/byline/fecha.
- [ ] Añadir autor e imagen opcionales al JSON-LD.
- [ ] Ejecutar tests focalizados y confirmar GREEN.

### Task 3: Migración y cinco artículos

**Files:**
- Create: `supabase/migrations/20261119100000_editorial_blog_enrichment.sql`
- Modify: `tests/db/schema.test.ts`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/README.md`

**Interfaces:**
- Migration adds nullable `cover_image_path` and `author_name`, then upserts five published articles.

- [ ] Ampliar primero el test DB para exigir cinco slugs, cinco autores, cinco portadas locales, cuerpos largos y keyword no nula.
- [ ] Ejecutar `npm.cmd exec -- vitest run tests/db/schema.test.ts` y observar el fallo esperado de columnas/conteo.
- [ ] Crear la migración idempotente con los cinco cuerpos SEO, autores y rutas locales existentes.
- [ ] Ejecutar el test DB focalizado y confirmar GREEN, incluida reejecución de migración/seed.
- [ ] Registrar D-71 y enlazar spec/plan en `docs/README.md`.

### Task 4: Verificación y entrega

**Files:**
- Modify: `.superpowers/sdd/2026-11-11-editorial-blog-enrichment-plan/progress.md`
- Modify: `docs/superpowers/plans/implementation-backlog.md`

- [ ] Ejecutar `npm.cmd exec -- vitest run tests/unit/markdown.test.ts tests/unit/content-queries.test.ts tests/unit/seo-jsonld.test.ts tests/db/schema.test.ts`.
- [ ] Ejecutar `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build` y la suite completa `npm.cmd test -- --run`.
- [ ] Revisar `git diff --check`, imágenes existentes, SQL sin operaciones destructivas y árbol limpio.
- [ ] Actualizar backlog/ledger, commit y push de la rama existente para actualizar el PR #46; no aplicar esta nueva migración a producción sin una solicitud explícita.
