# T09 — Orden de invitado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que una persona invitada cree una orden pendiente con datos de comprador e importes recalculados de forma autoritativa.

**Architecture:** El cliente de checkout envía solo identificadores y cantidades a `POST /api/checkout/orders`. El Route Handler valida esa entrada, genera un token aleatorio cuyo hash se persiste y llama con credencial privada de servidor a una RPC SQL. La RPC vuelve a leer catálogo, precios, cupos y límites antes de insertar `orders` y sus `order_items` en una sola transacción; el token en claro vive solamente en `sessionStorage` para T11.

**Tech Stack:** Next.js 16 App Router Route Handlers, React 19, TypeScript estricto, Supabase/PostgreSQL RPC con RLS, PGlite/Vitest, Playwright y Tailwind.

**Spec:** `docs/superpowers/plans/implementation-backlog.md` (T09), `docs/architecture/SYSTEM.md` §§3, 6–7, `docs/architecture/DATA.md` §§1, 3–4, `docs/checkout/DEMO_PAYMENT.md`.

## Global Constraints

- La orden contiene un único evento y solo acepta cantidades enteras entre 1 y 10 para sus propios tipos de entrada.
- Nombre/correo se validan en el Route Handler y por las restricciones de DB; subtotal, comisión y total no llegan del navegador.
- Todo importe usa centavos USD; la comisión DEMO por defecto es 5 % y el servidor usa su propia configuración.
- `SUPABASE_SERVICE_ROLE_KEY` vive únicamente en código `server-only`; nunca llega a cliente, logs, repositorio ni documentación.
- La RPC queda ejecutable solo por `service_role`; `anon` no obtiene escritura directa ni permiso de invocación.
- La orden queda `pending`: no emite boletos ni altera inventario hasta T10/T11.
- `/checkout/` es `noindex`, accesible, responsive y marca explícitamente el flujo como DEMO.

## Review Focus

- Totales, precio o porcentaje manipulados se ignoran: la DB fija importes desde `ticket_types` y los prueba.
- Tipos de otro evento, inactivos, agotados o fuera de límite no dejan una orden parcial.
- Nombre/correo inválidos no alcanzan la RPC y los errores de formulario se anuncian.
- Sin credencial privada la API falla de modo recuperable y no revela configuración.
- El token es aleatorio, se guarda solo hasheado y no aparece en query string/localStorage.

---

### Task 1: Contrato de creación y RPC protegida

**Files:**
- Create: `supabase/migrations/20261104130000_create_pending_order.sql`
- Modify: `tests/db/helpers.ts`
- Create: `tests/db/order-creation.test.ts`

**Interfaces:**
- Consumes: `orders`, `order_items`, `events`, `ticket_types` y los roles/RLS iniciales.
- Produces: `public.create_pending_order(p_event_id uuid, p_items jsonb, p_buyer_name text, p_buyer_email text, p_public_token_hash text, p_fee_percent integer)` → `order_id`, `subtotal_cents`, `fee_cents`, `total_cents`.

- [x] **Step 1: Escribir pruebas de DB fallidas**

Cubrir una orden pending con dos tipos válidos, snapshots/precios/totales, inventario intacto, permiso solo `service_role`, y rechazos atómicos por ticket ajeno/inactivo, cupo y máximo.

- [x] **Step 2: Confirmar la falla de las pruebas de DB**

Run: `npx vitest run tests/db/order-creation.test.ts --maxWorkers=1`

Expected: FAIL porque RPC y rol aún no existen.

- [x] **Step 3: Implementar la RPC y permisos mínimos**

Usar `SECURITY DEFINER` con `search_path` fijo; agregar cantidades duplicadas, validar evento publicado/no pasado, tipo/cupo/límite y cálculos enteros; revocar `EXECUTE` de `public`, otorgarlo a `service_role` y ampliar el shim PGlite.

- [x] **Step 4: Verificar las pruebas de DB**

Run: `npx vitest run tests/db/order-creation.test.ts --maxWorkers=1`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20261104130000_create_pending_order.sql tests/db/helpers.ts tests/db/order-creation.test.ts
git commit -m "feat: add pending-order RPC"
```

### Task 2: API de checkout y validación de servidor

**Files:**
- Create: `src/features/checkout/order.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/app/api/checkout/orders/route.ts`
- Create: `tests/unit/order.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: RPC `create_pending_order(...)` de Task 1 y configuración de comisión privada.
- Produces: `parseOrderRequest`, `createCheckoutToken`, `hashCheckoutToken` y `POST(request)` que responde `{ orderId, subtotalCents, feeCents, totalCents, checkoutToken }`.

- [x] **Step 1: Escribir pruebas unitarias fallidas del contrato HTTP**

Cubrir UUID de evento/tipo, cantidades 1–10, nombre recortado 2–120, correo válido y descarte de totales/comisiones extra.

- [x] **Step 2: Confirmar la falla del contrato**

Run: `npm test -- --run tests/unit/order.test.ts`

Expected: FAIL porque el contrato no existe.

- [x] **Step 3: Implementar contrato, cliente server-only y Route Handler**

Usar token base64url de 32 bytes + SHA-256 hexadecimal; requerir `SUPABASE_SERVICE_ROLE_KEY`; validar JSON y traducir fallos conocidos de RPC a 400 sin filtrar detalles de Supabase.

- [x] **Step 4: Verificar las unitarias**

Run: `npm test -- --run tests/unit/order.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/features/checkout/order.ts src/lib/supabase/server.ts src/app/api/checkout/orders/route.ts tests/unit/order.test.ts .env.example
git commit -m "feat: add guest order API"
```

### Task 3: Checkout de invitado desde carrito

**Files:**
- Create: `src/app/checkout/page.tsx`
- Create: `src/components/checkout/checkout-page.tsx`
- Modify: `src/components/checkout/cart-page.tsx`
- Modify: `src/features/checkout/cart.ts`
- Create: `tests/e2e/checkout.spec.ts`

**Interfaces:**
- Consumes: URL de selección de `cart.ts`, `POST /api/checkout/orders` y `CartSummary`.
- Produces: `/checkout/` noindex, formulario accesible de nombre/correo y token de continuación en `sessionStorage`.

- [x] **Step 1: Escribir E2E fallido del checkout de invitado**

Usar snapshot local y ruta Playwright para la API; comprobar campos etiquetados, errores anunciados, payload sin totales, resumen de respuesta, limpieza de carrito y token ausente de URL.

- [x] **Step 2: Confirmar la falla de E2E**

Run: `npm run test:e2e -- --project=chromium tests/e2e/checkout.spec.ts`

Expected: FAIL porque `/checkout/` y el CTA no existen.

- [x] **Step 3: Implementar ruta, formulario y navegación desde carrito**

Compartir codificación de selección solo con IDs/cantidades; resolver snapshot query/local, aplicar HTML + validación visible, deshabilitar durante fetch y conservar token solo en `sessionStorage` tras éxito.

- [x] **Step 4: Verificar E2E y regresión de carrito**

Run: `npm run test:e2e -- --project=chromium tests/e2e/checkout.spec.ts tests/e2e/cart.spec.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/app/checkout/page.tsx src/components/checkout/checkout-page.tsx src/components/checkout/cart-page.tsx src/features/checkout/cart.ts tests/e2e/checkout.spec.ts
git commit -m "feat: add guest checkout form"
```

### Task 4: Documentación y verificación final

**Files:**
- Modify: `docs/superpowers/plans/implementation-backlog.md`
- Modify: `docs/testing/ACCEPTANCE.md`
- Modify: `docs/DECISIONS.md` (solo si una decisión nueva resulta necesaria)

**Interfaces:**
- Consumes: evidencia de Tasks 1–3.
- Produces: T09 actualizado, con límites explícitos de T10/T11.

- [x] **Step 1: Actualizar estado y evidencia de T09**

Registrar que crea pendientes pero no confirma pago ni modifica inventario.

- [x] **Step 2: Ejecutar verificación estática y suite completa**

Run: `npm run lint; npm run typecheck; npm test -- --run`

Expected: PASS.

- [x] **Step 3: Ejecutar build y E2E completo**

Run: `npm run build; npm run test:e2e -- --project=chromium`

Expected: PASS o bloqueos ambientales documentados.

- [x] **Step 4: Revisar diff y secretos**

Run: `git diff --check; git status --short`

Expected: sin whitespace inválido, secretos ni claves versionadas.

- [x] **Step 5: Commit**

```bash
git add docs/superpowers/plans/implementation-backlog.md docs/testing/ACCEPTANCE.md docs/DECISIONS.md
git commit -m "docs: record T09 order creation evidence"
```
