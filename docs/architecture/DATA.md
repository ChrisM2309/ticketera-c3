# Modelo de datos de Ticketera C3

Descripción del esquema versionado y del código de las fases 0–6. No certifica que todas las migraciones estén aplicadas en cada entorno; su despliegue se verifica por separado.

## Tablas

| Tabla | Campos principales | Notas |
|---|---|---|
| `profiles` | `id` (Auth UUID PK, igual a `auth.users.id`), `role` (`buyer`/`organizer`/`admin`, por defecto `buyer`), `display_name`, `university` (opcional, hasta 80), `marketing_opt_in` (por defecto `false`), `consented_at`, `created_at` | Perfil creado por el disparador `handle_new_user` al registrarse, con rol `buyer`; no lee `user_metadata`. El cliente solo actualiza `display_name`, `university` y `marketing_opt_in`; `consented_at` lo fija un disparador. Sube un usuario a `organizer` solo `admin_link_organizer`; el rol nunca viene del navegador |
| `organizers` | `id`, `owner_user_id`, `name`, `slug`, `description`, `status` | Un usuario propietario por organizador v1 |
| `categories` | `id`, `slug`, `name`, `keyword`, `search_volume`, `sort_order`, `kind` | `kind=event_type/topic/location/organizer`; conservar 21 rutas del Excel |
| `seo_routes` | `path` (PK), `kind`, `keyword`, `search_volume`, `is_indexable`, `sort_order` | Snapshot del árbol SEO; categorías, temas, ciudades, subtemas y modalidades; sin `id` ni `parent_path` |
| `events` | `id`, `organizer_id`, `event_type_id`, `topic_id`, `location_id`, `slug`, `title`, `description`, `agenda`, `starts_at`, `ends_at`, `mode`, `venue`, `image_path`, `speakers`, `status`, `is_demo`, `created_at`, `updated_at` | Tipo, tema y ciudad referencian `categories` con FKs compuestas por `kind`; no hay tabla `topics`. Ruta pública por tipo/tema/slug (sin tema cuando falta); solo `published` comprable. `speakers` es `jsonb not null default '[]'` con hasta 8 ponentes `{ name, role }` (nombre de 1 a 80 y rol de 0 a 120 caracteres), validado por `is_valid_speakers` |
| `ticket_types` | `id`, `event_id`, `name`, `price_cents`, `quantity_total`, `quantity_sold`, `max_per_order`, `is_active` | Precio USD centavos; cupos no negativos |
| `orders` | `id`, `public_token_hash`, `checkout_request_id`, `buyer_user_id`, `event_id`, `buyer_name`, `buyer_email`, `buyer_phone`, `status`, `subtotal_cents`, `fee_cents`, `total_cents`, `created_at`, `confirmed_at` | Acceso guest por token secreto; guardar hash del token. `checkout_request_id` (`uuid`, único) es el `request_id` del navegador y hace idempotente la creación; el token se deriva con HMAC de ese id. `buyer_phone` es opcional y solo admite `+503` y 8 dígitos. `buyer_user_id` (uuid, opcional, `on delete set null`) liga la orden a la cuenta del comprador; es nulo en compras de invitado |
| `order_items` | `id`, `order_id`, `ticket_type_id`, `unit_price_cents`, `quantity`, `line_total_cents` | Snapshot de precio para auditoría |
| `payments` | `id`, `order_id`, `provider` (`demo`), `status`, `amount_cents`, `idempotency_key`, `created_at` | NO contiene datos de tarjetas |
| `tickets` | `id`, `order_id`, `order_item_id`, `ticket_type_id`, `qr_token_hash`, `issued_at`, `checked_in_at` | Un registro por entrada; QR aleatorio seguro |
| `notification_outbox` | `id`, `order_id`, `channel` (`email`/`whatsapp`), `template` (`ticket`/`reminder_24h`/`survey`), `destination_masked`, `status` (`simulated`/`cancelled`), `scheduled_for`, `created_at` | Registro de envíos **simulados**; nunca guarda correo ni teléfono completos. Solo `service_role` lee y escribe. `unique (order_id, channel, template)` |
| `site_settings` | `key`, `value` (`jsonb`), `updated_by`, `updated_at` | Claves públicas de configuración DEMO: `featured_daily_rate_cents`, `package_annual_price_cents`, `package_benefits`, `indexing_enabled`. Lectura pública de esas claves; escritura mediante `admin_set_setting` solo admin; el formulario de tarifas y beneficios usa `admin_set_settings` para guardar atómicamente. |
| `featured_placements` | `event_id`, `source` (`manual`/`paid`), `starts_on`, `ends_on`, `days`, `daily_rate_cents`, `free_days`, `total_cents`, `status`, `requested_by` | Destacados con vigencia. La función `active_featured` devuelve los aprobados vigentes; el total y los días gratis se calculan en SQL. La tabla `event_featured` queda retirada y no se consulta. |
| `business_packages` | `organizer_id`, `starts_on`, `ends_on`, `price_cents`, `benefits`, `featured_days_remaining`, `events_remaining`, `status` | Un solo paquete `active` por organizador. `purchase_business_package` guarda una instantánea de beneficios y registra `payment_failed` si el resultado DEMO es rechazado. |
| `package_followup_requests` | `package_id`, `message`, `status`, `created_at` | Seguimientos del dueño de un paquete activo; solo el administrador puede marcarlos como respondidos. |
| `blog_posts` | `id`, `slug`, `title`, `description`, `body_md`, `keyword`, `topic`, `related_type_slugs`, `status`, `published_at`, `author_id`, `updated_at` | Blog administrativo en Markdown; temas `eventos`, `cultura`, `fechas-mixtas`; lectura pública solo `published`. Publicar exige palabra clave, cuerpo mínimo de 200 caracteres y fecha. Slug único; `nuevo` reservado |
| `editorial_pages` | `id`, `category_id` (único), `intro_md`, `faq`, `status`, `updated_by`, `updated_at` | Texto de categoría y hasta 8 preguntas `{ q, a }`; público solo `published`; escritura por RPC de administrador |
| `analytics_events` | `id` (bigint), `name`, `path`, `referrer_host`, `anon_id`, `created_at` | Analítica propia con consentimiento; inserción por servidor (`service_role`), sin lectura directa de `anon` o `authenticated`; resumen agregado solo admin |
| `event_survey_responses` | `id`, `order_id` (único), `event_id`, `rating` (1–5), `comment` (opcional, hasta 500), `created_at` | Una respuesta por orden confirmada, ligada al evento; sin lectura directa para comprador u organizador. Reportes solo devuelven cantidad y promedio, sin comentarios |

**Ponentes:** se guardan como columna `events.speakers` (JSON validado en la base), no como tabla aparte. Evitar tablas extra si no contribuyen a la entrega.

## Estados

- `notification_outbox.status`: `simulated` (registrado, sin envío real) o `cancelled`; hoy ninguna ruta escribe `cancelled`.
- `orders.status = cancelled` está reservado; hoy ninguna ruta lo escribe (CO-12).

## Relaciones

`profiles 1:N organizers 1:N events 1:N ticket_types`; `auth.users 1:1 profiles`; `profiles 0:N orders` (vía `buyer_user_id`); `events 1:N orders 1:N order_items`; `orders 1:N payments`; `order_items 1:N tickets`.

## Funciones de cuenta (Fase 3)

| Función | Quién la ejecuta | Qué hace |
|---|---|---|
| `create_pending_order(…, p_buyer_user_id)` | `service_role` | Guarda `buyer_user_id` cuando la compra se hace con sesión. Una compra de invitado (`asGuest`) no liga la orden. Un reintento idempotente no cambia el dueño |
| `my_orders()` | `authenticated` (`SECURITY DEFINER`) | Devuelve solo las órdenes con `buyer_user_id = auth.uid()`, con su evento y estado. «Mis boletos» deriva el enlace de cada orden con `deriveCheckoutToken(secret, checkout_request_id)`; la base no guarda tokens en claro |
| `claim_order(p_order_id, p_checkout_token_hash)` | `authenticated` | Asigna `auth.uid()` solo si la orden no tiene dueño, el hash del token coincide y `buyer_email` es el correo de la cuenta. Devuelve `false` en cualquier otro caso |
| `admin_link_organizer(p_name, p_slug, p_description, p_owner_email)` | `authenticated` con `is_admin()` | Crea la organización y sube el perfil de la cuenta existente de `buyer` a `organizer`. Nunca toca a `organizer` ni `admin`. Un correo sin cuenta se rechaza |
| `admin_list_organizers()` | `authenticated` con `is_admin()` | Lista organizaciones con el correo del dueño; la página lo enmascara antes de mostrarlo |

## Restricciones esenciales

- `events.speakers` cumple `is_valid_speakers` (arreglo de hasta 8 objetos con `name` de 1 a 80 caracteres y `role` de hasta 120).
- `UNIQUE(orders.checkout_request_id)`: un `request_id` crea una sola orden; reusarlo con otro evento se rechaza (`22023`).
- `orders.buyer_phone` nulo o con formato `^\+503[0-9]{8}$`.
- `UNIQUE(notification_outbox.order_id, channel, template)` evita encolar dos veces el mismo aviso; `anon` y `authenticated` no tienen ningún privilegio sobre la tabla.
- `price_cents >= 0`, `quantity_total >= 0`, `quantity_sold >= 0` y `quantity_sold <= quantity_total`.
- `UNIQUE(events.slug)` global; `seo_routes.path` es clave primaria y `UNIQUE(categories.kind, categories.slug)` evita duplicados por ámbito.
- `UNIQUE(payments.idempotency_key)` y referencia transaccional que impida re-emitir tickets al reconfirmar una orden.
- Asegurar que tickets asociados a una orden confirmada corresponden exactamente a las cantidades compradas.
- `buyer_email` y nombre limitados; validación de formato y longitud.
- Los datos del QR y token de confirmación no aparecen en listados públicos.
- `profiles.role` no lo escribe el usuario: el cliente solo actualiza `display_name`, `university` y `marketing_opt_in`. `claim_order` no reasigna una orden que ya tiene dueño.

## Seguridad de acceso (orientación RLS)

- `events`, `ticket_types`: `SELECT` público **solo** cuando evento `published`; el propietario ve los suyos, incluido borrador/pending.
- `organizers`: `SELECT` público limitado a datos publicados, escritura solo usuario propietario.
- `orders`, `payments`, `tickets`, `notification_outbox`: sin `SELECT` público directo. Lectura guest mediante route handler con token seguro y permisos controlados. Lectura de cuenta solo mediante `my_orders()`, que filtra por `auth.uid()`.
- `profiles`: cada usuario lee y actualiza solo su perfil (`id = auth.uid()`); solo servidor/admin gestiona roles.
- `seo_routes`, categorías/temas: lectura pública; escritura admin/migraciones únicamente.

**No exponer service role al navegador.** Preferir funciones `SECURITY DEFINER` mínimas con verificaciones internas cuando haga falta operación atómica. Probar RLS con usuarios reales de prueba antes de exponer el deploy.

## Contenido, analítica y post-evento (fases 5–6)

| Función | Permiso y comportamiento |
|---|---|
| `admin_save_blog_post`, `admin_delete_blog_post`, `admin_save_editorial_page` | `authenticated`, verifican `is_admin()`; validación editorial y escritura protegida. RLS permite solo publicaciones al público y borradores al admin |
| `admin_analytics_summary(p_from, p_to)` | Admin; totales por fecha y nombre, sin identificadores individuales |
| `organizer_check_in(p_event_id, p_qr_hash)` | Propietario del evento o admin; solo orden confirmada y evento correspondiente. Actualización condicional `checked_in_at is null`; devuelve `checked_in`, `already_checked_in`, `wrong_event` o `not_found` sin datos personales |
| `organizer_event_check_in_counts`, `organizer_event_report` | Propietario o admin; emitidos e ingresos de órdenes confirmadas, subtotales/comisiones en centavos, fin del evento y agregados de encuesta |
| `organizer_event_daily_issuance`, `organizer_event_ticket_type_breakdown` | Propietario con paquete `status = active`, o admin. Emisión por día UTC de `tickets.issued_at` y desglose por tipo; sin compradores ni tokens |
| `submit_survey(p_order_id, p_token_hash, p_rating, p_comment)` | RPC para `anon` y `authenticated`, con validación interna de hash de confirmación y orden confirmada; rechaza antes de `starts_at`. `UNIQUE(order_id)` evita duplicados; el evento se obtiene de la orden |

El no-show se calcula en servidor como `(emitidos - ingresos) / emitidos × 100`, con un decimal; sin emitidos o antes de `coalesce(ends_at, starts_at)` se muestra «—». El reporte superior actualmente comprueba `status = active`, sin validar fechas ni el beneficio `advancedReport` de la instantánea; ver pendientes en `DECISIONS.md`.

El outbox registra `survey` para dos horas después de `coalesce(ends_at, starts_at)`, sin ejecutor ni envío real. Esto no retrasa la apertura del formulario, que hoy usa `starts_at`; la diferencia con «post-evento» queda pendiente de resolver (D-64).

`analytics_events.name` admite `page_view`, `event_view`, `begin_checkout`, `purchase_confirmed`, `featured_purchased`, `package_purchased` y `check_in`. La lista admitida no demuestra que cada evento esté instrumentado. El navegador y `/api/analytics/` exigen consentimiento; `anon_id` es seudónimo, no anonimato garantizado. La retención y el tratamiento de rutas potencialmente sensibles requieren revisión (D-66).

## Datos demo iniciales

- 12 categorías de tipos de evento (ordenadas según keyword research), 4 temas principales y 3 ciudades. El Excel propone 2 páginas de organizador; el alcance vigente conserva solo `/copa/` (D-47).
- 10 eventos **ficticios** identificados como demo; mezcla de `gratis`, precio bajo y precio mayor; virtual/presencial; tres ciudades; mínimo dos organizadores.
- Al menos 3 tipos de boleto de demostración, uno gratuito y dos de pago; precios y fechas son **supuestos**, no datos de eventos reales.
- Las cuentas de administrador y organizadores se provisionan por separado: el seed no crea cuentas de Auth ni contraseñas (D-17). Su existencia en un entorno requiere verificación; nunca guardar credenciales en el repositorio.

## Importación del Excel

El archivo fuente tiene una sola pestaña `ARQUITECTURA ` y propone **1 + 21 + 36 + 76 = 134 URLs**. Se debe guardar un snapshot versionado con los slugs, y no deducir categorías por strings de título. `seo_routes` permite mantener taxonomía incluso si una ruta no se publica por falta de eventos.
