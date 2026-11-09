# Fase 3 — Cuentas de comprador y alta de organizadores — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cuenta opcional de comprador (registro, inicio de sesión, recuperación de contraseña, perfil con universidad, «Mis boletos» con historial), reclamo de una compra hecha como invitado y alta de organizadores por el administrador. La compra de invitado no cambia.

**Architecture:** Se reutiliza Supabase Auth y las cookies httpOnly de T14. Un disparador en `auth.users` crea el perfil con rol `buyer` (el rol **nunca** se lee de metadatos). Las órdenes de cuenta se enlazan con `orders.buyer_user_id`; «Mis boletos» lee con una RPC `my_orders()` del propio usuario y deriva el token de cada orden con `deriveCheckoutToken` (Fase 2) para mostrar QR sin guardar tokens en claro.

**Tech Stack:** Supabase Auth + Postgres (PGlite en pruebas), `@supabase/supabase-js` 2.110, Next.js Server Actions, Vitest, Playwright.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (R-05; DP-01; CP-01 a CP-09) · [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- Leer `node_modules/next/dist/docs/` (Server Actions, `proxy`, cookies) y la guía de recuperación de contraseña de Supabase Auth antes de codificar (AGENTS.md).
- El rol se comprueba en servidor y en SQL; nunca viene del navegador ni de `user_metadata`.
- `service_role` solo en código de servidor; nunca se repite una contraseña en documentos, commits ni mensajes. Cuentas de prueba se crean con `scripts/seed-demo-users.mjs` leyendo contraseñas de variables de entorno.
- Migraciones posteriores a `20261109120000`, con pruebas en `tests/db`; no aplicar a producción sin confirmación.
- El enlace de recuperación y el aviso de «correo de confirmación» dependen de ajustes del proyecto Supabase (confirmación de correo, plantilla). **El plan no los cambia**; el flujo debe funcionar con la confirmación activada y desactivada.
- Datos personales mínimos: nombre, correo, universidad opcional; consentimiento de correo desactivado por defecto.
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Registro con `user_metadata.role = 'admin'` o llamada directa a la API: el perfil siempre queda `buyer` (3.1).
2. Un comprador intenta ver órdenes, QR o perfil de otro usuario, por RPC o por URL (3.1, 3.4).
3. «Olvidé mi contraseña» responde igual exista o no el correo (3.2).
4. Reclamar una orden de invitado con el correo de otra persona falla (3.5).
5. Parámetro `next` con `//otro-sitio.com` o `https://…` nunca redirige fuera del sitio (3.3).

---

## Parte 3.A — Datos y autenticación

### Tarea 3.1: Migración de perfiles de comprador (CP-02, CP-07)

**Files:**
- Create: `supabase/migrations/20261110100000_buyer_profiles.sql`, `tests/db/buyer-profiles.test.ts`
- Modify: `tests/db/auth-roles.test.ts`, `tests/db/rls.test.ts` (solo si el cambio de check de rol los rompe)

**Interfaces:**
- Produces (SQL):
  - `profiles.role` admite `'buyer'` además de `'organizer'` y `'admin'`; el valor por defecto pasa a `'buyer'`.
  - Columnas nuevas en `profiles`: `university text` (≤ 80 caracteres o nulo), `marketing_opt_in boolean not null default false`, `consented_at timestamptz`.
  - Disparador `public.handle_new_user()` (`SECURITY DEFINER`, `search_path = public, pg_temp`) tras insertar en `auth.users`: crea `profiles(id, role = 'buyer', display_name = parte local del correo)`. **No lee metadatos.**
  - `orders.buyer_user_id uuid references auth.users(id) on delete set null` con índice.
  - `public.my_orders() returns table (order_id uuid, status text, total_cents integer, created_at timestamptz, checkout_request_id uuid, event_id uuid, event_title text, event_starts_at timestamptz)` — `SECURITY DEFINER`, filtra `buyer_user_id = auth.uid()`; `revoke` a `anon`; `grant execute` a `authenticated`.
- Antes de escribir: leer `20261102120000_init_marketplace_schema.sql` (políticas de `profiles`, check de rol) y `tests/db/auth-roles.test.ts`. La política de actualización debe permitir cambiar `display_name`, `university`, `marketing_opt_in` y **no** `role`.

- [ ] **Step 1: Write the failing tests** `tests/db/buyer-profiles.test.ts`:
  - `test('al crear un usuario se crea un perfil buyer')`.
  - `test('los metadatos no elevan el rol')` — insertar en `auth.users` con `raw_user_meta_data = '{"role":"admin"}'` (agregar la columna al shim solo si el shim de `helpers.ts` no la tiene) y comprobar `role = 'buyer'`.
  - `test('un usuario no puede cambiar su propio rol')`.
  - `test('un usuario actualiza su universidad y su consentimiento')`.
  - `test('my_orders devuelve solo las órdenes propias')` y `test('anon no puede ejecutar my_orders')`.
  - `test('universidad de más de 80 caracteres se rechaza')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/buyer-profiles.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** la migración. Ajustar el shim de PGlite en `tests/db/helpers.ts` solo si hace falta (columna `raw_user_meta_data jsonb`).
- [ ] **Step 4: Run** el archivo y `npx vitest run tests/db` — Expected: PASS (roles, RLS y privilegios intactos).
- [ ] **Step 5: Commit** — `git commit -m "feat: perfiles de comprador, disparador de alta y my_orders"`

### Tarea 3.2: Registro, inicio de sesión y recuperación de contraseña (CP-08)

**Files:**
- Create: `src/features/auth/validation.ts`, `src/app/registro/page.tsx`, `src/app/recuperar/page.tsx`, `src/app/recuperar/nueva/page.tsx`, `src/components/auth/register-form.tsx`, `src/components/auth/recover-form.tsx`, `src/components/auth/new-password-form.tsx`, `tests/unit/auth-validation.test.ts`
- Modify: `src/lib/auth/supabase-auth.ts`, `src/features/auth/actions.ts`, `src/app/ingresar/page.tsx` (enlaces a registro y recuperación, y «Continuar como invitado»), `src/lib/seo/indexing.ts`, `tests/unit/indexing.test.ts`

**Interfaces:**
- Produces en `validation.ts`:
  - `export type RegistrationInput = { email: string; password: string; displayName: string; acceptsPrivacy: boolean }`
  - `export function validateRegistration(input: unknown): { valid: true; data: RegistrationInput } | { valid: false; errors: Partial<Record<keyof RegistrationInput, string>> }` — correo con formato válido y ≤ 254 caracteres; contraseña de 8 a 72 caracteres; nombre de 2 a 80; `acceptsPrivacy` debe ser `true`.
  - `export function validateNewPassword(input: unknown): { valid: true; data: { password: string } } | { valid: false; error: string }`.
- Produces en `supabase-auth.ts` (leer primero el archivo para seguir su estilo y su manejo de cookies): `signUpWithPassword(input: RegistrationInput): Promise<{ status: 'signed-in' | 'confirm-email' | 'error'; message?: string }>` (con `session` nula devuelve `confirm-email`); `requestPasswordReset(email: string): Promise<void>` (nunca revela si el correo existe); `updatePasswordWithRecovery(accessToken: string, password: string): Promise<{ ok: boolean }>`.
- Server Actions en `actions.ts`: `registerAction(formData)`, `requestResetAction(formData)`, `setNewPasswordAction(formData)`. El texto de «recuperar» es siempre «Si el correo existe, te enviamos un enlace para cambiar la contraseña.»
- `privatePaths` añade `/registro/`, `/recuperar/`, `/cuenta/`.

- [ ] **Step 1: Write the failing tests** `tests/unit/auth-validation.test.ts`: `test('acepta un registro válido')`, `test('rechaza contraseña de 7 caracteres y de 73')`, `test('rechaza correo sin dominio')`, `test('exige aceptar la privacidad')`, `test('rechaza nombre de 1 carácter')`, `test('validateNewPassword aplica el mismo largo')`. En `indexing.test.ts`: `test('privatePaths incluye registro, recuperar y cuenta')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/auth-validation.test.ts tests/unit/indexing.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** validación, funciones de Supabase, acciones y páginas (formularios con etiquetas visibles, errores anunciados, `autocomplete` correcto, aviso «Tu contraseña no se comparte con nadie» no hace falta). La página `/recuperar/nueva/` es un componente cliente que lee el token de recuperación del fragmento de la URL y lo envía a `setNewPasswordAction`; consultar la guía de Supabase para el formato exacto del fragmento.
- [ ] **Step 4: Run** los dos archivos y `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: registro, recuperación de contraseña y validaciones de cuenta"`

### Tarea 3.3: Control de acceso por rol y destino seguro (CP-03, base)

**Files:**
- Modify: `src/lib/auth/access.ts`, `src/lib/auth/require-role.ts`, `src/lib/auth/session-gate.ts`, `src/proxy.ts`, `src/features/auth/actions.ts`, `tests/unit/auth-access.test.ts`
- Create: `src/lib/auth/next-path.ts`, `tests/unit/next-path.test.ts`

**Interfaces:**
- Produces: `export type AppRole = 'buyer' | 'organizer' | 'admin'`; `export function landingPathForRole(role: AppRole): string` → `'/mis-boletos/'`, `'/panel/'`, `'/admin/'`.
- `export function safeNextPath(next: string | null | undefined, fallback: string): string` en `next-path.ts`: acepta solo rutas internas que empiezan por `/`, no por `//` ni `/\`, sin esquema; si no, devuelve `fallback`.
- `requireRole` acepta `'buyer'` y deja a organizador y administrador entrar a `/mis-boletos/` y `/cuenta/`; `/panel/` solo organizador y administrador; `/admin/` solo administrador. El `proxy` incluye `/mis-boletos` y `/cuenta` en su `matcher`.
- Leer antes `src/lib/auth/access.ts` y `tests/unit/auth-access.test.ts` y extender sus tablas en lugar de duplicarlas.

- [ ] **Step 1: Write the failing tests.** `next-path.test.ts`: `test('acepta /checkout/')`, `test('rechaza //evil.com')`, `test('rechaza https://evil.com')`, `test('rechaza /\\evil.com')`, `test('devuelve el fallback si es nulo')`. `auth-access.test.ts`: `test('comprador no entra a /panel/ ni /admin/')`, `test('comprador entra a /mis-boletos/')`, `test('landingPathForRole por rol')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/next-path.test.ts tests/unit/auth-access.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Después de iniciar sesión redirigir a `safeNextPath(next, landingPathForRole(role))`.
- [ ] **Step 4: Run** ambos archivos y `npx vitest run tests/unit/auth-cookies.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: acceso por rol con comprador y redirección segura"`

---

## Parte 3.B — Pantallas de cuenta

### Tarea 3.4: «Mis boletos» y cuenta (CP-03, CP-05, CP-07)

**Files:**
- Create: `src/app/mis-boletos/page.tsx`, `src/app/cuenta/page.tsx`, `src/features/accounts/orders.ts`, `src/features/accounts/profile.ts`, `src/components/accounts/orders-list.tsx`, `src/components/accounts/profile-form.tsx`, `tests/unit/account-orders.test.ts`, `tests/unit/account-profile.test.ts`, `tests/e2e/account.spec.ts`
- Modify: `src/components/layout/site-header.tsx` (zona de cuenta: «Mis boletos» y «Mi cuenta» para sesión activa), `scripts/seed-demo-users.mjs` (añadir una cuenta compradora de demostración leyendo su contraseña de una variable de entorno)

**Interfaces:**
- Consumes: `deriveCheckoutToken` (Fase 2), RPC `my_orders()` (3.1).
- Produces en `orders.ts`: `export type AccountOrder = { orderId: string; status: 'pending' | 'confirmed' | 'failed' | 'cancelled'; totalCents: number; createdAt: string; eventTitle: string; eventStartsAt: string; confirmationPath: string }`; `export function toAccountOrder(row: MyOrdersRow, secret: string): AccountOrder` — `confirmationPath = '/confirmacion/{orderId}/{deriveCheckoutToken(secret, row.checkout_request_id)}/'`; `export async function listMyOrders(): Promise<AccountOrder[]>` (cliente con la sesión del usuario).
- Produces en `profile.ts`: `export function validateProfile(input: unknown)` → `{ valid: true; data: { displayName: string; university: string | null; marketingOptIn: boolean } } | { valid: false; errors: … }` (nombre 2–80, universidad ≤ 80 o vacía ⇒ `null`); `export async function updateProfileAction(formData: FormData)` (Server Action: `consented_at` se fija al activar el consentimiento y se borra al desactivarlo).

- [ ] **Step 1: Write the failing tests.** `account-orders.test.ts`: `test('construye la ruta de confirmación con el token derivado')`, `test('ordenes sin request id no generan enlace')` (devuelve `confirmationPath: ''`), `test('orden fallida se muestra con su estado')`. `account-profile.test.ts`: `test('universidad vacía pasa a null')`, `test('rechaza nombre corto')`. E2E (`E2E_AUTH=1`, cuenta compradora sembrada): `test('sin sesión /mis-boletos/ redirige a /ingresar/')`, `test('con sesión muestra el historial y abre un boleto con QR')`, `test('un comprador no entra a /panel/')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/account-orders.test.ts tests/unit/account-profile.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Estados vacíos con texto («Aún no tienes compras» y botón «Ver eventos»). `/mis-boletos/` y `/cuenta/` llevan `noindex`. La zona de cuenta del encabezado usa `Icon` (`user`, `ticket`).
- [ ] **Step 4: Run** unitarias; E2E con `E2E_AUTH=1 npx playwright test tests/e2e/account.spec.ts --project=chromium` (requiere base real y la cuenta sembrada) — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: Mis boletos y cuenta del comprador"`

### Tarea 3.5: Checkout con sesión y reclamar compras de invitado (CP-04)

**Files:**
- Create: `supabase/migrations/20261110110000_order_buyer_link.sql`, `tests/db/order-buyer-link.test.ts`, `src/components/checkout/account-prompt.tsx`, `tests/unit/account-prompt.test.ts`
- Modify: `src/app/api/checkout/orders/route.ts`, `src/components/checkout/checkout-page.tsx`, `src/app/confirmacion/[orderId]/[token]/page.tsx`

**Interfaces:**
- Produces (SQL): `create_pending_order` recreada con parámetro `p_buyer_user_id uuid default null` que guarda `orders.buyer_user_id` (leer la versión de Fase 2, eliminar la firma anterior, mantener solo `service_role`); `public.claim_order(p_order_id uuid, p_checkout_token_hash text) returns boolean` — `SECURITY DEFINER`, solo `authenticated`: asigna `buyer_user_id = auth.uid()` **solo si** la orden no tiene dueño, el hash coincide y `lower(buyer_email) = lower(<correo del usuario en auth.users>)`; devuelve `false` en cualquier otro caso.
- TS: la ruta obtiene el id de usuario **solo de la sesión de las cookies** (nunca del cuerpo) y lo pasa a la RPC. `AccountPrompt(props: { variant: 'checkout' | 'confirmation'; signedIn: boolean })`: para invitados muestra «Crea una cuenta para ver tus boletos en Mis boletos» con enlace a `/registro/?next=…`; devuelve `null` con sesión.
- La página de confirmación, con sesión, ejecuta el reclamo con `claim_order` si la orden no tiene dueño y muestra «Guardamos esta compra en tu cuenta».

- [ ] **Step 1: Write the failing tests.** `order-buyer-link.test.ts`: `test('una orden creada con sesión queda ligada al usuario')`, `test('claim_order asigna el dueño con token y correo correctos')`, `test('claim_order falla con un correo distinto')`, `test('claim_order falla si la orden ya tiene dueño')`, `test('anon no puede ejecutar claim_order')`. `account-prompt.test.ts`: `test('no se muestra con sesión')`, `test('el enlace de registro conserva el destino')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/order-buyer-link.test.ts tests/unit/account-prompt.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** En el checkout con sesión, precargar nombre y correo (correo de solo lectura, en gris), sin quitar la opción de comprar como invitado. Un cuerpo de petición con `buyerUserId` se ignora.
- [ ] **Step 4: Run** ambos archivos, `npx vitest run tests/db/order-creation.test.ts tests/db/privileges.test.ts` y `npx playwright test tests/e2e/checkout.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: checkout con sesión y reclamo de compras de invitado"`

---

## Parte 3.C — Organizadores y documentos

### Tarea 3.6: Alta de organizadores por el administrador (CP-09)

**Files:**
- Create: `supabase/migrations/20261110120000_admin_link_organizer.sql`, `tests/db/admin-link-organizer.test.ts`, `src/app/admin/organizadores/page.tsx`, `src/features/organizers/link-actions.ts`, `src/features/organizers/link-form.ts`, `tests/unit/link-form.test.ts`
- Modify: `src/app/admin/page.tsx` (enlace a «Organizadores»), `scripts/seed-demo-users.mjs` (sin cambios de contraseñas en el repositorio)

**Interfaces:**
- Produces (SQL): `public.admin_link_organizer(p_name text, p_slug text, p_description text, p_owner_email text) returns uuid` — `SECURITY DEFINER`, solo admin (`is_admin()`), `grant execute` a `authenticated`; busca al usuario por correo en `auth.users` (error `22023` si no existe), crea `organizers(name, slug, description, owner_user_id)` (slug único y con formato `^[a-z0-9]+(-[a-z0-9]+)*$`), y si el perfil del dueño es `buyer` lo sube a `organizer` (nunca baja a un `admin`).
- Produces (TS): `export function validateOrganizerLink(input: unknown)` → nombre 3–120, slug con el formato, descripción ≤ 500, correo válido; `linkOrganizerAction(formData)` (Server Action protegida con `requireRole('admin', …)`).
- La lista de organizadores muestra el correo del dueño **enmascarado** (`maskEmail` de la Fase 2).

- [ ] **Step 1: Write the failing tests.** DB: `test('solo el administrador puede vincular')`, `test('un correo inexistente falla')`, `test('el dueño pasa de buyer a organizer')`, `test('un admin no baja de rol')`, `test('slug repetido o con formato inválido falla')`. Unitaria: `test('valida slug y correo')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/admin-link-organizer.test.ts tests/unit/link-form.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** migración, validación, acción y página.
- [ ] **Step 4: Run** ambos y `npx vitest run tests/db/review-organizer-event.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: alta de organizadores desde administración"`

### Tarea 3.7: Documentos de la fase (CP-06)

**Files:**
- Modify: `docs/product/PRD.md` (§3 personas, §7: quitar la exclusión de autenticación de comprador), `docs/architecture/DATA.md` (`profiles`, `buyer_user_id`, `my_orders`, `claim_order`, `admin_link_organizer`), `docs/architecture/SYSTEM.md` (flujo con cuenta opcional), `docs/DECISIONS.md` (decisión de token derivado y de alta de organizadores, con el siguiente número libre)

- [ ] **Step 1:** Escribir los cambios anteriores citando las decisiones D-37 (cuenta opcional) y las del plan (P-2, P-7).
- [ ] **Step 2: Verify:** `grep -n "autenticación de comprador" docs/product/PRD.md` — Expected: sin resultados que la excluyan.
- [ ] **Step 3: Commit** — `git commit -m "docs: cuentas de comprador y alta de organizadores"`

---

## Cierre de la fase

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test --project=chromium` — Expected: todo en verde (el E2E de cuenta requiere `E2E_AUTH=1` y base real).
- [ ] Migraciones `20261110100000`, `20261110110000` y `20261110120000` listas; aplicarlas en producción solo tras confirmación. Pedir al responsable que revise en el panel de Supabase la confirmación de correo y las URL de redirección de recuperación.
- [ ] PR de `codex/fase-3-cuentas`.
