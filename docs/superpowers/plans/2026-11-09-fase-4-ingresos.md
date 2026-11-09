# Fase 4 — Ingresos: destacados por día y paquete empresas — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Destacados pagados por día (simulados) y manuales en un solo panel administrativo, bloque de destacados en cada categoría y en la portada, y un paquete anual para empresas con multieventos, seguimiento, destacados con descuento o gratis y reporte superior.

**Architecture:** `site_settings` guarda tarifa diaria, precio del paquete y beneficios (si falta un monto, la función se muestra como «Tarifa por definir»). `featured_placements` reemplaza a `event_featured` (D-35) y modela pagados y manuales con vigencia en fechas. Todo cálculo de total, días gratis y descuento ocurre en funciones SQL; el cliente solo muestra un total provisional. El pago reutiliza `SimulatedPaymentPanel` de la Fase 2.

**Tech Stack:** Postgres (PGlite en pruebas), Next.js Server Actions, Vitest, Playwright.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (R-04; DP-02, DP-03, DP-20; BM-01 a BM-09) · [roadmap](2026-11-09-roadmap-nuevas-areas.md) (decisiones P-5 y P-6)

## Global Constraints

- Leer `node_modules/next/dist/docs/` (Server Actions, caché y revalidación) antes de codificar (AGENTS.md).
- Cobro **simulado**: nunca se mueve dinero ni se piden datos de tarjeta; se usa `PaymentDecision` (`'approved' | 'rejected'`) y se etiqueta «Pago de demostración».
- Importes en centavos enteros; **el servidor y SQL calculan** días, descuentos y totales. Redondeo: mitad hacia arriba al centavo.
- Un organizador solo opera sobre sus eventos (`owns_event`); el administrador se comprueba con `is_admin()`.
- Valores de los beneficios del paquete son **supuestos DEMO** configurables; precio anual y tarifa diaria los fija el responsable (aún no definidos).
- Migraciones posteriores a `20261110120000`, con pruebas en `tests/db`; no aplicar a producción sin confirmación.
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Un organizador destaca un evento ajeno, o envía tarifa, total o días gratis propios: la función ignora todo salvo `event_id`, fecha de inicio, días y decisión (4.2).
2. Días fuera de rango (0, 31, negativos), fecha de inicio pasada, o un evento no publicado (4.2).
3. Pago rechazado: no queda destacado activo y no consume días gratis del paquete (4.2, 4.7).
4. Dos destacados superpuestos para el mismo evento no se duplican en portada ni en categoría (4.2, 4.5).
5. Sin tarifa configurada, la página de destacar muestra «Tarifa por definir» y no permite enviar (4.4).

---

## Parte 4.A — Configuración y destacados

### Tarea 4.1: Tabla `site_settings`

**Files:**
- Create: `supabase/migrations/20261111100000_site_settings.sql`, `tests/db/site-settings.test.ts`, `src/features/settings/settings.ts`, `tests/unit/settings.test.ts`

**Interfaces:**
- Produces (SQL): `site_settings(key text primary key, value jsonb not null, updated_by uuid references auth.users(id), updated_at timestamptz not null default now())`; RLS habilitado; lectura pública **solo** de las claves `featured_daily_rate_cents`, `package_annual_price_cents`, `package_benefits`, `indexing_enabled` mediante política `using (key in (...))`; escritura solo con `public.admin_set_setting(p_key text, p_value jsonb) returns void` (`SECURITY DEFINER`, solo admin, solo claves de la lista, registra `updated_by`/`updated_at`). Sin filas iniciales: ausencia significa «sin definir» (`indexing_enabled` ausente = `false`).
- Produces (TS) en `settings.ts`:
  - `export type PackageBenefits = { eventsIncluded: number; featuredDaysIncluded: number; featuredDiscountPercent: number; personalizedFollowUp: boolean; advancedReport: boolean }`
  - `export const defaultPackageBenefits: PackageBenefits` = `{ eventsIncluded: 10, featuredDaysIncluded: 30, featuredDiscountPercent: 50, personalizedFollowUp: true, advancedReport: true }` (**supuestos DEMO**, comentados como tales)
  - `export function parsePackageBenefits(value: unknown): PackageBenefits` (valores inválidos caen al default)
  - `export async function getSiteSettings(): Promise<{ featuredDailyRateCents: number | null; packageAnnualPriceCents: number | null; packageBenefits: PackageBenefits; indexingEnabled: boolean }>` con el cliente público.

- [ ] **Step 1: Write the failing tests.** DB: `test('anon lee solo las claves permitidas')`, `test('anon no puede escribir')`, `test('solo el administrador cambia una clave permitida')`, `test('una clave desconocida se rechaza')`, `test('registra quién y cuándo')`. Unitarias: `test('parsePackageBenefits cae al default con valores inválidos')`, `test('ausencia de tarifa devuelve null')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/site-settings.test.ts tests/unit/settings.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración y módulo.
- [ ] **Step 4: Run** ambos — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: site_settings con claves públicas y escritura de administrador"`

### Tarea 4.2: Destacados pagados y manuales (BM-02)

**Files:**
- Create: `supabase/migrations/20261111110000_featured_placements.sql`, `tests/db/featured-placements.test.ts`, `src/features/featured/pricing.ts`, `tests/unit/featured-pricing.test.ts`
- Modify: `tests/db/event-featured.test.ts` (se reescribe para la tabla nueva o se elimina junto con la tabla vieja)

**Interfaces:**
- Produces (SQL), tabla `featured_placements(id uuid pk default gen_random_uuid(), event_id uuid not null references events on delete cascade, source text not null check (source in ('manual','paid')), starts_on date not null, ends_on date not null, days integer generated always as (ends_on - starts_on + 1) stored, daily_rate_cents integer, free_days integer not null default 0, total_cents integer not null default 0, status text not null check (status in ('pending','approved','rejected','payment_failed','cancelled')), requested_by uuid references auth.users, reviewed_by uuid references auth.users, reviewed_at timestamptz, created_at timestamptz not null default now(), check (ends_on >= starts_on), check (ends_on - starts_on + 1 <= 30 or source = 'manual'))`; RLS: lectura pública de filas `approved` vigentes; el dueño lee las suyas; nadie escribe directo.
- Funciones `SECURITY DEFINER` (`search_path = public, pg_temp`):
  - `request_paid_featured(p_event_id uuid, p_starts_on date, p_days integer, p_decision text) returns uuid` — solo si `owns_event(p_event_id)`; evento `published`; `p_days` entre 1 y 30; `p_starts_on >= current_date`; `p_decision in ('approved','rejected')`; lee la tarifa de `site_settings` (error si no existe); aplica el paquete activo del organizador si lo hay (días gratis y descuento, ver 4.6); con `rejected` guarda la fila en `payment_failed` y no consume días gratis; con `approved` guarda `pending`.
  - `admin_review_featured(p_id uuid, p_decision text) returns void` — solo admin; `pending → approved | rejected`.
  - `admin_create_manual_featured(p_event_id uuid, p_starts_on date, p_ends_on date) returns uuid` — solo admin, evento publicado, estado `approved`, `daily_rate_cents` nulo, total 0.
  - `admin_cancel_featured(p_id uuid) returns void` — solo admin, pasa a `cancelled`.
  - `active_featured(p_limit integer default 4, p_event_type_id uuid default null) returns table (placement_id uuid, event_id uuid, source text)` — `approved` con `current_date between starts_on and ends_on`, evento `published` y futuro, **un evento una sola vez**, orden: manuales primero, luego pagados por `starts_on`, filtrado por tipo de evento si se pasa.
- Migración de datos: copiar cada fila de `event_featured` como `manual` `approved` con `starts_on = current_date` y `ends_on = current_date + 365`; luego eliminar `event_featured` y `admin_set_featured`.
- Produces (TS) en `pricing.ts`: `export function provisionalFeaturedTotal(input: { days: number; dailyRateCents: number; freeDays?: number; discountPercent?: number }): number` — `(days − freeDays) × tarifa × (100 − descuento) / 100`, redondeo mitad hacia arriba; usado solo para el total provisional en pantalla.

- [ ] **Step 1: Write the failing tests.**
  - DB `featured-placements.test.ts`: `test('un organizador destaca su evento publicado y queda pending')`, `test('no puede destacar un evento ajeno')`, `test('0 y 31 días se rechazan')`, `test('fecha de inicio pasada se rechaza')`, `test('evento no publicado se rechaza')`, `test('sin tarifa configurada falla')`, `test('el total lo calcula el servidor: días × tarifa')`, `test('pago rechazado deja payment_failed')`, `test('solo el administrador aprueba y crea manuales')`, `test('active_featured no repite un evento con dos filas y pone manuales primero')`, `test('active_featured filtra por tipo de evento')`, `test('los datos de event_featured se migraron como manuales')`.
  - Unitarias `featured-pricing.test.ts`: `test('7 días a $2 = $14')` (con tarifa 200), `test('con 3 días gratis y 50 % de descuento')`, `test('redondea mitad hacia arriba')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/featured-placements.test.ts tests/unit/featured-pricing.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración y función de precio. Leer `20261106100000_event_featured.sql` antes de migrar los datos y de eliminar la tabla vieja.
- [ ] **Step 4: Run** ambos y `npx vitest run tests/db` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: destacados pagados y manuales con vigencia por fechas"`

### Tarea 4.3: Panel administrativo de destacados (BM-08)

**Files:**
- Create: `src/app/admin/destacados/page.tsx`, `src/features/featured/actions.ts`, `src/features/featured/admin.ts`, `src/components/admin/featured-table.tsx`, `tests/unit/featured-admin.test.ts`, `tests/e2e/featured-admin.spec.ts`
- Modify: `src/app/admin/page.tsx` (enlace «Destacados»; se retira el bloque antiguo de `setFeaturedAction`), `src/features/organizers/featured-actions.ts` (eliminar), `src/app/admin/page.tsx` imports

**Interfaces:**
- Consumes: funciones de 4.2.
- Produces en `admin.ts`: `export type FeaturedRow = { id: string; eventTitle: string; source: 'manual' | 'paid'; status: string; startsOn: string; endsOn: string; days: number; totalCents: number }`; `export function parseFeaturedFilters(searchParams: Record<string, string | string[] | undefined>): { status: 'all' | 'pending' | 'approved' | 'rejected' | 'payment_failed' | 'cancelled'; source: 'all' | 'manual' | 'paid'; page: number }` (lista cerrada; valores desconocidos caen a `all`/1).
- Acciones (Server Actions, `requireRole('admin', …)`): `createManualFeaturedAction`, `reviewFeaturedAction`, `cancelFeaturedAction`, todas con `revalidatePath('/', 'layout')`.
- Pantalla: una sola lista con columna «Origen» (Manual o Pagado); los dos se ven y se gestionan igual.

- [ ] **Step 1: Write the failing tests.** Unitarias: `test('parseFeaturedFilters acepta solo valores de la lista')`, `test('la página inválida cae a 1')`. E2E (`E2E_AUTH=1`): `test('el administrador ve pagados y manuales en la misma lista')`, `test('un organizador no entra a /admin/destacados/')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/featured-admin.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** la página con filtros por estado y origen, paginación de 20 y formulario para crear un destacado manual (evento publicado, fecha de inicio y fin). Botones con el nombre del evento en el texto accesible.
- [ ] **Step 4: Run** unitarias y `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: panel administrativo único de destacados"`

---

## Parte 4.B — Flujo del organizador y visualización

### Tarea 4.4: Destacar mi evento por días (BM-03, BM-06)

**Files:**
- Create: `src/app/panel/destacar/[eventId]/page.tsx`, `src/features/featured/request.ts`, `src/features/featured/request-actions.ts`, `src/components/organizers/featured-request-form.tsx`, `tests/unit/featured-request.test.ts`, `tests/e2e/featured-request.spec.ts`
- Modify: `src/app/panel/page.tsx` (botón «Destacar» por evento publicado y lista «Mis destacados» con estado, días y total simulado)

**Interfaces:**
- Consumes: `SimulatedPaymentPanel` y `PaymentDecision` (Fase 2), `provisionalFeaturedTotal` (4.2), `getSiteSettings` (4.1).
- Produces en `request.ts`: `export function validateFeaturedRequest(input: { eventId: unknown; startsOn: unknown; days: unknown }, today: Date): { valid: true; data: { eventId: string; startsOn: string; days: number } } | { valid: false; errors: Partial<Record<'eventId' | 'startsOn' | 'days', string>> }` — uuid, fecha `YYYY-MM-DD` no pasada (zona de El Salvador), días entero de 1 a 30.
- La acción llama `request_paid_featured` con el cliente del organizador (RLS y `owns_event` deciden). Sin tarifa en `site_settings` la página muestra «Tarifa por definir» y deshabilita el envío.

- [ ] **Step 1: Write the failing tests.** `featured-request.test.ts`: `test('rechaza 0 y 31 días')`, `test('rechaza fecha pasada')`, `test('rechaza eventId inválido')`, `test('acepta 7 días desde mañana')`. E2E: `test('sin tarifa configurada muestra Tarifa por definir')`, `test('el organizador elige días, ve el total y completa el pago simulado')`, `test('pago rechazado muestra el estado y no destaca')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/featured-request.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Selector: fecha de inicio (`type="date"`, `min` = hoy) y número de días (1–30); total provisional en vivo; el panel de pago simulado pide la decisión; el total real lo devuelve el servidor.
- [ ] **Step 4: Run** unitarias y `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: el organizador destaca su evento por días con pago simulado"`

### Tarea 4.5: Portada y bloque de destacados por categoría (BM-04, BM-09)

**Files:**
- Create: `src/features/featured/queries.ts`, `src/components/catalog/featured-block.tsx`, `tests/unit/featured-queries.test.ts`, `tests/e2e/featured-category.spec.ts`
- Modify: `src/features/catalog/home.ts`, `src/app/page.tsx`, `src/components/catalog/featured-carousel.tsx`, `src/app/[...segments]/page.tsx`, `tests/unit/home-selection.test.ts`, `tests/e2e/featured.spec.ts`

**Interfaces:**
- Consumes: RPC `active_featured` (4.2).
- Produces: `export async function getHomeFeaturedIds(limit = 4): Promise<string[]>` y `export async function getCategoryFeaturedIds(eventTypeId: string, limit = 3): Promise<string[]>` en `queries.ts`; `FeaturedBlock(props: { events: CatalogEvent[]; heading: string })` — devuelve `null` si no hay eventos; cada tarjeta lleva la etiqueta «Destacado» (sin distinguir origen).
- Regla de portada: si no hay destacados activos, se usan los próximos como hoy (D-35). «Próximos» y «Gratuitos» excluyen lo ya mostrado.
- En `/congresos/`, `/competencias/` y demás páginas de tipo (y sus subtemas) se muestra `FeaturedBlock` con los destacados de **ese tipo**; en páginas de tema o ciudad no se muestra.

- [ ] **Step 1: Write the failing tests.** Unitarias `featured-queries.test.ts` y `home-selection.test.ts`: `test('sin destacados activos la portada usa los próximos')`, `test('un evento no aparece dos veces en portada')`, `test('la categoría solo recibe destacados de su tipo')`. E2E: `test('/congresos/ muestra sus destacados y /cloud/ no muestra bloque')`, `test('sin destacados no hay bloque vacío')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/featured-queries.test.ts tests/unit/home-selection.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** consultas, bloque y su uso en portada y categorías.
- [ ] **Step 4: Run** unitarias y `npx playwright test tests/e2e/featured.spec.ts tests/e2e/featured-category.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: destacados activos en portada y en cada categoría"`

---

## Parte 4.C — Paquete empresas

### Tarea 4.6: Modelo del paquete (BM-05, datos)

**Files:**
- Create: `supabase/migrations/20261111120000_business_packages.sql`, `tests/db/business-packages.test.ts`

**Interfaces:**
- Produces (SQL): `business_packages(id uuid pk default gen_random_uuid(), organizer_id uuid not null references organizers on delete cascade, starts_on date not null, ends_on date not null, price_cents integer not null check (price_cents >= 0), benefits jsonb not null, featured_days_remaining integer not null check (featured_days_remaining >= 0), events_remaining integer not null check (events_remaining >= 0), status text not null check (status in ('active','payment_failed','expired')), created_at timestamptz not null default now())`; `package_followup_requests(id uuid pk default gen_random_uuid(), package_id uuid not null references business_packages on delete cascade, message text not null check (char_length(message) between 5 and 500), status text not null default 'open' check (status in ('open','answered')), created_at timestamptz not null default now())`. RLS: el dueño del organizador lee lo suyo; el administrador lee todo; nadie escribe directo.
- Funciones `SECURITY DEFINER`:
  - `purchase_business_package(p_organizer_id uuid, p_decision text) returns uuid` — solo dueño del organizador (`owns_organizer`); lee `package_annual_price_cents` y `package_benefits` de `site_settings` (error si no hay precio); `rejected` ⇒ fila `payment_failed`; `approved` ⇒ fila `active` por 365 días con `featured_days_remaining` y `events_remaining` tomados de los beneficios; un organizador no puede tener dos paquetes `active` a la vez.
  - `request_package_followup(p_package_id uuid, p_message text) returns uuid` — solo el dueño del paquete activo.
  - `answer_package_followup(p_id uuid) returns void` — solo admin.
- `request_paid_featured` (4.2) se actualiza para: usar `featured_days_remaining` (días gratis = `least(p_days, remaining)`), aplicar `featuredDiscountPercent` al resto y descontar `featured_days_remaining` **solo con decisión `approved`**.

- [ ] **Step 1: Write the failing tests** `business-packages.test.ts`: `test('compra aprobada crea un paquete activo con días y eventos del beneficio')`, `test('compra rechazada deja payment_failed')`, `test('sin precio configurado falla')`, `test('no se puede tener dos paquetes activos')`, `test('otro usuario no compra para un organizador ajeno')`, `test('un destacado con paquete usa días gratis y luego descuento')`, `test('un destacado rechazado no consume días gratis')`, `test('solo el dueño pide seguimiento y solo el admin lo contesta')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/business-packages.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** la migración y la actualización de `request_paid_featured`.
- [ ] **Step 4: Run** el archivo y `npx vitest run tests/db/featured-placements.test.ts` — Expected: PASS ambos.
- [ ] **Step 5: Commit** — `git commit -m "feat: paquete empresas con beneficios y seguimiento"`

### Tarea 4.7: Página de venta y panel del paquete (BM-05)

**Files:**
- Create: `src/app/para-empresas/page.tsx`, `src/app/panel/paquete/page.tsx`, `src/features/packages/benefits.ts`, `src/features/packages/actions.ts`, `src/components/packages/benefit-list.tsx`, `tests/unit/package-benefits.test.ts`, `tests/e2e/package.spec.ts`
- Modify: `src/components/layout/site-footer.tsx` (enlace «Para empresas»), `src/app/panel/page.tsx`

**Interfaces:**
- Consumes: `PackageBenefits`, `getSiteSettings` (4.1), `SimulatedPaymentPanel` (Fase 2), funciones de 4.6.
- Produces en `benefits.ts`: `export function describeBenefits(benefits: PackageBenefits): { title: string; detail: string }[]` — cuatro entradas fijas: «Multieventos» («Hasta N eventos durante el año»), «Seguimiento personalizado» (solo si `personalizedFollowUp`), «Destacados con descuento o gratis» («N días de destacado gratis y D % de descuento después»), «Reporte de datos superior» (solo si `advancedReport`).
- `/para-empresas/`: beneficios y precio (si falta, «Precio por definir»); botón «Contratar» solo con sesión de organizador; compra simulada. `noindex` mientras el sitio no esté indexable (Fase 5).
- `/panel/paquete/`: estado, días y eventos restantes, historial y formulario «Solicitar seguimiento».

- [ ] **Step 1: Write the failing tests.** Unitarias: `test('describeBenefits con valores por defecto produce los cuatro beneficios')`, `test('sin seguimiento ni reporte avanzado omite esas entradas')`. E2E: `test('sin precio configurado la página dice Precio por definir')`, `test('un organizador contrata con pago simulado aprobado y ve su paquete')`, `test('un visitante sin sesión ve los beneficios pero no el botón Contratar')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/package-benefits.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** páginas, acciones y enlaces. El administrador responde los seguimientos desde `/admin/destacados/` (sección «Seguimientos»); añadir esa sección con `answer_package_followup`.
- [ ] **Step 4: Run** unitarias y `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: página y panel del paquete para empresas"`

### Tarea 4.8: Documentos de la fase (BM-07)

**Files:**
- Modify: `docs/product/PRD.md` (§4 con destacado por día y paquete; quitar «sin cobro del organizador»), `docs/architecture/DATA.md` (`site_settings`, `featured_placements`, `business_packages`, `package_followup_requests`; `event_featured` retirada), `docs/architecture/SYSTEM.md`, `docs/checkout/DEMO_PAYMENT.md` (cobro simulado de destacados y paquete), `docs/DECISIONS.md` (decisiones P-5 y P-6 con el siguiente número libre; D-35 pasa a «Reemplazada»)

- [ ] **Step 1:** Escribir los cambios.
- [ ] **Step 2: Verify:** `grep -n "event_featured" docs/architecture/DATA.md` — Expected: aparece solo como «retirada».
- [ ] **Step 3: Commit** — `git commit -m "docs: destacados por día y paquete empresas"`

---

## Cierre de la fase

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test --project=chromium` — Expected: todo en verde.
- [ ] Migraciones `20261111100000`, `20261111110000` y `20261111120000` listas; **aplicar en producción solo tras confirmación**. Antes de abrir la función al público, el responsable fija `featured_daily_rate_cents` y `package_annual_price_cents` (desde SQL o la pantalla de ajustes de la Fase 5).
- [ ] PR de `codex/fase-4-ingresos`.
