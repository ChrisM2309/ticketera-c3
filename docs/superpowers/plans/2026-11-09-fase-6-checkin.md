# Fase 6 — Check-in y post-evento — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El organizador marca la entrada de cada asistente con el QR (sin ver datos personales), consulta un reporte del evento, accede a un reporte superior si tiene paquete y recoge una encuesta post-evento simulada.

**Architecture:** Todo cambio de estado y todo agregado vive en funciones SQL `SECURITY DEFINER` con `owns_event` (el navegador nunca escribe `tickets`). Se reutiliza el hash del QR existente (`tickets.qr_token_hash`) y la tabla `notification_outbox` (Fase 2) para el aviso simulado de la encuesta.

**Tech Stack:** Postgres (PGlite en pruebas), Next.js Server Actions, Vitest, Playwright.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (DP-14; CI-01 a CI-03; Gabriela, diapositivas 7 y 17) · [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- Leer `node_modules/next/dist/docs/` (Server Actions, rutas dinámicas) antes de codificar (AGENTS.md).
- Ninguna pantalla de check-in ni de reporte muestra nombre, correo, teléfono ni token de comprador; solo conteos y estados.
- El check-in se marca **una sola vez** y de forma atómica (un único `UPDATE … WHERE checked_in_at IS NULL`).
- Un organizador solo opera sobre sus eventos (`owns_event`); el administrador puede leer reportes.
- El reporte superior exige un paquete activo (Fase 4); sin él, la función devuelve error de permiso.
- Migraciones posteriores a `20261112110000`, con pruebas en `tests/db`; no aplicar a producción sin confirmación.
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Dos dispositivos escanean el mismo boleto a la vez: solo uno recibe «checked_in», el otro «already_checked_in» (6.1).
2. Un organizador escanea el boleto de otro organizador o de otro evento suyo (6.1).
3. Ningún reporte ni exportación contiene datos de compradores (6.2, 6.3).
4. Porcentaje de no-show antes de que termine el evento: se muestra «—», no 100 % (6.2).
5. Encuesta antes del inicio del evento, repetida o con token incorrecto (6.4).

---

## Parte 6.A — Check-in

### Tarea 6.1: Check-in con QR (CI-01)

**Files:**
- Create: `supabase/migrations/20261113100000_check_in_and_reports.sql`, `tests/db/check-in.test.ts`, `src/features/ticketing/check-in.ts`, `tests/unit/check-in.test.ts`, `src/app/panel/eventos/[id]/checkin/page.tsx`, `src/features/ticketing/check-in-actions.ts`, `src/components/organizers/check-in-form.tsx`, `tests/e2e/check-in.spec.ts`
- Modify: `src/app/panel/page.tsx` (enlace «Check-in» por evento publicado)

**Interfaces:**
- Produces (SQL): `public.organizer_check_in(p_event_id uuid, p_qr_hash text) returns text` — `SECURITY DEFINER`, `search_path = public, pg_temp`, `grant execute` solo a `authenticated`; exige `owns_event(p_event_id)` (si no, `42501`); busca el boleto por `qr_token_hash`: si no existe o su orden no está `confirmed` ⇒ `'not_found'`; si pertenece a otro evento ⇒ `'wrong_event'`; si ya tiene `checked_in_at` ⇒ `'already_checked_in'`; si no, `UPDATE tickets SET checked_in_at = now() WHERE id = … AND checked_in_at IS NULL` y devuelve `'checked_in'` solo si afectó una fila (si no, `'already_checked_in'`).
- Produces (TS) en `check-in.ts`: `export function normalizeScannedCode(input: string): string | null` — recorta espacios y saltos de línea; devuelve el código tal como el QR lo codifica (leer `src/features/ticketing/qr.ts` para ver si el QR contiene solo el token derivado o una URL y extraer el token en ambos casos); `null` si queda vacío o tiene caracteres fuera de `[A-Za-z0-9_-]`; `export function hashScannedCode(code: string): string` — **la misma función hash** con la que se emitieron los boletos (importarla de `qr.ts`, no duplicarla); `export type CheckInResult = 'checked_in' | 'already_checked_in' | 'not_found' | 'wrong_event'` y `export function checkInMessage(result: CheckInResult): { tone: 'success' | 'warning' | 'error'; text: string }` — textos: «Entrada válida», «Esta entrada ya fue usada», «Código no encontrado», «Este boleto es de otro evento».
- `checkInAction(formData)`: `requireRole('organizer' | 'admin', …)`, valida uuid del evento y el código, llama a la RPC con el cliente del usuario y devuelve el resultado. Pantalla con un campo de texto (foco automático, `inputmode="text"`), resultado anunciado con `role="status"` y contadores «Emitidos» y «Con ingreso». Si el navegador soporta `BarcodeDetector`, añadir un botón opcional «Escanear con la cámara» (mejora progresiva; el campo de texto siempre funciona).

- [ ] **Step 1: Write the failing tests.** DB `check-in.test.ts`: `test('marca la entrada una sola vez')`, `test('el segundo intento devuelve already_checked_in')`, `test('otro organizador no puede escanear')`, `test('un boleto de otro evento devuelve wrong_event')`, `test('una orden no confirmada devuelve not_found')`, `test('un código inexistente devuelve not_found')`, `test('anon no puede ejecutar')`. Unitarias: `test('normalizeScannedCode recorta y acepta el token')`, `test('rechaza caracteres inválidos y vacío')`, `test('hashScannedCode coincide con el hash de emisión')`, `test('checkInMessage devuelve un texto por resultado')`. E2E (`E2E_AUTH=1`): `test('el organizador valida un boleto y el segundo intento avisa que ya fue usado')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/check-in.test.ts tests/unit/check-in.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración (incluye solo `organizer_check_in` en esta tarea), módulo, acción y página.
- [ ] **Step 4: Run** ambos archivos y `npx vitest run tests/db/confirm-order.test.ts tests/db/privileges.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: check-in del organizador con QR"`

---

## Parte 6.B — Reportes

### Tarea 6.2: Reporte del evento (CI-02)

**Files:**
- Modify: `supabase/migrations/20261113100000_check_in_and_reports.sql` (añadir la función de reporte; si la migración ya se aplicó fuera del repositorio, crear `20261113105000_event_report.sql`)
- Create: `src/features/organizers/report.ts`, `tests/unit/report.test.ts`, `src/app/panel/eventos/[id]/reporte/page.tsx`, `tests/db/event-report.test.ts`

**Interfaces:**
- Produces (SQL): `public.organizer_event_report(p_event_id uuid) returns table (issued integer, checked_in integer, subtotal_cents integer, fee_cents integer, event_ended boolean, survey_count integer, survey_average numeric)` — `SECURITY DEFINER`; permitido a dueño del evento y a `is_admin()`; cuenta boletos de órdenes `confirmed`; sin datos personales. (`survey_*` se rellena con la tarea 6.4; hasta entonces son `0` y `null`.)
- Produces (TS) en `report.ts`: `export function noShowPercent(input: { issued: number; checkedIn: number; eventEnded: boolean }): number | null` — `null` si `issued === 0` o el evento no terminó; si no, `(issued − checkedIn) / issued × 100` redondeado a un decimal; `export function formatNoShow(value: number | null): string` → `'—'` o `'12.5 %'`.
- Página `/panel/eventos/[id]/reporte/`: tarjetas «Emitidos», «Con ingreso», «No-show», «Ventas (subtotal)» y «Comisión» (importes en USD sin decimales cuando son enteros).

- [ ] **Step 1: Write the failing tests.** Unitarias `report.test.ts`: `test('no-show es null antes de que termine el evento')`, `test('no-show es null sin boletos')`, `test('calcula 12.5 con 8 emitidos y 7 ingresos')`, `test('formatNoShow muestra — y 12.5 %')`. DB `event-report.test.ts`: `test('el dueño ve los conteos de su evento')`, `test('otro organizador no puede leerlos')`, `test('el administrador sí puede')`, `test('el resultado no incluye columnas de comprador')` (comprobar los nombres de columna devueltos).
- [ ] **Step 2: Run** `npx vitest run tests/unit/report.test.ts tests/db/event-report.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** función SQL, módulo y página.
- [ ] **Step 4: Run** ambos y `npx vitest run tests/db/review-organizer-event.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: reporte del evento para el organizador"`

### Tarea 6.3: Reporte superior para paquete empresas (BM-05, reporte)

**Files:**
- Modify: `supabase/migrations/20261113100000_check_in_and_reports.sql` (o migración aparte `20261113106000_advanced_report.sql`)
- Create: `src/features/organizers/advanced-report.ts`, `tests/unit/advanced-report.test.ts`, `src/app/panel/eventos/[id]/reporte/exportar/route.ts`, `tests/db/advanced-report.test.ts`
- Modify: `src/app/panel/eventos/[id]/reporte/page.tsx`

**Interfaces:**
- Produces (SQL): `public.organizer_event_daily_issuance(p_event_id uuid) returns table (day date, issued integer, checked_in integer)` y `public.organizer_event_ticket_type_breakdown(p_event_id uuid) returns table (ticket_type_name text, issued integer, checked_in integer, subtotal_cents integer)` — ambas `SECURITY DEFINER`, solo dueño del evento con paquete `active` (`business_packages`, Fase 4) o administrador; sin paquete ⇒ error `42501`.
- Produces (TS): `export function toCsv(rows: Record<string, string | number>[]): string` — primera fila con los nombres de columna, `\r\n`, valores con comas o comillas entre comillas dobles (comillas duplicadas); `export function buildAdvancedCsv(daily: DailyRow[], breakdown: BreakdownRow[]): string` con dos secciones separadas por una línea en blanco.
- El reporte muestra las dos tablas y el botón «Descargar CSV» solo con paquete activo; sin paquete muestra «Disponible con el paquete para empresas» y enlaza a `/para-empresas/`.

- [ ] **Step 1: Write the failing tests.** DB: `test('sin paquete activo las funciones fallan')`, `test('con paquete activo devuelve filas por día y por tipo')`, `test('otro organizador no accede aunque tenga paquete')`. Unitarias: `test('toCsv escapa comas y comillas')`, `test('toCsv usa CRLF')`, `test('buildAdvancedCsv no tiene columnas de comprador')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/advanced-report.test.ts tests/unit/advanced-report.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** funciones, módulo, ruta de exportación (`Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`) y tablas.
- [ ] **Step 4: Run** ambos y `npx vitest run tests/db/business-packages.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: reporte superior con exportación para paquete empresas"`

---

## Parte 6.C — Encuesta

### Tarea 6.4: Encuesta post-evento simulada (CI-03)

**Files:**
- Create: `supabase/migrations/20261113110000_event_survey.sql`, `tests/db/event-survey.test.ts`, `src/features/ticketing/survey.ts`, `tests/unit/survey.test.ts`, `src/app/confirmacion/[orderId]/[token]/encuesta/page.tsx`, `src/components/checkout/survey-form.tsx`
- Modify: `src/features/ticketing/notifications.ts` (plantilla `survey`), `supabase/migrations/20261113110000_event_survey.sql` (ampliar el `check` de `notification_outbox.template` con `'survey'`), `src/app/api/checkout/orders/[orderId]/confirm/route.ts`, `supabase/migrations/20261113100000_check_in_and_reports.sql` o la migración del reporte (completar `survey_count` y `survey_average`), `tests/unit/notifications.test.ts`

**Interfaces:**
- Produces (SQL): `event_survey_responses(id uuid pk default gen_random_uuid(), order_id uuid not null unique references orders on delete cascade, event_id uuid not null references events, rating smallint not null check (rating between 1 and 5), comment text check (comment is null or char_length(comment) <= 500), created_at timestamptz not null default now())`; RLS habilitado sin políticas; `public.submit_survey(p_order_id uuid, p_token_hash text, p_rating smallint, p_comment text) returns text` — `SECURITY DEFINER`, ejecutable por `anon` y `authenticated`; valida el hash del token de la orden, orden `confirmed`, evento ya iniciado (`starts_at <= now()`), una sola respuesta por orden; devuelve `'ok'`, `'already_answered'`, `'too_early'` o `'invalid'` (mismo resultado para token incorrecto y orden inexistente).
- Produces (TS) en `survey.ts`: `export function validateSurvey(input: unknown): { valid: true; data: { rating: number; comment: string | null } } | { valid: false; error: string }` — calificación entera 1–5, comentario recortado ≤ 500 o `null`; `export function buildSurveyNotifications(input: { orderId: string; email: string; phone: string | null; eventEndsAt: Date }): OutboxRow[]` — fila `survey` (correo y WhatsApp si hay teléfono) con `scheduledFor = eventEndsAt + 2 h` (**simulada**, igual que el recordatorio).
- Página `/confirmacion/[orderId]/[token]/encuesta/`: formulario de 1–5 estrellas (botones con `aria-pressed`) y comentario opcional; antes del inicio del evento muestra «La encuesta se abre cuando empieza el evento». El reporte del organizador (6.2) muestra solo `survey_count` y `survey_average` (sin comentarios).

- [ ] **Step 1: Write the failing tests.** DB: `test('antes del inicio devuelve too_early')`, `test('token incorrecto devuelve invalid')`, `test('una orden no confirmada devuelve invalid')`, `test('una sola respuesta por orden')`, `test('calificación 0 o 6 se rechaza')`, `test('el organizador ve el promedio y no los comentarios')`, `test('anon no puede leer las respuestas')`. Unitarias: `test('validateSurvey acepta 1 a 5')`, `test('recorta y limita el comentario')`, `test('la notificación de encuesta es 2 h después del fin')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/event-survey.test.ts tests/unit/survey.test.ts tests/unit/notifications.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración, validación, página, plantilla y encolado (en la misma llamada de 2.7 y 2.8).
- [ ] **Step 4: Run** los tres archivos y `npx vitest run tests/db/notification-outbox.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: encuesta post-evento simulada"`

---

## Cierre de la fase

- [x] `npm test` (656/656), `npm run lint`, `npm run typecheck`, `npm run build` pasan. Playwright general: 73 passed, 19 skipped, 0 failed. E2E autenticado de check-in requiere fixtures; compra real parcial creó una orden y falló al verificar el outbox remoto (ver ACCEPTANCE.md).
- [x] Migraciones `20261113100000`, `20261113106000` y `20261113110000` implementadas y probadas localmente; sin aplicar en producción.
- [ ] PR de `codex/fase-6-checkin`.
