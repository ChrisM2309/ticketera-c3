# Arquitectura del sistema

## 1. Arquitectura de una sola aplicación

```text
Browser (Next.js UI)
  |  lectura pública de catálogo / acciones de usuario
  v
Next.js (Vercel, App Router)
  - Server Components (SEO, catálogo)
  - Client Components (filtros, carrito, formulario)
  - Server Actions / Route Handlers (mutaciones)
  - DemoPaymentProvider (sin cobro externo)
  - QR ticket issuer
  |
  v
Supabase
  - PostgreSQL: taxonomía, eventos, boletos y órdenes
  - Auth: cuentas organizador/admin
  - Storage: imágenes de eventos (revisadas)
  - RLS: permisos por tabla
```

**No crear** un servidor Express adicional, microservicios, GraphQL propio ni dependencias de pago en v1.

## 2. Límites de seguridad

- Lectura pública solo de eventos publicados; nunca exponer emails de asistentes o pedidos.
- Escritura de órdenes, pagos y tickets solamente mediante lógica servidor con validaciones y transacción DB.
- Organizador autenticado ve sus propios eventos y métricas agregadas sin correos completos si no son necesarios.
- Administrador comprobado en servidor; no confiar en un rol editable desde el navegador.
- RLS activo; las funciones privilegiadas deben implementar controles explícitos y mínimo permiso.

## 3. Flujo comprador

`Home → Categoría → Evento → Carrito → Checkout → Resultado → Confirmación / boleto QR`.

1. Filtrar/buscar eventos publicados.
2. Seleccionar uno o más tipos de entrada del **mismo evento**.
3. Persistir carrito local provisional. No exponer cálculo final como fuente de verdad.
4. En checkout, servidor verifica cupo/evento/ticket types, valida invitado, recalcula precio y comisión.
5. La acción de prueba aprobada llama a una función transaccional idempotente para confirmar orden, aumentar cantidad vendida y crear N tickets.
6. La acción rechazada marca orden fallida, sin emitir tickets.
7. Registros gratis siguen mismo paso transaccional sin cobro.
8. Confirmación protegida por token difícil de adivinar y boleto descargable/print.
9. Post-compra simulado: comprobante, «Boleto enviado… · Simulado» por correo y WhatsApp (outbox), recordatorio 24 horas antes, `.ics` y botón de compartir por WhatsApp.

## 4. Flujo organizador

`Login → Publicar evento → Borrador/Pendiente → Revisión admin → Publicado → Registros (resumen)`.

Un organizador solo puede tener acceso a eventos que creó/posee. No implementar roles complejos ni payouts.

## 5. Estados

```text
Event: draft -> pending -> published -> archived
                        -> rejected (opcional)

Order: pending -> confirmed
              -> failed
              -> cancelled

Payment: demo_initiated -> demo_approved | demo_rejected
Ticket: issued -> checked_in (check-in puede quedar fuera de v1)
```

Las órdenes confirmadas guardan precio y comisión históricos; cambios posteriores del evento no las alteran.

## 6. Persistencia y coherencia

- Montos en `integer` centavos USD, jamás `float`.
- Usar RPC/función SQL transaccional para emisión e inventario; bloqueo/actualización condicional para evitar sobreventa.
- Constraints y unique keys para idempotencia; los retries no duplican entradas.
- `confirmed_at`, `created_at` y fechas de evento en UTC almacenados con zona horaria; presentar horario local de El Salvador.
- Concurrencia: la pantalla puede mostrar disponibilidad aproximada; confirmar cupo siempre en servidor.

## 7. Contratos API y rutas

- `POST /api/checkout/orders`: recibe `{ requestId, eventId, items, buyer: { name, email, phone? } }`. Valida en servidor, recalcula precio y comisión, crea la orden `pending` con la RPC `create_pending_order` y responde `201 { orderId, subtotalCents, feeCents, totalCents, checkoutToken }`. Los errores de campo vuelven como `400 { fieldErrors }` y los demás como `{ error }`.
- `POST /api/checkout/orders/[orderId]/confirm/`: recibe `{ checkoutToken, decision }` con `decision` igual a `null` (registro gratuito), `approved` o `rejected` (pago DEMO). Llama a `confirm_order` (atómica e idempotente), genera los QR y responde `{ orderId, status, ticketCount, alreadyProcessed }`. Solo cuando esta llamada confirma una orden (gratis o aprobada) encola el boleto y el recordatorio en `notification_outbox`.
- `GET /confirmacion/[orderId]/[token]/`: página privada (`noindex`) con boletos, comprobante y envío simulado. `GET /confirmacion/[orderId]/[token]/qr/[ticketId]/` descarga el QR en SVG. Un token o identificador inválido responde 404.
- `GET /calendario/[eventId]/`: descarga el `.ics` (`text/calendar`) de un evento **publicado** con el cliente público; uuid inválido o evento inexistente o no publicado responde 404. No lleva datos del comprador y la ruta está en `privatePaths` (no se indexa). La respuesta 200 se cachea poco (`s-maxage=300`, el navegador revalida) y los errores no se cachean.
- Organizador/admin: Server Actions protegidas para operaciones CRUD y aprobación.

### Token de checkout y `request_id`

- El navegador genera un `request_id` (UUID) por sesión de compra y lo guarda en `sessionStorage`; cambia si cambia la selección de entradas. La columna `orders.checkout_request_id` es única.
- El token público **se deriva**, no se guarda: `checkoutToken = base64url(HMAC-SHA256(CHECKOUT_TOKEN_SECRET, request_id))` (43 caracteres, sin relleno). La base solo guarda el SHA-256 del token (`orders.public_token_hash`).
- Con el mismo `request_id`, `create_pending_order` devuelve la misma orden (una sola orden y un solo pago) y el servidor deriva el mismo token, así un reintento o un doble clic obtiene el mismo enlace de confirmación. Si el `request_id` ya se usó con otro evento, la RPC lo rechaza.
- Los QR de los boletos se derivan del token y del id de cada boleto, por lo que la confirmación los recupera sin guardarlos en claro.
- `CHECKOUT_TOKEN_SECRET` es una variable **solo de servidor**. En producción su ausencia falla de forma explícita (la creación de órdenes responde 503); fuera de producción se usa un valor local de desarrollo. Debe crearse en Vercel antes del despliegue.

### Notificaciones simuladas

Ver `notification_outbox` en `DATA.md` y los escenarios en `../checkout/DEMO_PAYMENT.md`. No existe proveedor de correo ni de WhatsApp: el outbox solo registra qué se «enviaría», con destinos enmascarados.

## 8. Despliegue

Vercel conectado al repositorio; variables de entorno Supabase solo donde corresponde. Configurar DNS para el dominio **ya existente** después de conocer el hostname. Usar despliegues preview para validar antes de producción.

## 9. Plan de pruebas técnicas

Unit: precio/fee, estado, rutas SEO, validación, token derivado, `.ics` y outbox. Integración: función de cupos y emisión idempotente, `request_id`, restricciones RLS. E2E: flujo gratis, pagado simulado y rechazado en 1280 px y 375 px (`tests/e2e/purchase-flow.spec.ts` con la API simulada; `purchase-flow-real.spec.ts` con órdenes reales solo con `REAL_PURCHASE=1`); publicación de organizador; acceso público privado. Ver criterios en `../testing/ACCEPTANCE.md`.
