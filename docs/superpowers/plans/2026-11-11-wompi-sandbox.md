# Plan v2: Wompi El Salvador en sandbox (sustituye la simulación de pagos)

**Estado (actualización del responsable, 2026-11-11):** Wompi sandbox ya está activado. Esta actualización recoge lo informado por el responsable; en esta revisión no se comprobaron independientemente las migraciones remotas, las variables de Vercel ni el resultado de una transacción de $0.01. La implementación de destacados y paquetes también usa Wompi según D-68; su estado remoto no se verificó aquí. El resto de este documento conserva el plan original y puede contener pendientes históricos, no un diagnóstico actual.

**Evidencia del trabajo anterior:** `1c936ef` implementó pagos sandbox de entradas; `cb7a15d` corrigió la lectura del importe y `e7ebbd6` incorporó destacados y paquetes. Los cambios figuran integrados mediante los PR #41, #43 y #44. La guía vigente está en `docs/checkout/DEMO_PAYMENT.md`.

**Contexto de la demo:** no hay negocio real ni cobros. La base de datos es la de producción de Supabase; Wompi es el sandbox del negocio `TicketeraC3Demo`. Las credenciales las pone el responsable directamente en Vercel.

**Fuente:** solo documentación de Wompi El Salvador (`docs.wompi.sv`). Verificado con citas textuales: firma del webhook (cabecera `wompi_hash`, HMAC-SHA256 sobre el cuerpo completo, clave = API Secret), autenticación OAuth (`https://id.wompi.sv/connect/token`), creación de enlace (`POST https://api.wompi.sv/EnlacePago`) y `monto` decimal en dólares con mínimo $0.01.

## 1. Decisiones vigentes

| # | Decisión |
|---|---|
| D-A | Supabase de producción. Las transacciones sandbox escriben en esa base; las órdenes pagadas con Wompi llevan `provider = 'wompi'`. |
| D-B | **El webhook emite los boletos** cuando verifica una transacción aprobada, y envía el correo desde ese mismo paso. Para eso el token de checkout se guarda **cifrado** (AES-256-GCM) con `CHECKOUT_TOKEN_ENCRYPTION_KEY`. Cambia D-26 (hoy solo se guarda el hash). El QR sigue derivado como en D-29. |
| D-C | Tras pagar, Wompi redirige a una **página de resultado sin secretos en la URL** (solo `?orden=<id>`). La página consulta el estado en el servidor. Desde ahí, «Ver mis boletos» → `/mis-boletos/` si hay sesión; si no, un mensaje que indica que los boletos llegaron al correo, con opción de crear cuenta o ingresar. |
| D-D | Antes de habilitar compras reales de sandbox, prueba con **$0.01** y confirmación de la unidad en el panel de Wompi. |
| D-E | Credenciales solo en Vercel (`WOMPI_APP_ID`, `WOMPI_API_SECRET`, `WOMPI_ENV=sandbox`). Nunca en URL, chat ni repositorio. |
| D-F | Órdenes pendientes **caducan a los 30 minutos**. No hay reserva de inventario, así que caducar solo marca `cancelled`. Se hace de forma perezosa al consultar la orden o al recibir el webhook. |

## 2. Punto de partida (verificado en el repo)

- Decisión de pago tomada por el comprador: `SimulatedPaymentPanel` y `decision` en `POST /api/checkout/orders/[orderId]/confirm/` (`route.ts:78`). Hoy es forjable con el token público. Para órdenes con importe se elimina.
- `confirm_order` (`supabase/migrations/20261105130000_confirm_order_ticket_ids.sql`): bloquea la orden con `FOR UPDATE`, es idempotente, descuenta inventario y valida cupos; solo `service_role`. Pagos demo: `provider = 'demo'`.
- `payments`: `provider` ∈ {demo}, `status` ∈ {demo_initiated, demo_approved, demo_rejected}, `idempotency_key` único, sin referencia externa.
- QR = HMAC(token de checkout, ticketId) (`src/features/ticketing/qr.ts`). El servidor guarda solo el hash del token.
- `src/proxy.ts`: el matcher incluye `/api/checkout/:path*` y `/mis-boletos/:path*`. El webhook queda fuera de `/api/checkout`.
- `isDemo` (`site-config.ts:20`) solo controla la etiqueta; no es guardia de entorno.

## 3. Diseño

**Flujo**
1. Compra con importe: `POST /api/checkout/orders` crea la orden `pending` (sin cambios).
2. Botón «Pagar con Wompi (sandbox)»: `POST /api/checkout/orders/[orderId]/pago/` con `checkoutToken` en el cuerpo. El servidor valida el hash, comprueba que la orden esté `pending` y no caducada, **guarda el token cifrado**, crea el enlace (`/EnlacePago`) con `identificadorEnlaceComercio = orderId`, `monto` según la unidad confirmada, `vigencia.fechaFin` = creación + 30 min, `configuracion.urlWebhook` y `urlRedirect = …/pago/resultado/?orden=<id>`. Devuelve `urlEnlace`. El navegador redirige con `location.assign`.
3. Wompi envía el webhook a `POST /api/pagos/wompi/webhook/` (fuera del matcher de `/api/checkout`).
4. Webhook: (a) lee el cuerpo **crudo**, valida `wompi_hash` con HMAC-SHA256 y comparación en tiempo constante; (b) registra el evento en `payment_webhook_events` con `unique (provider, transaction_id, estado)` y descarta duplicados; (c) **consulta la transacción por la API** con las credenciales del servidor y usa esa respuesta como fuente de verdad; (d) valida referencia = `orderId`, `monto` contra `orders.total_cents` (en la unidad confirmada) y `esProductiva`/`estaProductivo` contra `WOMPI_ENV = sandbox`; (e) si está aprobada: descifra el token, calcula hashes de QR, llama a la RPC `confirm_paid_order`, y envía el correo con `after()`; (f) si está rechazada: marca la orden `failed` con la RPC; (g) pendiente: no hace nada. Responde 200 si procesó o ya estaba procesado, 401 si la firma no cuadra.
5. Página `/pago/resultado/?orden=` (servidor): lee el estado de la orden por `orderId` (sin token) y muestra confirmada / pendiente / rechazada / cancelada. Si está pendiente y pasó el plazo de 30 minutos, la marca `cancelled` antes de mostrarla.

**Base de datos (migración nueva `20261115100000_wompi_payments.sql`, no aplicada aún)**
- `orders`: `wompi_link_id bigint`, `checkout_token_encrypted text` (nullable).
- `payments`: `provider` admite `wompi`; `status` admite `wompi_approved` y `wompi_declined`; `provider_transaction_id text unique`.
- `payment_webhook_events`: `provider`, `transaction_id`, `event_state`, `received_at`, `processed_at`, `unique (provider, transaction_id, event_state)`; RLS activo, solo `service_role`.
- RPC `confirm_paid_order(p_order_id, p_public_token_hash, p_transaction_id, p_amount_cents, p_tickets jsonb)`: solo `service_role`. Dentro de la transacción valida importe y estado pendiente, bloquea igual que `confirm_order`, inserta el pago `wompi` con su `provider_transaction_id`, descuenta cupos, emite boletos. Idempotente por `provider_transaction_id`.
- RPC `fail_paid_order(...)` para rechazo y `cancel_expired_order(...)` para caducidad. Ambas solo `service_role`.

**Código**
- `src/features/checkout/wompi/config.ts`: `readWompiConfig(env)` devuelve `null` si falta alguna variable o `WOMPI_ENV !== 'sandbox'`. Sin configuración, las compras con importe responden 503 y no se marca nada como pagado.
- `src/features/checkout/wompi/client.ts`: token OAuth en memoria con vigencia, `getAppInfo()` (`/Aplicativo`), `createPaymentLink()`, `getTransaction(id)`. Cualquier fallo se devuelve como error tipado sin cuerpo de respuesta ni secretos.
- `src/features/checkout/wompi/signature.ts`: verificación de `wompi_hash`.
- `src/features/checkout/wompi/token-crypto.ts`: AES-256-GCM con clave de 32 bytes en base64; formato `v1:iv:tag:ciphertext`.
- `src/features/checkout/wompi/settle.ts`: lógica de aprobación, rechazo y caducidad, sin HTTP, para probarla con pruebas unitarias.
- Rutas: `pago/route.ts`, `pagos/wompi/webhook/route.ts`, `pago/resultado/page.tsx`.
- Checkout: `payment-step.tsx` reemplaza `SimulatedPaymentPanel` por el botón de Wompi; la rama gratis no cambia.
- Eliminar: `src/components/payments/simulated-payment-panel.tsx`, la rama `decision` de `confirm/route.ts` para importes, `paymentOutcomeFor`/`PaymentDecision` cuando no tengan usos, y las etiquetas «(simulado)».
- Se conserva la etiqueta **DEMO** del sitio y de los pagos (la demo lo exige).

**Seguridad**
- Secretos solo en variables de servidor, sin prefijo `NEXT_PUBLIC_`.
- Ninguna confirmación depende del navegador ni de la URL de retorno.
- Webhook: firma + re-consulta; el cuerpo no decide el estado por sí solo.
- Token de checkout cifrado en reposo; la clave de cifrado vive solo en Vercel.

## 4. Pruebas

- Unitarias: firma válida, inválida y cuerpo alterado; cifrado ida y vuelta y rechazo de texto alterado; configuración sin variables o con `production`; monto distinto; referencia distinta; caducidad.
- Base: `confirm_paid_order` idempotente por transacción; doble webhook no emite dos veces; monto distinto no confirma; rechazo no consume cupo; compra gratis sin cambios.
- Sandbox real (manual, con el responsable): $0.01 aprobado, rechazado (CVV `111`), webhook duplicado, firma falsa.

## 5. Pendiente de la lectura de documentación

- Formato exacto del hash (hex o base64) y JSON completo del webhook.
- Endpoint de consulta de transacción, estados posibles y campos de monto y referencia.

Si alguno no aparece en la documentación oficial, el código no se escribe con suposiciones: se detiene y se pregunta.
