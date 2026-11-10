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
  - Auth: cuentas comprador/organizador/admin
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
- El rol nunca viene del navegador ni de `user_metadata`. Un perfil nuevo siempre es `buyer`; solo el servidor o `admin_link_organizer` lo cambian.

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
10. Cuenta opcional (D-37): el comprador puede registrarse con correo y contraseña, y recuperar la contraseña por correo. Con sesión, el checkout precarga nombre y correo, y la orden queda ligada a `buyer_user_id`. Sin sesión, la compra de invitado no cambia. Una orden de invitado puede reclamarse después con `claim_order`, solo si el correo coincide con el de la cuenta y se tiene el enlace de confirmación. «Mis boletos» (`/mis-boletos/`) lista solo las órdenes propias; `/cuenta/` edita nombre, universidad y preferencias de correo (desactivadas por defecto, sin envío real).

## 4. Flujo organizador

`Login → Proponer evento pendiente → Revisión admin → Publicado → Check-in y reporte`.

Un organizador solo puede tener acceso a eventos que creó/posee. No implementar roles complejos ni payouts.

**Alta de organizadores (P-7, CP-09):** la persona primero crea una cuenta de comprador. El administrador crea la organización en `/admin/organizadores/` y la vincula por correo con `admin_link_organizer`, que sube su perfil de `buyer` a `organizer`. No hay autoservicio ni aprobación de solicitudes en v1.

### Destacados y paquete empresarial (Fase 4)

El administrador gestiona destacados manuales y solicitudes pagadas desde `/admin/destacados/`. Un organizador solo puede solicitar el destacado de un evento propio y publicado desde `/panel/destacar/[eventId]/`; el servidor toma la tarifa diaria de `site_settings` y SQL calcula días, descuento y total. El pago es DEMO: no se solicitan tarjetas y un rechazo no activa el destacado ni consume días.

`/para-empresas/` presenta los beneficios configurables y, para una cuenta vinculada a un organizador, el paquete anual con `SimulatedPaymentPanel`. `/panel/paquete/` muestra vigencia, saldo de eventos y días de destacado, historial y seguimientos. Las funciones de paquete verifican propietario o administrador dentro de funciones protegidas; RLS limita las lecturas.

### Check-in, reporte y encuesta (Fase 6)

`/panel/eventos/[id]/checkin/` permite leer el QR con cámara cuando el navegador lo soporta o introducir el código. La acción de servidor valida sesión/rol y envía el hash a `organizer_check_in`; SQL comprueba propiedad (o admin), orden confirmada y evento. Solo una actualización condicional marca el ingreso; un reintento devuelve «ya registrado». La pantalla muestra resultados y conteos sin nombres ni correos.

`/panel/eventos/[id]/reporte/` muestra emitidos, ingresos, subtotal y comisión; calcula no-show solo cuando terminó el evento y hay boletos emitidos. El reporte superior y `/panel/eventos/[id]/reporte/exportar/` requieren un paquete `status = active` del propietario, o admin. Incluyen emisión diaria UTC y desglose por tipo; el CSV contiene agregados, usa UTF-8 sin BOM y CRLF, y se entrega con `private, no-store`. El código actual no condiciona este acceso a fechas del paquete ni a `advancedReport` (D-65).

`/confirmacion/[orderId]/[token]/encuesta/` valida el enlace de una orden confirmada; la respuesta se guarda con `submit_survey`, una vez por orden, con nota 1–5 y comentario opcional de hasta 500 caracteres. No pide identidad adicional. El reporte muestra cantidad y promedio, sin comentarios. El formulario abre al inicio del evento; la invitación simulada se agenda para dos horas después de su fin (o inicio si no hay `ends_at`). Esta diferencia está pendiente de decisión (D-64).

### Contenido, SEO y consentimiento (Fase 5)

`/admin/contenido/` administra blog y textos/FAQ de categorías con RPC que verifican `is_admin()`. El Markdown se renderiza mediante componentes; el público solo lee contenido publicado. `/blog/`, sus artículos y la página de organizador `/copa/` completan el catálogo; no se afirma que exista una cantidad concreta de artículos publicados.

`site_settings.indexing_enabled`, apagado por defecto, gobierna metadatos, robots, sitemap y JSON-LD; se cambia en `/admin/ajustes/` con verificación de administrador y registro de quién/cuándo. Los precios y beneficios se guardan atómicamente con `admin_set_settings`. Las rutas elegibles y privadas se detallan en `SEO_ROUTES.md`; la etiqueta DEMO se mantiene aunque el responsable active indexación.

La analítica propia usa `ticketera_consent`: sin aceptación el navegador no envía eventos y `/api/analytics/` no los guarda. El servidor inserta nombre, ruta, host de referencia e identificador seudónimo; `/admin/metricas/` consulta agregados mediante `admin_analytics_summary`. `/privacidad/` y `/terminos/` explican la demo. La lista de nombres admitidos no prueba cobertura de todos los eventos; retención y exclusión de rutas sensibles quedan pendientes (D-66).

## 5. Estados

```text
Event: draft -> pending -> published -> archived
                        -> rejected (opcional)

Order: pending -> confirmed
              -> failed
              -> cancelled

Payment: demo_initiated -> demo_approved | demo_rejected
Ticket: issued -> checked_in (tickets.checked_in_at, una sola vez)
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
- Cuentas (Fase 3): `/registro/`, `/ingresar/`, `/recuperar/` y `/recuperar/nueva/`; `/mis-boletos/` y `/cuenta/` para el comprador (todas `noindex`); `/admin/organizadores/` para el alta de organizadores.
- Organizador/admin: Server Actions protegidas para operaciones CRUD y aprobación.

### Token de checkout y `request_id`

- El navegador genera un `request_id` (UUID) por sesión de compra y lo guarda en `sessionStorage`; cambia si cambia la selección de entradas. La columna `orders.checkout_request_id` es única.
- El token público **se deriva**, no se guarda: `checkoutToken = base64url(HMAC-SHA256(CHECKOUT_TOKEN_SECRET, request_id))` (43 caracteres, sin relleno). La base solo guarda el SHA-256 del token (`orders.public_token_hash`).
- Con el mismo `request_id`, `create_pending_order` devuelve la misma orden (una sola orden y un solo pago) y el servidor deriva el mismo token, así un reintento o un doble clic obtiene el mismo enlace de confirmación. Si el `request_id` ya se usó con otro evento, la RPC lo rechaza.
- Los QR de los boletos se derivan del token y del id de cada boleto, por lo que la confirmación los recupera sin guardarlos en claro.
- En «Mis boletos», el enlace de cada orden de la cuenta se deriva igual, a partir de `checkout_request_id` (P-2). Así una compra con cuenta se recupera sin guardar tokens en claro.
- `CHECKOUT_TOKEN_SECRET` es una variable **solo de servidor**. En producción su ausencia falla de forma explícita (la creación de órdenes responde 503); fuera de producción se usa un valor local de desarrollo. Debe crearse en Vercel antes del despliegue.

### Notificaciones simuladas

Ver `notification_outbox` en `DATA.md` y los escenarios en `../checkout/DEMO_PAYMENT.md`. No existe proveedor de correo ni de WhatsApp: el outbox solo registra qué se «enviaría», con destinos enmascarados.

## 8. Despliegue

Vercel conectado al repositorio; variables de entorno Supabase solo donde corresponde. Configurar DNS para el dominio **ya existente** después de conocer el hostname. Usar despliegues preview para validar antes de producción.

Dominio final decidido: `ticketera.c3.com.sv`; demo: `demo.ticketera.c3.com.sv`. `NEXT_PUBLIC_SITE_URL` debe coincidir con el entorno para canónicos y sitemap. La activación de DNS, indexación y Search Console corresponde al responsable. Este documento describe el código versionado; no acredita despliegue ni aplicación remota de migraciones. La Fase 6 requiere `20261113100000_check_in_and_reports.sql`, `20261113106000_advanced_report.sql` y `20261113110000_event_survey.sql`; cualquier aplicación en producción se confirma por separado.

## 9. Plan de pruebas técnicas

Unit: precio/fee, estado, rutas SEO, validación, token derivado, `.ics` y outbox. Integración: función de cupos y emisión idempotente, `request_id`, restricciones RLS. E2E: flujo gratis, pagado simulado y rechazado en 1280 px y 375 px (`tests/e2e/purchase-flow.spec.ts` con la API simulada; `purchase-flow-real.spec.ts` con órdenes reales solo con `REAL_PURCHASE=1`); publicación de organizador; acceso público privado. Ver criterios en `../testing/ACCEPTANCE.md`.
