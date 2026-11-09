# Fase 5 — Contenido, SEO, indexación y analítica — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el sitio listo para indexar y activarlo con un botón de administración; metadatos y datos estructurados completos; editor de contenido para administradores con blog y textos por categoría; página de la Copa; consentimiento y analítica propia mínima.

**Architecture:** Un interruptor `indexing_enabled` en `site_settings` (Fase 4) gobierna `robots.txt`, `sitemap.xml`, `noindex` por página y JSON-LD (enmienda de D-25, decisión P-4); `NEXT_PUBLIC_IS_DEMO` queda solo para la etiqueta DEMO. El contenido editorial se guarda en tablas escritas por funciones de administrador y se pinta con un subconjunto propio de markdown que produce elementos React (nunca HTML crudo). La analítica es de primera parte (tabla `analytics_events`) y no mide nada hasta que el visitante acepta.

**Tech Stack:** Next.js App Router (`Metadata`, `robots.ts`, `sitemap.ts`, Route Handlers), Postgres (PGlite en pruebas), Vitest, Playwright.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (R-10, R-11; DP-04, DP-05, DP-11, DP-13; SEO-01 a SEO-15, CT-01 a CT-08, LG-02, MK-01, MK-02) · [roadmap](2026-11-09-roadmap-nuevas-areas.md) (P-1, P-3, P-4, P-8)

## Global Constraints

- Leer `node_modules/next/dist/docs/` (metadatos, `robots`, `sitemap`, caché y revalidación, Route Handlers) antes de codificar (AGENTS.md).
- Indexación apagada por defecto: con `indexing_enabled` falso, `robots.txt` es `Disallow: /`, el sitemap queda vacío y todas las páginas llevan `noindex`.
- Los eventos del sitio son DEMO/ficticios (D-25): al activar el interruptor, la interfaz de administración muestra un aviso de confirmación que lo recuerda.
- Sin cifras, testimonios ni afirmaciones inventadas en textos; todo texto de administrador se renderiza como elementos React.
- Dominio final `ticketera.c3.com.sv` (D-42): al activar, `NEXT_PUBLIC_SITE_URL` debe valer `https://ticketera.c3.com.sv`.
- Sin medición ni cookies de analítica antes de aceptar; el banner muestra «Aceptar analítica» y «Solo lo necesario» con el mismo peso visual.
- Migraciones posteriores a `20261111120000`, con pruebas en `tests/db`; no aplicar a producción sin confirmación.
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Interruptor apagado: `robots.txt` bloquea todo, el sitemap está vacío y ninguna página omite `noindex`; encendido: se anuncia el sitemap y las rutas privadas siguen bloqueadas (5.1, 5.3).
2. Un artículo con `<script>`, `<img onerror>` o `[x](javascript:alert(1))` nunca produce marcado ni enlace ejecutable (5.4).
3. Antes de aceptar el banner no sale ninguna petición a `/api/analytics`; tras rechazar tampoco (5.9).
4. Un organizador con slug igual a una ruta reservada (`blog`, `admin`, `panel`, `carrito`, `copa` ya tomado) o a una categoría no resuelve en la raíz (5.7).
5. Un artículo en borrador, un evento no publicado o uno ya pasado jamás aparece en el sitemap ni en `/blog/` (5.3, 5.6).

---

## Parte 5.A — Interruptor, metadatos y sitemap

### Tarea 5.1: Ajustes de administración e interruptor de indexación (SEO-15, SEO-02)

**Files:**
- Create: `src/app/admin/ajustes/page.tsx`, `src/features/settings/actions.ts`, `src/features/settings/form.ts`, `tests/unit/settings-form.test.ts`, `tests/e2e/indexing-switch.spec.ts`
- Modify: `src/lib/seo/indexing.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/site-config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/[...segments]/page.tsx`, `src/features/catalog/event-detail.tsx`, `src/app/admin/page.tsx` (enlace «Ajustes»), `tests/unit/indexing.test.ts`, `tests/unit/site-config.test.ts`, `docs/DECISIONS.md`

**Interfaces:**
- Consumes: `getSiteSettings` y `admin_set_setting` (Fase 4, tarea 4.1).
- Produces en `indexing.ts`:
  - `export function buildRobots(options: { indexingEnabled: boolean; siteUrl: string }): MetadataRoute.Robots` — apagado: `{ rules: { userAgent: '*', disallow: '/' } }`; encendido: `allow: '/'`, `disallow: privatePaths` y `sitemap`.
  - `export function robotsMetadata(options: { indexingEnabled: boolean; pageIndexable: boolean }): { index: boolean; follow: boolean }` — `index` solo si ambos son verdaderos.
- Produces en `form.ts`: `export function parseSettingsForm(formData: FormData): { valid: true; data: { dailyRateCents: number | null; packagePriceCents: number | null; benefits: PackageBenefits } } | { valid: false; errors: Record<string, string> }` — importes en USD con hasta dos decimales ⇒ centavos enteros; vacío ⇒ `null` («por definir»); beneficios enteros ≥ 0 y descuento 0–100.
- `toggleIndexingAction(formData)` exige una casilla «Entiendo que los eventos son de demostración» al **activar**; registra `updated_by`. Tras cualquier cambio de ajustes se llama `revalidatePath` de `/robots.txt`, `/sitemap.xml` y `/` con el método que indique la guía de Next 16.
- Sustituir todo uso de `siteConfig.isDemo` que decide `noindex`, JSON-LD o `robots` por `indexingEnabled` (buscar con `grep -rn "isDemo" src`); `isDemo` queda solo para la etiqueta DEMO. `siteConfig.siteUrl` sigue siendo la base de canónicos.

- [ ] **Step 1: Write the failing tests.** `indexing.test.ts`: `test('apagado bloquea todo y no anuncia sitemap')`, `test('encendido permite todo salvo rutas privadas y anuncia el sitemap')`, `test('robotsMetadata solo indexa con interruptor y página indexable')`. `settings-form.test.ts`: `test('convierte $2.50 a 250 centavos')`, `test('vacío deja la tarifa por definir')`, `test('rechaza descuento mayor a 100')`, `test('rechaza tres decimales')`. E2E: `test('con el interruptor apagado robots.txt dice Disallow: /')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/indexing.test.ts tests/unit/settings-form.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Pantalla `/admin/ajustes/` con tres secciones: «Indexación» (estado actual, quién y cuándo, botón con confirmación), «Destacados» (tarifa diaria) y «Paquete empresas» (precio anual y beneficios). Registrar la enmienda de D-25 en `docs/DECISIONS.md` (siguiente número libre).
- [ ] **Step 4: Run** los dos archivos, `npx vitest run tests/unit/site-config.test.ts tests/db/site-settings.test.ts` y `npx playwright test tests/e2e/indexing-switch.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: interruptor de indexación y pantalla de ajustes"`

### Tarea 5.2: Metadatos y datos estructurados (SEO-04, SEO-05, SEO-13, SEO-14)

**Files:**
- Create: `src/lib/seo/metadata.ts`, `src/lib/seo/jsonld.ts`, `tests/unit/seo-metadata.test.ts`, `tests/unit/seo-jsonld.test.ts`
- Modify: `src/app/page.tsx`, `src/app/[...segments]/page.tsx`, `src/features/catalog/event-detail.tsx`, `src/app/buscar/page.tsx`, `src/app/para-empresas/page.tsx`, `src/components/catalog/breadcrumbs.tsx`

**Interfaces:**
- Produces en `metadata.ts`: `export function buildPageMetadata(input: { title: string; description: string; path: string; indexable: boolean; indexingEnabled: boolean; image?: string; type?: 'website' | 'article' }, siteUrl: string): Metadata` — título recortado a 60 caracteres sin cortar palabras, descripción a 160, `alternates.canonical` absoluto con barra final, `openGraph` (título, descripción, URL, imagen, `locale: 'es_SV'`) y `robots` vía `robotsMetadata`.
- Produces en `jsonld.ts`: `breadcrumbListJsonLd(items: { name: string; path: string }[], siteUrl: string): object` (posiciones desde 1, URLs absolutas); `webSiteJsonLd(siteUrl: string): object` (con `SearchAction` apuntando a `/buscar/?q={search_term_string}`); `organizationJsonLd(org: { name: string; description: string; path: string; isDemo: boolean }, siteUrl: string): object` (nombre con sufijo « (DEMO)» cuando `isDemo`); `articleJsonLd(post: { title: string; description: string; path: string; publishedAt: string; updatedAt: string }, siteUrl: string): object`. El `Event` existente se conserva y solo se emite con `indexingEnabled`.
- Plantillas de título: portada con la palabra clave del Excel («Boletos para eventos tecnológicos en El Salvador»); categoría `«{palabra clave}s en El Salvador» + marca` usando la palabra clave de `categories.keyword`; ficha `«{evento} · {fecha} · {ciudad o Virtual}»`.

- [ ] **Step 1: Write the failing tests.** `seo-metadata.test.ts`: `test('recorta el título a 60 sin cortar palabras')`, `test('la descripción no pasa de 160')`, `test('el canónico es absoluto y termina en barra')`, `test('sin interruptor la página es noindex aunque sea indexable')`, `test('incluye Open Graph con es_SV')`. `seo-jsonld.test.ts`: `test('BreadcrumbList numera desde 1 con URLs absolutas')`, `test('WebSite incluye SearchAction hacia /buscar/')`, `test('Organization demo lleva el sufijo DEMO')`, `test('Article trae fechas ISO')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/seo-metadata.test.ts tests/unit/seo-jsonld.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** ambos módulos, usarlos en las páginas indicadas y emitir `BreadcrumbList` desde el componente de migas.
- [ ] **Step 4: Run** ambos archivos, `npx vitest run tests/unit/event-detail.test.ts tests/unit/catalog.test.ts` y `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: plantillas de metadatos y datos estructurados"`

### Tarea 5.3: Sitemap y robots completos (SEO-03)

**Files:**
- Modify: `src/lib/seo/indexing.ts`, `src/app/sitemap.ts`, `tests/unit/indexing.test.ts`
- Create: `tests/unit/sitemap.test.ts`

**Interfaces:**
- Consumes: `indexableCatalogPaths` (existente), rutas de eventos (`src/features/catalog/paths.ts`, leer sus funciones), lista de organizadores con eventos próximos, `blog_posts` publicados (5.6).
- Produces: `export function buildSitemapEntries(input: { indexingEnabled: boolean; siteUrl: string; catalogPaths: string[]; eventPaths: { path: string; updatedAt: Date }[]; organizerPaths: string[]; blogPaths: { path: string; updatedAt: Date }[]; now: Date }): MetadataRoute.Sitemap` — vacío si `indexingEnabled` es falso; si no, `/` + catálogo + eventos futuros publicados + organizadores + blog + `/para-empresas/`, `/privacidad/`, `/terminos/`; URLs absolutas con barra final; sin duplicados; nunca rutas privadas ni de modalidad.

- [ ] **Step 1: Write the failing test** `tests/unit/sitemap.test.ts`: `test('apagado devuelve un sitemap vacío')`, `test('encendido incluye home, categorías, eventos y blog')`, `test('no incluye rutas privadas')`, `test('no repite URLs')`, `test('todas las URLs son absolutas y terminan en barra')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/sitemap.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** la función y que `sitemap.ts` consulte los datos con la clave pública (sin `service_role`). Conservar `revalidate = 60`.
- [ ] **Step 4: Run** el test y `npx vitest run tests/unit/indexing.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: sitemap con eventos, organizadores y blog"`

---

## Parte 5.B — Contenido editorial

### Tarea 5.4: Modelo de contenido y markdown seguro (CT-02)

**Files:**
- Create: `supabase/migrations/20261112100000_editorial_content.sql`, `tests/db/editorial-content.test.ts`, `src/lib/content/markdown.ts`, `tests/unit/markdown.test.ts`

**Interfaces:**
- Produces (SQL):
  - `blog_posts(id uuid pk default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('nuevo')), title text not null check (char_length(title) between 5 and 70), description text not null check (char_length(description) between 50 and 160), body_md text not null check (char_length(body_md) <= 20000), keyword text, topic text not null check (topic in ('eventos','cultura','fechas-mixtas')), related_type_slugs text[] not null default '{}', status text not null default 'draft' check (status in ('draft','published')), published_at timestamptz, author_id uuid references auth.users, updated_at timestamptz not null default now(), check (status = 'draft' or (keyword is not null and char_length(body_md) >= 200 and published_at is not null)))`
  - `editorial_pages(id uuid pk default gen_random_uuid(), category_id uuid not null unique references categories on delete cascade, intro_md text not null check (char_length(intro_md) <= 4000), faq jsonb not null default '[]', status text not null default 'draft' check (status in ('draft','published')), updated_by uuid references auth.users, updated_at timestamptz not null default now())`
  - RLS: lectura pública de filas `published`; nadie escribe directo. Funciones `SECURITY DEFINER` solo admin: `admin_save_blog_post(p_id uuid, p_slug text, p_title text, p_description text, p_body_md text, p_keyword text, p_topic text, p_related_type_slugs text[], p_status text) returns uuid` (fija `published_at` al publicar por primera vez y `author_id = auth.uid()`; valida que cada `p_related_type_slugs` exista como `event_type`), `admin_save_editorial_page(p_category_id uuid, p_intro_md text, p_faq jsonb, p_status text) returns uuid` (FAQ: arreglo de ≤ 8 objetos `{q, a}` con textos de 5–200 y 10–600 caracteres), `admin_delete_blog_post(p_id uuid) returns void`.
- Produces en `markdown.ts`:
  - `export type Inline = { t: 'text'; v: string } | { t: 'strong'; v: string } | { t: 'link'; href: string; v: string }`
  - `export type Block = { type: 'h2' | 'h3' | 'p'; inline: Inline[] } | { type: 'ul'; items: Inline[][] }`
  - `export function parseMarkdown(source: string): Block[]` — soporta `##` y `###` (un `#` suelto se trata como `##`), párrafos separados por línea en blanco, listas con `- `, `**negrita**` y `[texto](https://…)`. Solo enlaces `https://`; cualquier otro esquema (`javascript:`, `data:`, `http:`, relativo con `//`) se emite como texto plano. Todo lo demás es texto; **no existe ruta que produzca HTML**.
  - `export function MarkdownView(props: { blocks: Block[] }): JSX.Element` (componente de servidor que crea elementos React; enlaces con `rel="noopener noreferrer"`).

- [ ] **Step 1: Write the failing tests.**
  - `markdown.test.ts`: `test('un <script> queda como texto')`, `test('<img onerror> queda como texto')`, `test('un enlace javascript: se vuelve texto')`, `test('un enlace https se conserva')`, `test('un enlace http o //otro.com se vuelve texto')`, `test('títulos, listas y negrita')`, `test('MarkdownView no usa dangerouslySetInnerHTML')` (leer el archivo y comprobar que la cadena no aparece).
  - `editorial-content.test.ts`: `test('anon lee solo los publicados')`, `test('solo el administrador guarda')`, `test('publicar exige palabra clave y 200 caracteres')`, `test('slug inválido se rechaza')`, `test('título de más de 70 se rechaza')`, `test('un tipo relacionado inexistente se rechaza')`, `test('FAQ con más de 8 preguntas se rechaza')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/markdown.test.ts tests/db/editorial-content.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración y parser. El parser es un recorrido por líneas; no añadir dependencias.
- [ ] **Step 4: Run** ambos archivos — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: modelo editorial y markdown seguro"`

### Tarea 5.5: Editor del administrador (CT-03)

**Files:**
- Create: `src/app/admin/contenido/page.tsx`, `src/app/admin/contenido/blog/nuevo/page.tsx`, `src/app/admin/contenido/blog/[id]/page.tsx`, `src/app/admin/contenido/categorias/[categoryId]/page.tsx`, `src/features/content/validation.ts`, `src/features/content/actions.ts`, `src/components/admin/content-editor.tsx`, `tests/unit/content-validation.test.ts`, `tests/e2e/content-editor.spec.ts`
- Modify: `src/app/admin/page.tsx` (enlace «Contenido»)

**Interfaces:**
- Produces: `export function suggestSlug(title: string): string` — minúsculas, sin acentos, guiones, máximo 60; `export function validateBlogPost(input: unknown, mode: 'draft' | 'publish'): { valid: true; data: BlogPostInput } | { valid: false; errors: Partial<Record<keyof BlogPostInput, string>> }` con los mismos límites que la migración (borrador solo exige título y slug; publicar exige además descripción 50–160, cuerpo ≥ 200, palabra clave, tema de la lista `eventos | cultura | fechas-mixtas`); `validateEditorialPage(input: unknown)` (intro ≤ 4000, FAQ ≤ 8). Acciones `saveBlogPostAction`, `saveEditorialPageAction`, `deleteBlogPostAction` con `requireRole('admin', …)`.
- Pantalla con campos SEO visibles (título, meta descripción con contador, palabra clave), selector de tema, tipos relacionados y **vista previa** con `MarkdownView`. Un solo botón «Publicar» que valida en modo `publish`.

- [ ] **Step 1: Write the failing tests.** `content-validation.test.ts`: `test('suggestSlug quita acentos y símbolos')`, `test('un borrador solo necesita título y slug')`, `test('publicar exige palabra clave, descripción y 200 caracteres')`, `test('rechaza un tema fuera de la lista')`. E2E (`E2E_AUTH=1`): `test('el administrador crea un borrador, lo previsualiza y lo publica')`, `test('un organizador no entra al editor')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/content-validation.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** páginas y acciones; los errores se muestran junto al campo con `aria-invalid`.
- [ ] **Step 4: Run** unitarias y `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: editor de contenido para administradores"`

### Tarea 5.6: Blog público y textos por categoría (CT-04, SEO-06)

**Files:**
- Create: `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/features/content/queries.ts`, `src/components/content/post-card.tsx`, `src/components/content/category-intro.tsx`, `tests/unit/content-queries.test.ts`, `tests/e2e/blog.spec.ts`
- Modify: `src/app/[...segments]/page.tsx` (mostrar `CategoryIntro` bajo los filtros de tipo y de tema), `src/lib/seo/indexing.ts` (el sitemap usa los posts)

**Interfaces:**
- Produces en `queries.ts`: `export type BlogPostSummary = { slug: string; title: string; description: string; topic: string; publishedAt: string }`; `export async function listPublishedPosts(page: number, pageSize = 10): Promise<{ posts: BlogPostSummary[]; total: number }>`; `export async function getPublishedPost(slug: string)` (cuerpo, tipos relacionados con nombre y ruta); `export async function getEditorialPage(categoryId: string)`. Solo `published`, con la clave pública.
- `/blog/` lista con paginación; `/blog/[slug]/` muestra migas, `Article` JSON-LD, cuerpo con `MarkdownView` y «Eventos relacionados» enlazando a las categorías de `related_type_slugs`; slug inexistente o en borrador ⇒ 404. `CategoryIntro` muestra la intro y la FAQ (sin JSON-LD de FAQ).

- [ ] **Step 1: Write the failing tests.** `content-queries.test.ts`: `test('la paginación calcula el total')`, `test('un borrador no se lista')` (con datos de ejemplo). E2E: `test('/blog/ lista artículos publicados')`, `test('un slug de borrador responde 404')`, `test('la categoría muestra su texto editorial')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/content-queries.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** `/blog/` es ruta estática y tiene prioridad sobre el resolvedor; reservar `blog` en la lista de segmentos reservados de `routes.ts`.
- [ ] **Step 4: Run** unitarias, `npx vitest run tests/unit/routes.test.ts` y `npx playwright test tests/e2e/blog.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: blog público y textos editoriales por categoría"`

### Tarea 5.7: Página de la Copa Salvadoreña (CT-06)

**Files:**
- Create: `src/features/catalog/organizers.ts`, `src/components/catalog/organizer-page.tsx`, `tests/unit/organizer-routes.test.ts`, `tests/e2e/organizer-page.spec.ts`
- Modify: `src/app/[...segments]/page.tsx`, `src/features/catalog/routes.ts`

**Interfaces:**
- Consumes: organizador sembrado en la Fase 0 (tarea 0.7, `slug = 'copa'`), `organizationJsonLd` (5.2).
- Produces en `organizers.ts`: `export const reservedRootSlugs: readonly string[]` (`admin, api, blog, buscar, calendario, carrito, checkout, confirmacion, cuenta, ingresar, mis-boletos, panel, para-empresas, privacidad, recuperar, registro, terminos` más los slugs de categorías); `export function isOrganizerSlugAllowed(slug: string, taxonomySlugs: readonly string[]): boolean`; `export async function getOrganizerPage(slug: string): Promise<{ name: string; description: string; events: CatalogEvent[] } | null>` (solo eventos publicados y próximos; `null` si el organizador no existe).
- El resolvedor intenta primero la taxonomía y **después** el organizador para rutas de un segmento. `noindex` si no hay eventos próximos. La página dice «Organizador DEMO» y no afirma afiliación.

- [ ] **Step 1: Write the failing tests.** `organizer-routes.test.ts`: `test('copa está permitido y blog no')`, `test('un slug de categoría no puede ser organizador')`, `test('la taxonomía tiene prioridad sobre el organizador')`. E2E: `test('/copa/ muestra la Copa Salvadoreña DEMO con sus eventos')`, `test('/claude/ responde 404')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/organizer-routes.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** unitarias, `npx vitest run tests/unit/routes.test.ts` y el E2E — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: página pública de la Copa Salvadoreña DEMO"`

### Tarea 5.8: Enlazado interno y rendimiento (SEO-07, SEO-08)

**Files:**
- Create: `tests/e2e/internal-links.spec.ts`, `docs/analisis/evidencias/fase-5/rendimiento.md`
- Modify: `src/features/catalog/event-detail.tsx`, `src/components/layout/site-footer.tsx`

**Interfaces:**
- Presupuesto móvil (laboratorio, 375 px, perfil móvil de Lighthouse): LCP ≤ 2.5 s, CLS ≤ 0.1, sin recursos que bloqueen el render de terceros.

- [ ] **Step 1: Write the failing test** `internal-links.spec.ts`: `test('cada una de las 12 categorías se alcanza con un clic desde la portada')`, `test('cada ficha enlaza a su tipo, su tema y su ciudad cuando existen')`, `test('el pie enlaza privacidad, términos, blog y para empresas')`.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/internal-links.spec.ts --project=chromium` — Expected: FAIL (faltan enlaces de ficha y del pie).
- [ ] **Step 3: Implement** los enlaces (tipo, tema y ciudad en la ficha; blog y «Para empresas» en el pie).
- [ ] **Step 4: Medir** con Lighthouse (`npx lighthouse <url> --preset=perf --form-factor=mobile`) la portada, una categoría y una ficha en producción local; registrar valores y fecha en `rendimiento.md`; si LCP o CLS no cumplen, anotar la causa y abrir una tarea en el backlog.
- [ ] **Step 5: Commit** — `git commit -m "feat: enlazado interno y medición de rendimiento"`

---

## Parte 5.C — Consentimiento y analítica

### Tarea 5.9: Consentimiento y analítica propia (LG-02, MK-01, MK-02)

**Files:**
- Create: `supabase/migrations/20261112110000_analytics_events.sql`, `tests/db/analytics-events.test.ts`, `src/lib/analytics/consent.ts`, `src/lib/analytics/track.ts`, `src/app/api/analytics/route.ts`, `src/components/layout/consent-banner.tsx`, `src/components/layout/page-view-tracker.tsx`, `src/app/admin/metricas/page.tsx`, `tests/unit/consent.test.ts`, `tests/unit/track.test.ts`, `tests/e2e/consent.spec.ts`
- Modify: `src/app/layout.tsx`, `src/components/checkout/checkout-page.tsx` (`begin_checkout`), `src/app/confirmacion/[orderId]/[token]/page.tsx` (`purchase_confirmed`), `src/features/featured/request-actions.ts` y `src/features/packages/actions.ts` (`featured_purchased`, `package_purchased`), `docs/analisis/` (lista de eventos medidos)

**Interfaces:**
- Produces (SQL): `analytics_events(id bigint generated always as identity primary key, name text not null check (name in ('page_view','event_view','begin_checkout','purchase_confirmed','featured_purchased','package_purchased','check_in')), path text not null check (char_length(path) <= 200), referrer_host text check (char_length(referrer_host) <= 100), anon_id uuid, created_at timestamptz not null default now())`; RLS habilitado sin políticas para `anon` ni `authenticated`; solo `service_role` inserta; `admin_analytics_summary(p_from date, p_to date) returns table (day date, name text, total bigint)` (`SECURITY DEFINER`, solo admin).
- Produces en `consent.ts`: `export type ConsentState = 'granted' | 'denied' | 'unset'`; `export function parseConsent(cookieHeader: string | undefined): ConsentState` (cookie `ticketera_consent`); `export const consentCookie = (state: 'granted' | 'denied') => string` (valor de `Set-Cookie` con `Path=/; Max-Age=15552000; SameSite=Lax`).
- Produces en `track.ts`: `export type AnalyticsEventName` (la lista de la tabla); `export function trackEvent(name: AnalyticsEventName, options?: { path?: string }): void` — no hace nada sin consentimiento `granted`; usa `navigator.sendBeacon('/api/analytics', …)` o `fetch` con `keepalive`.
- `POST /api/analytics`: valida `name` contra la lista y `path` (empieza por `/`, ≤ 200), exige cookie de consentimiento `granted` (si no, responde `204` sin escribir), nunca guarda correo, IP ni agente de usuario; `anon_id` es un uuid de cookie `ticketera_anon` creada **solo tras aceptar**.
- `ConsentBanner`: aparece con estado `unset`; botones «Aceptar analítica» y «Solo lo necesario» con el mismo estilo, enlace a `/privacidad/`.

- [ ] **Step 1: Write the failing tests.** `consent.test.ts`: `test('sin cookie es unset')`, `test('lee granted y denied')`, `test('la cookie dura 180 días y es SameSite=Lax')`. `track.test.ts`: `test('sin consentimiento no se envía nada')`, `test('con consentimiento envía una vez')`. DB: `test('anon y authenticated no leen ni escriben')`, `test('service_role inserta')`, `test('un nombre fuera de la lista se rechaza')`, `test('el resumen es solo del administrador')`. E2E: `test('antes de aceptar no sale ninguna petición a /api/analytics')`, `test('al elegir Solo lo necesario tampoco')`, `test('al aceptar sí se envía page_view')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/consent.test.ts tests/unit/track.test.ts tests/db/analytics-events.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Página `/admin/metricas/` con tabla por día y evento (últimos 30 días). Documentar en `docs/analisis/` los eventos medidos y qué objetivo SMART alimenta cada uno (visitas ⇒ `page_view`; conversiones ⇒ `purchase_confirmed`; paquetes B2B ⇒ `package_purchased`).
- [ ] **Step 4: Run** los tres archivos y `npx playwright test tests/e2e/consent.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: consentimiento y analítica propia mínima"`

### Tarea 5.10: Contenido inicial escrito por administradores (CT-05, SEO-06, equipo)

**Files:**
- Create: `docs/analisis/evidencias/fase-5/contenido-publicado.md` (lista de lo publicado con enlace y fecha)

**Entregables (se redactan en el editor de 5.5, no en el repositorio):**
- 4 artículos mínimos, uno por línea de tema `eventos`, `cultura`, `fechas-mixtas` y uno libre; cada uno con título ≤ 70, descripción 50–160, palabra clave del Excel (congreso, competencia, networking, hackathon, bootcamp, workshop…), tipos relacionados, ≥ 600 palabras, sin cifras ni testimonios inventados, publicado antes del pico de septiembre–octubre.
- 12 textos de categoría (150–250 palabras) con variantes de la palabra clave, publicados desde `/admin/contenido/categorias/[id]/`.
- Se escribe un calendario editorial con fechas de publicación previas al pico.

- [ ] **Step 1:** Redactar y publicar los artículos y textos.
- [ ] **Step 2: Verify:** abrir `/blog/` y cada categoría; comprobar títulos y meta con la vista de código del navegador.
- [ ] **Step 3: Commit** — `git commit -m "docs: registro del contenido editorial publicado"`

---

## Cierre de la fase

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test --project=chromium` — Expected: todo en verde.
- [ ] Migraciones `20261112100000` y `20261112110000` listas; **aplicar en producción solo tras confirmación**.
- [ ] Activación (cuando el responsable la pida): poner `NEXT_PUBLIC_SITE_URL=https://ticketera.c3.com.sv`, apuntar el dominio (DM-01), verificar `robots.txt` y `sitemap.xml`, **activar el interruptor** en `/admin/ajustes/`, registrar el sitemap en Search Console (SEO-11).
- [ ] PR de `codex/fase-5-contenido-seo`.
