# Fase 2 — Compra refinada y post-compra simulada — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el visitante vea ponentes y la caja de compra sin scroll, pague con un flujo simulado completo, no cree órdenes duplicadas y reciba un boleto simulado por correo y WhatsApp, con calendario y compartir.

**Architecture:** Lo que cambia dinero o inventario sigue en SQL (`create_pending_order`, `confirm_order`). Se añaden tres migraciones (ponentes, `request_id` + teléfono, `notification_outbox`). El token de checkout pasa a **derivarse** con HMAC del `request_id` (decisión P-2 del roadmap): así un reintento devuelve el mismo token y la Fase 3 recupera QR sin guardar tokens en claro. El panel de pago simulado es un componente reutilizable (lo usa también la Fase 4).

**Tech Stack:** Next.js App Router (Route Handlers y Server Components), Supabase (RPC, PGlite en pruebas), `qrcode`, Vitest, Playwright.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (R-06, R-09; DP-10, DP-12, DP-16; CO-01 a CO-13) · [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- Leer `node_modules/next/dist/docs/` antes de crear Route Handlers o cambiar caché (AGENTS.md).
- Precio, comisión (`DEMO_COMMISSION_PERCENT`, hoy 5 %), cupo y totales se calculan en servidor; el cliente solo muestra provisionales.
- La confirmación sigue atómica e idempotente: sin boletos duplicados ni sobreventa; pago rechazado = cero boletos y cupo intacto.
- Todo pago y envío se etiqueta «Simulado» / «Pago de demostración»; **sin campos de tarjeta**; el aviso exacto es «Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria.»
- Migraciones posteriores a `20261106100000`, con prueba en `tests/db`; no aplicar a producción sin confirmación.
- `CHECKOUT_TOKEN_SECRET`: variable solo de servidor; va en `.env.example` (sin valor real); en producción su ausencia debe fallar de forma explícita. **El responsable debe crearla en Vercel antes del despliegue.**
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Doble clic o reintento con el mismo `request_id`: una sola orden, un solo pago, el mismo token (2.6).
2. Teléfono con espacios, guiones, prefijo `+503`/`503`, letras o longitud errónea (2.6).
3. Título de evento con saltos de línea o `;`/`,` en el `.ics` no inyecta propiedades (2.9).
4. El `outbox` nunca guarda correo o teléfono completos, y `anon`/`authenticated` no pueden leerlo (2.7).
5. Evento agotado, finalizado o sin ponentes: la ficha y la barra móvil no muestran «Comprar» ni secciones vacías (2.3).

---

## Parte 2.A — Auditoría y ficha

### Tarea 2.1: Auditoría del flujo (CO-01)

**Files:**
- Create: `docs/analisis/auditoria-flujo-compra.md`

- [ ] **Step 1:** Con la app en producción local (`npm run build && npm start`), recorrer Home → categoría → ficha → carrito → checkout → confirmación en 375 px y contar clics hasta el boleto (meta del PDF: 4 clics desde la categoría).
- [ ] **Step 2:** Registrar una tabla `Fricción | Dónde | Evidencia (captura) | Decisión` contrastando con los wireframes 01–05 de la Fase 1. Puntos obligatorios: caja de compra sin scroll, total y comisión visibles antes del botón, estado agotado, ponentes, opción de iniciar sesión.
- [ ] **Step 3: Verify:** el documento tiene al menos una fila por cada pantalla y cada fricción tiene decisión (`resolver en 2.x` o `descartar` con motivo).
- [ ] **Step 4: Commit** — `git commit -m "docs: auditoría del flujo de compra"`

### Tarea 2.2: Ponentes del evento (CO-02, datos)

**Files:**
- Create: `supabase/migrations/20261109100000_event_speakers.sql`, `tests/db/event-speakers.test.ts`
- Modify: `src/features/catalog/types.ts`, `src/features/catalog/queries.ts`, `src/features/organizers/publish.ts`, `src/components/organizers/publish-event-form.tsx`, `src/features/organizers/actions.ts`, `supabase/seed.sql`, `tests/unit/publish.test.ts`, `tests/db/create-organizer-event.test.ts`

**Interfaces:**
- Produces (SQL): columna `events.speakers jsonb not null default '[]'` con función `public.is_valid_speakers(value jsonb) returns boolean` (inmutable): arreglo de ≤ 8 objetos con `name` texto de 1 a 80 caracteres y `role` texto de 0 a 120. `create_organizer_event` recreada con parámetro `p_speakers jsonb default '[]'` (leer `20261105140000_create_organizer_event.sql`: eliminar la firma anterior y recrear con los mismos permisos `security invoker` y `grant execute … to authenticated`).
- Produces (TS): `export type Speaker = { name: string; role: string }` en `types.ts`; `CatalogEvent.speakers: Speaker[]`; en `publish.ts` el campo de formulario `speakers` se arma de filas `speakerName1`…`speakerName6` y `speakerRole1`…`speakerRole6` (filas vacías se ignoran); `parsePublishForm` devuelve `speakers: Speaker[]`.

- [ ] **Step 1: Write the failing tests.**
  - `tests/db/event-speakers.test.ts`: `test('acepta hasta 8 ponentes válidos')`, `test('rechaza 9 ponentes')`, `test('rechaza un ponente sin nombre')`, `test('anon lee los ponentes de un evento publicado y no los de uno pendiente')`.
  - `tests/unit/publish.test.ts`: `test('ignora filas de ponente vacías')`, `test('rechaza un nombre de más de 80 caracteres')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/event-speakers.test.ts tests/unit/publish.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración, tipos, consulta (añadir `speakers` al `select`), parseo, formulario (seis filas fijas, sin JavaScript) y seed: `speakers` en cinco eventos DEMO con nombres claramente ficticios («Ponente DEMO 1», rol «Rol de ejemplo (DEMO)»).
- [ ] **Step 4: Run** los dos archivos, más `npx vitest run tests/db/create-organizer-event.test.ts tests/db/schema.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: ponentes del evento (migración, formulario y consulta)"`

### Tarea 2.3: Ficha con caja de compra visible (CO-02)

**Files:**
- Create: `src/components/catalog/mobile-buy-bar.tsx`, `src/components/catalog/speakers-list.tsx`, `tests/unit/buy-bar.test.ts`, `tests/e2e/event-above-fold.spec.ts`
- Modify: `src/features/catalog/event-detail.tsx`, `src/features/catalog/format.ts`

**Interfaces:**
- Produces: `export function priceFromLabel(minPriceCents: number | null, hasFree: boolean): string` en `format.ts` → `'Gratis'` si solo hay gratuitas; `'Desde $X'` con la regla de precios sin decimales (`$18`, `$10.50`); `''` si `null`.
- `MobileBuyBar(props: { label: string; available: boolean; anchorId: string })`: barra fija inferior solo bajo `md`; enlaza a `#${anchorId}`; no se renderiza si `available` es `false`.
- `SpeakersList(props: { speakers: Speaker[] })`: devuelve `null` si el arreglo está vacío.

- [ ] **Step 1: Write the failing tests.**
  - `buy-bar.test.ts`: `test('priceFromLabel muestra Gratis, Desde $18 y Desde $10.50')`, `test('la barra no se renderiza si no hay entradas')`.
  - E2E (`375×812`): `test('la primera entrada y el botón de compra se ven sin scroll')` — el selector `#entradas` tiene `boundingBox().y + height <= 812`; `test('una ficha sin ponentes no muestra la sección')`; `test('un evento agotado muestra Agotado y no la barra de compra')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/buy-bar.test.ts` y `npx playwright test tests/e2e/event-above-fold.spec.ts --project=chromium` — Expected: FAIL.
- [ ] **Step 3: Implement.** Orden de la ficha en móvil: resumen (fecha, hora, lugar, modalidad, organizador), selector de entradas con `id="entradas"`, agenda, ponentes, relacionados. Reducir la portada en móvil (relación 16:9 con altura máxima) para que el selector quede sobre el pliegue.
- [ ] **Step 4: Run** ambos y `npx vitest run tests/unit/event-detail.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: ficha con ponentes y caja de compra visible en móvil"`

---

## Parte 2.B — Checkout y pago simulado

### Tarea 2.4: Checkout en una pantalla con botón de monto (CO-03)

**Files:**
- Create: `src/features/checkout/labels.ts`, `tests/unit/checkout-labels.test.ts`
- Modify: `src/components/checkout/checkout-page.tsx`, `src/components/checkout/cart-summary.tsx`, `tests/e2e/checkout.spec.ts`

**Interfaces:**
- Produces: `export function submitLabel(totalCents: number): string` → `0` ⇒ `'Confirmar registro gratuito'`; si no, `'Pagar $' + formato + ' · pago de demostración'` (ej. `2700` ⇒ `'Pagar $27 · pago de demostración'`).

- [ ] **Step 1: Write the failing tests.** Unitaria: `test('el botón dice el monto')` con 0, 2700 y 1050 (`'Pagar $10.50 · pago de demostración'`). E2E 375 px: `test('subtotal, comisión y total se ven antes del botón de pago')` y `test('el botón de pago está dentro del primer scroll tras llenar los datos')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/checkout-labels.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `submitLabel` y usarla en el botón principal; mover el desglose (subtotal, comisión, total) sobre el botón; mantener nombre y correo obligatorios.
- [ ] **Step 4: Run** unitaria y `npx playwright test tests/e2e/checkout.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: checkout con desglose y botón con monto"`

### Tarea 2.5: Panel de pago simulado reutilizable (CO-13)

**Files:**
- Create: `src/features/checkout/payment-flow.ts`, `src/components/payments/simulated-payment-panel.tsx`, `tests/unit/payment-flow.test.ts`
- Modify: `src/components/checkout/payment-step.tsx` (pasa a usar el panel), `src/features/ticketing/confirmation.ts` (añadir datos de comprobante), `src/app/confirmacion/[orderId]/[token]/page.tsx` (sección «Comprobante»), `tests/e2e/checkout.spec.ts`

**Interfaces:**
- Produces en `payment-flow.ts`:
  - `export type PaymentStep = 'review' | 'method' | 'processing' | 'result'`
  - `export type PaymentFlowEvent = 'continue' | 'back' | 'submitted' | 'settled'`
  - `export function nextPaymentStep(step: PaymentStep, event: PaymentFlowEvent): PaymentStep` — `review --continue--> method`, `method --back--> review`, `method --submitted--> processing`, `processing --settled--> result`; cualquier otra combinación devuelve el paso actual.
  - `export type Receipt = { orderNumber: string; paymentId: string | null; methodLabel: 'Pago de demostración'; status: 'approved' | 'rejected' | 'free'; subtotalCents: number; feeCents: number; totalCents: number; paidAt: string | null }`
  - `export function buildReceipt(input: { order: { id: string; status: string; subtotalCents: number; feeCents: number; totalCents: number; confirmedAt: string | null }; payment: { id: string; status: string } | null }): Receipt`
- `SimulatedPaymentPanel(props: { amountCents: number; summary: { label: string; amountCents: number }[]; onDecision: (decision: PaymentDecision) => Promise<{ ok: boolean; message?: string }> })`: pasos «Resumen» → «Resultado de la simulación» (radio `Simular pago aprobado` / `Simular pago rechazado`) → «Procesando pago de demostración…» → resultado. Muestra el aviso de modo demostración en cada paso. `PaymentDecision` viene de `src/features/checkout/payment.ts`.

- [ ] **Step 1: Write the failing test** `tests/unit/payment-flow.test.ts`: `test('recorre review, method, processing y result')`, `test('un evento inválido no cambia de paso')`, `test('buildReceipt marca rejected cuando el pago es demo_rejected')`, `test('buildReceipt de orden gratis no tiene paymentId')`. E2E: `test('el comprador recorre los pasos y ve el comprobante aprobado')` y `test('un pago rechazado muestra el comprobante rechazado y cero boletos')` (con la API simulada).
- [ ] **Step 2: Run** `npx vitest run tests/unit/payment-flow.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Mantener la API actual `POST /api/checkout/orders/[orderId]/confirm/` y su clave `demo:{orderId}`. Nada de campos de tarjeta. La sección «Comprobante» de la confirmación incluye número de orden, método, estado, importes y botón de imprimir (el existente).
- [ ] **Step 4: Run** unitaria, `npx vitest run tests/unit/payment.test.ts` y `npx playwright test tests/e2e/checkout.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: flujo de pago simulado completo con comprobante"`

### Tarea 2.6: Orden idempotente, token derivado y teléfono (CO-11)

**Files:**
- Create: `supabase/migrations/20261109110000_order_request_id_and_phone.sql`, `src/features/checkout/token.ts`, `tests/unit/checkout-token.test.ts`
- Modify: `src/app/api/checkout/orders/route.ts`, `src/features/checkout/order.ts`, `src/components/checkout/checkout-page.tsx`, `.env.example`, `tests/db/order-creation.test.ts`, `tests/unit/order.test.ts`

**Interfaces:**
- Produces (SQL): `orders.checkout_request_id uuid unique`, `orders.buyer_phone text` con check `buyer_phone is null or buyer_phone ~ '^\+503[0-9]{8}$'`; `create_pending_order` recreada (leer `20261104130000_create_pending_order.sql` y `20261105160000_revoke_anon_pending_order.sql`: eliminar la firma anterior, mantener `SECURITY DEFINER`, solo `service_role`) con parámetros nuevos `p_request_id uuid` y `p_buyer_phone text default null`. Si ya existe una orden con ese `p_request_id`: devolver **esa** orden sin crear otra; si el evento del reintento es distinto, `raise exception` con `errcode '22023'`.
- Produces (TS) en `token.ts`: `export function deriveCheckoutToken(secret: string, requestId: string): string` — HMAC-SHA256(secret, requestId) en base64url sin relleno (43 caracteres, cumple `checkoutTokenPattern`); lanza si `secret` está vacío.
- En `order.ts`: `export function normalizeSvPhone(input: string): string | null` — acepta 8 dígitos locales con espacios o guiones, o con prefijo `+503`/`503`; devuelve `'+503' + 8 dígitos` o `null`.
- La ruta `POST /api/checkout/orders` acepta `requestId` (uuid) y `phone` opcional; el token que devuelve es `deriveCheckoutToken(process.env.CHECKOUT_TOKEN_SECRET, requestId)` y a la base va solo su SHA-256 como hoy. El cliente genera `crypto.randomUUID()` una vez por sesión de checkout (`sessionStorage`, clave `ticketera-c3-checkout-request`) y lo reutiliza en reintentos.

- [ ] **Step 1: Write the failing tests.**
  - `checkout-token.test.ts`: `test('es determinista')`, `test('tiene 43 caracteres base64url')`, `test('cambia con otro request id y con otro secreto')`, `test('lanza con secreto vacío')`.
  - `order.test.ts`: `test('normaliza 7777-1234, 7777 1234, +503 7777 1234 y 50377771234 a +50377771234')`, `test('rechaza letras y longitudes distintas de 8 dígitos')`.
  - `order-creation.test.ts`: `test('el mismo request id devuelve la misma orden y una sola fila')`, `test('un request id con otro evento se rechaza')`, `test('un teléfono inválido se rechaza')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/checkout-token.test.ts tests/unit/order.test.ts tests/db/order-creation.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración, `token.ts`, `normalizeSvPhone`, ruta y formulario (campo «Teléfono para WhatsApp (opcional)», `type="tel"`, `autocomplete="tel"`). Añadir `CHECKOUT_TOKEN_SECRET=` (vacío) a `.env.example` con comentario.
- [ ] **Step 4: Run** los tres archivos, `npx vitest run tests/db/privileges.test.ts tests/db/confirm-order.test.ts` — Expected: PASS (permisos y confirmación intactos).
- [ ] **Step 5: Commit** — `git commit -m "feat: orden idempotente por request id, token derivado y teléfono opcional"`

---

## Parte 2.C — Post-compra simulada

### Tarea 2.7: Outbox y boleto simulado por correo y WhatsApp (CO-04)

**Files:**
- Create: `supabase/migrations/20261109120000_notification_outbox.sql`, `src/features/ticketing/notifications.ts`, `src/components/checkout/simulated-delivery.tsx`, `tests/unit/notifications.test.ts`, `tests/db/notification-outbox.test.ts`
- Modify: `src/app/api/checkout/orders/[orderId]/confirm/route.ts`, `src/features/ticketing/confirmation.ts`, `src/app/confirmacion/[orderId]/[token]/page.tsx`

**Interfaces:**
- Produces (SQL): `notification_outbox(id uuid pk default gen_random_uuid(), order_id uuid not null references orders on delete cascade, channel text check in ('email','whatsapp'), template text check in ('ticket','reminder_24h'), destination_masked text not null, status text not null default 'simulated' check in ('simulated','cancelled'), scheduled_for timestamptz not null default now(), created_at timestamptz not null default now(), unique (order_id, channel, template))`; RLS habilitado; `revoke all` a `anon, authenticated`; solo `service_role` lee y escribe.
- Produces (TS) en `notifications.ts`:
  - `export function maskEmail(email: string): string` → `'a***@gmail.com'` (primera letra, tres asteriscos, dominio)
  - `export function maskPhone(phone: string): string` → `'+503 ****-5678'`
  - `export type OutboxRow = { orderId: string; channel: 'email' | 'whatsapp'; template: 'ticket' | 'reminder_24h'; destinationMasked: string; scheduledFor: Date }`
  - `export function buildTicketNotifications(input: { orderId: string; email: string; phone: string | null; now: Date }): OutboxRow[]` — fila `ticket` por correo siempre y por WhatsApp solo con teléfono; `scheduledFor = now`.
  - `export async function enqueueNotifications(rows: OutboxRow[]): Promise<void>` — `upsert` con `ignoreDuplicates` usando el cliente de servidor; no lanza si falla (registra el error): un fallo del outbox nunca revierte una compra.
- La ruta de confirmación llama a `enqueueNotifications` solo cuando el resultado es `free` o `demo_approved`, y nunca en reintentos (`alreadyProcessed`).

- [ ] **Step 1: Write the failing tests.**
  - `notifications.test.ts`: `test('maskEmail oculta el usuario')`, `test('maskPhone deja los últimos cuatro dígitos')`, `test('sin teléfono solo hay fila de correo')`, `test('con teléfono hay dos filas')`, `test('ninguna fila contiene el correo ni el teléfono completos')`.
  - `notification-outbox.test.ts`: `test('la clave única evita duplicados')`, `test('anon y authenticated no pueden leer')`, `test('service_role puede insertar')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/notifications.test.ts tests/db/notification-outbox.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración, módulo, llamada en la ruta y el componente `SimulatedDelivery` que lista «Boleto enviado a a***@gmail.com · Simulado» (y WhatsApp si existe) bajo los boletos en la página de confirmación. `confirmation.ts` lee el outbox con el cliente de servidor solo tras validar el token del enlace.
- [ ] **Step 4: Run** ambos archivos y `npx vitest run tests/db/confirm-order.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: outbox y boleto simulado por correo y WhatsApp"`

### Tarea 2.8: Recordatorio de 24 horas simulado (CO-07)

**Files:**
- Modify: `src/features/ticketing/notifications.ts`, `src/app/api/checkout/orders/[orderId]/confirm/route.ts`, `tests/unit/notifications.test.ts`

**Interfaces:**
- Consumes: `OutboxRow`, `buildTicketNotifications` (2.7).
- Produces: `export function buildReminderNotifications(input: { orderId: string; email: string; phone: string | null; eventStartsAt: Date; now: Date }): OutboxRow[]` — filas `reminder_24h` con `scheduledFor = eventStartsAt − 24 h`; lista vacía si ese instante ya pasó.

- [ ] **Step 1: Write the failing test:** `test('evento en 48 h crea recordatorio a las 24 h')`, `test('evento en 10 h no crea recordatorio')`, `test('el recordatorio por WhatsApp solo existe con teléfono')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/notifications.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** la función y encolarla en la misma llamada de 2.7 (el boleto y el recordatorio van en un solo `enqueueNotifications`). Sin job real: la fila es el registro simulado.
- [ ] **Step 4: Run** el archivo — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: recordatorio simulado 24 horas antes"`

### Tarea 2.9: Agregar al calendario (CO-05)

**Files:**
- Create: `src/features/ticketing/calendar.ts`, `src/app/calendario/[eventId]/route.ts`, `tests/unit/calendar.test.ts`, `tests/e2e/calendar.spec.ts`
- Modify: `src/features/catalog/event-detail.tsx`, `src/app/confirmacion/[orderId]/[token]/page.tsx` (enlace «Agregar al calendario»), `src/lib/seo/indexing.ts` (añadir `/calendario/` a `privatePaths`), `tests/unit/indexing.test.ts`

**Interfaces:**
- Produces: `export function buildEventIcs(event: { id: string; title: string; startsAt: Date; endsAt: Date | null; location: string | null; url: string }): string` — RFC 5545: líneas terminadas en `\r\n`, plegado a 75 octetos, `UID:{id}@ticketera.c3.com.sv`, `DTSTAMP`/`DTSTART`/`DTEND` en UTC (`YYYYMMDDTHHMMSSZ`; si `endsAt` es `null`, una hora después), texto escapado (`\\`, `\;`, `\,` y saltos de línea como `\n`).
- La ruta `GET /calendario/[eventId]/` valida uuid, lee el evento publicado con la clave pública y responde `text/calendar; charset=utf-8` con `Content-Disposition: attachment; filename="evento.ics"`; 404 para eventos no publicados o inexistentes.

- [ ] **Step 1: Write the failing tests.** Unitarias: `test('empieza y termina con VCALENDAR y usa CRLF')`, `test('escapa comas, punto y coma y saltos de línea del título')`, `test('un título con salto de línea no crea una propiedad nueva')`, `test('sin hora de fin dura una hora')`, `test('pliega líneas de más de 75 octetos')`. E2E: `test('descarga el .ics de un evento publicado')` y `test('404 para un evento inexistente')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/calendar.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** el módulo y la ruta (política de caché según la guía de Next 16 para Route Handlers). Sin datos del comprador en el archivo.
- [ ] **Step 4: Run** unitarias, `npx vitest run tests/unit/indexing.test.ts` y `npx playwright test tests/e2e/calendar.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: agregar al calendario con archivo .ics"`

### Tarea 2.10: Compartir por WhatsApp (CO-06)

**Files:**
- Create: `src/features/ticketing/share.ts`, `src/components/catalog/share-button.tsx`, `tests/unit/share.test.ts`
- Modify: `src/features/catalog/event-detail.tsx`, `src/app/confirmacion/[orderId]/[token]/page.tsx`

**Interfaces:**
- Produces: `export function buildWhatsAppShareUrl(input: { title: string; startsAt: Date; eventUrl: string }): string` → `https://wa.me/?text=` + `encodeURIComponent('{title} · {fecha en es-SV, hora de El Salvador} · {eventUrl}')`.
- `ShareButton(props: { title: string; startsAt: string; eventUrl: string })`: enlace con `target="_blank"` y `rel="noopener noreferrer"`, icono `share` y texto «Compartir por WhatsApp».

- [ ] **Step 1: Write the failing test:** `test('el enlace empieza con https://wa.me/?text=')`, `test('el texto incluye título, fecha y enlace del evento')`, `test('en la confirmación se comparte la URL del evento y no la del pedido')` (el componente de confirmación recibe `eventUrl`; comprobar que ningún `href` contiene `/confirmacion/`).
- [ ] **Step 2: Run** `npx vitest run tests/unit/share.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** el módulo y el botón en la ficha y en la confirmación.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: compartir evento por WhatsApp"`

---

## Parte 2.D — Errores, E2E y documentos

### Tarea 2.11: Estados de error del checkout (CO-08)

**Files:**
- Create: `src/features/checkout/errors.ts`, `tests/unit/checkout-errors.test.ts`
- Modify: `src/components/checkout/payment-step.tsx`, `src/components/checkout/checkout-page.tsx`, `tests/e2e/checkout.spec.ts`

**Interfaces:**
- Produces: `export type CheckoutErrorView = { title: string; detail: string; action: 'retry' | 'back-to-event' | 'none' }`; `export function checkoutErrorView(code: string | null, status: number): CheckoutErrorView` — sin cupo (`sold_out`) ⇒ «Ya no hay entradas disponibles», acción `back-to-event`; evento cerrado o no publicado ⇒ «Este evento ya no está disponible», `back-to-event`; 5xx o desconocido ⇒ «No pudimos completar la compra. Intenta de nuevo», `retry`. Leer los códigos reales que devuelve `src/app/api/checkout/orders/route.ts` y la ruta de confirmación y usar esos literales.

- [ ] **Step 1: Write the failing test:** `test('sin cupo ofrece volver al evento')`, `test('error del servidor ofrece reintentar')`, `test('un código desconocido nunca expone el mensaje técnico')`. E2E (API simulada): `test('un error 503 muestra Reintentar y el reintento funciona')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/checkout-errors.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** la función y mostrar `CheckoutErrorView` en el paso de pago, anunciado con `role="alert"`.
- [ ] **Step 4: Run** unitaria y `npx playwright test tests/e2e/checkout.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: estados de error claros en el checkout"`

### Tarea 2.12: E2E final y documentos (CO-09, CO-10, CO-12)

**Files:**
- Modify: `tests/e2e/purchase-flow.spec.ts`, `tests/e2e/purchase-flow-real.spec.ts`, `docs/checkout/DEMO_PAYMENT.md`, `docs/architecture/SYSTEM.md`, `docs/architecture/DATA.md`, `docs/superpowers/plans/implementation-backlog.md`

- [ ] **Step 1:** Actualizar los tres escenarios (gratis, aprobado, rechazado) para pasar por los pasos del panel y comprobar comprobante, «Boleto enviado… · Simulado», enlace `.ics` y botón de WhatsApp, en 1280 px y 375 px.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/purchase-flow.spec.ts --project=chromium` — Expected: PASS (API simulada, sin escrituras).
- [ ] **Step 3 (solo con confirmación del responsable, escribe órdenes reales):** `REAL_PURCHASE=1 npx playwright test tests/e2e/purchase-flow-real.spec.ts --project=chromium` — Expected: 4/4; anotar los ids de orden.
- [ ] **Step 4:** Actualizar DEMO_PAYMENT.md (pasos del panel, comprobante, outbox), SYSTEM.md (derivación del token, `request_id`, rutas `/calendario/…`) y DATA.md (`speakers`, `checkout_request_id`, `buyer_phone`, `notification_outbox`).
- [ ] **Step 5: Run** `npm test && npm run lint && npm run typecheck && npm run build` — Expected: todo verde. **Commit** — `git commit -m "test: E2E del flujo de compra refinado y documentos"`

---

## Cierre de la fase

- [ ] Migraciones `20261109100000`, `20261109110000` y `20261109120000` listas; **aplicarlas en producción solo tras confirmación** y con `CHECKOUT_TOKEN_SECRET` creada en Vercel.
- [ ] PR de `codex/fase-2-compra` con la tabla de fricciones de 2.1 resuelta y la evidencia en el backlog.
