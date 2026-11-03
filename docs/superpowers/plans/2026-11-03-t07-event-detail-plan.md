# T07 — Ficha del evento y selección de entradas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Servir fichas públicas reales con selección de entradas válida dentro del resolvedor SEO existente, sin inventar datos ni adelantar la creación de órdenes.

**Architecture:** El catch-all conserva la precedencia de `seo_routes`; si la URL no es catálogo, un query server-only con el cliente Supabase `anon` busca un evento publicado por slug y verifica que la ruta coincida con su tipo/tema. La ficha server-rendered compone metadata, estado de compra, JSON-LD condicional y un selector client-side. La validación pura de selección queda en `src/features/catalog/tickets.ts` para ser reutilizada por el carrito y las acciones de compra posteriores.

**Spec:** `docs/superpowers/specs/2026-11-03-t07-event-detail-design.md`, `docs/superpowers/plans/implementation-backlog.md`, `docs/architecture/SEO_ROUTES.md`, `docs/DECISIONS.md` y `AGENTS.md`.

## Global Constraints

- Los datos públicos salen solo de Supabase con la clave `anon`; no hay fallback de ejemplo.
- El árbol tiene prioridad sobre fichas y los slugs `virtual`, `presencial` y `gratis` siguen reservados.
- Eventos pasados muestran estado finalizado, no compra y `noindex`.
- JSON-LD `Event` solo se emite cuando `siteConfig.isDemo` es `false`.
- Validar en servidor publicado, cupo disponible y `max_per_order`; montos/cantidades del cliente no son confiables.
- La UI sigue los tokens C3 y las reglas Impeccable de `docs/design/DESIGN.md`; revisar escritorio/móvil y detector al final.
- Los tests de `tests/unit` importan con rutas relativas, no con `@/`.
- No ejecutar builds innecesarios; no modificar ni hacer push a `master`.

## Review Focus

- Una URL que también pertenece al árbol debe seguir mostrando catálogo: prueba de precedencia antes de resolver la ficha.
- Un evento con tema debe aceptar solo la ruta de tres segmentos y uno sin tema solo la de dos: prueba de coincidencia de ruta.
- Eventos no publicados o inexistentes no deben filtrarse al cliente anon: prueba de consulta/resultado no disponible.
- Cero cupos, entradas inactivas y cantidades sobre el máximo deben producir error de selección: pruebas unitarias de validación.
- Un evento pasado debe conservar información pero no CTA de compra ni indexación: pruebas de estado y metadata.
- JSON-LD no debe aparecer en demo y debe usar únicamente campos almacenados en sitio real: prueba de serialización condicional.

---

### Task 1: Contratos de detalle, rutas y validación

**Files:**
- Modify: `src/features/catalog/types.ts`
- Modify: `src/features/catalog/paths.ts`
- Create: `src/features/catalog/tickets.ts`
- Test: `tests/unit/event-detail.test.ts`

**Interfaces:**
- Consumes: tipos `CatalogEvent` y la ruta `eventPath` existentes.
- Produces: `CatalogEventDetail`, `eventPathMatches(segments, event)`, `getAvailableQuantity(ticket)` y `validateTicketSelection(event, selection)` para la consulta y la UI.

- [x] **Step 1: Write the failing tests** para precedencia de forma de URL, disponibilidad (`total - vendido`), entradas inactivas, cupo cero y `max_per_order`.
- [x] **Step 2: Run the focused Vitest file** y confirmar RED por símbolos/contratos aún inexistentes.
- [x] **Step 3: Implementar los tipos y funciones mínimas** en los tres módulos, sin alias `@/` en el test.
- [x] **Step 4: Run the focused Vitest file** y confirmar GREEN.

### Task 2: Consulta pública del evento y relacionados

**Files:**
- Modify: `src/features/catalog/queries.ts`
- Test: `tests/unit/event-detail.test.ts` (solo helpers puros; el acceso Supabase se verifica con tipos y E2E)

**Interfaces:**
- Consumes: `CatalogEventDetail`, `eventPathMatches` y `createPublicClient()`.
- Produces: `getEventDetail(slug)` que devuelve `{ status: 'ok'; event; related } | { status: 'not_found' } | { status: 'unavailable' }` y solo consulta eventos publicados con sus entradas activas/datos almacenados.

- [x] **Step 1: Extend the query row mapping** con descripción, agenda, fecha final, imagen, IDs de taxonomía, inventario y nombre de entrada.
- [x] **Step 2: Implementar `getEventDetail` con `cache`**; cargar el evento publicado sin filtrar por fecha, y relacionados publicados/futuros del mismo tipo excluyendo el evento actual.
- [x] **Step 3: Verificar `npm run typecheck`** para confirmar que el contrato encaja con el cliente de Supabase y los consumidores existentes.

### Task 3: Ficha dentro del catch-all y metadata

**Files:**
- Modify: `src/app/[...segments]/page.tsx`
- Create: `src/features/catalog/event-detail.tsx`
- Test: `tests/unit/event-detail.test.ts` (metadata/estado puro si se extrae helper)

**Interfaces:**
- Consumes: `getEventDetail`, `resolveCatalogRoute`, `eventPathMatches`, `eventPath`, `siteConfig` y componentes de navegación actuales.
- Produces: ficha server-rendered con breadcrumb, portada honesta, datos, agenda, relacionados, estado pasado/agotado y JSON-LD real solo fuera de demo.

- [x] **Step 1: Add route branching** para que catálogo se resuelva primero y ficha solo después; `notFound()` para todo lo demás.
- [x] **Step 2: Add `generateMetadata` branching** con canónico de ficha, descripción almacenada, `noindex` para pasado/agotado y `openGraph` solo con imagen disponible.
- [x] **Step 3: Renderizar la ficha** con un único CTA de compra, textos en español, estado finalizado/agotado y datos opcionales solo cuando existan.
- [x] **Step 4: Emitir JSON-LD condicional** con `dangerouslySetInnerHTML` sanitizado por `JSON.stringify`, sin datos en modo demo.

### Task 4: Selector accesible de entradas y ruta de salida

**Files:**
- Create: `src/components/catalog/ticket-selector.tsx`
- Modify: `src/features/catalog/event-detail.tsx`
- Test: `tests/unit/event-detail.test.ts`

**Interfaces:**
- Consumes: `CatalogEventDetail`, `validateTicketSelection` como contrato de servidor, `formatUsd` y `buttonVariants`.
- Produces: selector client-side con cantidades por tipo, `min=0`, `max=min(disponibles, maxPorOrden)`, resumen de selección y enlace a `/carrito/` con identificadores públicos; T08 revalidará todo en servidor.

- [x] **Step 1: Write failing render/contract assertions** sobre labels, límites y deshabilitado para evento pasado/agotado.
- [x] **Step 2: Implementar el selector** sin calcular totales definitivos; mostrar precio unitario, cupos disponibles y máximo por orden.
- [x] **Step 3: Run focused tests** y verificar navegación por teclado/foco.

### Task 5: Verificación documental y visual

**Files:**
- Modify: `docs/superpowers/plans/implementation-backlog.md`
- Modify: `docs/DECISIONS.md` solo si aparece una decisión de alcance nueva

- [x] **Step 1: Run `npm test -- --run`, `npm run lint`, `npm run typecheck`** y registrar resultados.
- [x] **Step 2: Apply `supabase/migrations/20261103120000_seo_routes.sql` and seed** if the linked project is available; record exact result/blocker.
- [x] **Step 3: Run Playwright E2E** for the route/event selection when the app and public data are available; record exact result.
- [x] **Step 4: Review at desktop and 375px mobile** y run `impeccable detect --json` on changed UI files; if launcher remains unavailable, record the environmental blocker and manually apply the documented rules.
- [x] **Step 5: Update only T07** from `Pendiente` to `Terminado` if all acceptance criteria pass; otherwise leave status and record blocker/evidence.
- [x] **Step 6: Commit** with `feat: add event detail and ticket selection` and the required `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` trailer.
