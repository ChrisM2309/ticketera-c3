# Plan: correo de confirmación con Brevo

**Estado:** implementado en código y probado en local (lint, typecheck, pruebas unitarias y de base, build). Pendiente de producción: aplicar la migración `20261114100000_notification_delivery.sql` y configurar `BREVO_API_KEY` y `BREVO_SENDER_EMAIL` en Vercel; luego una compra de prueba real.

**Respuestas del responsable (10/11/2026):** remitente no-reply del dominio c3.com.sv (ya autenticado en Brevo); correo también en compras gratuitas; sin botón de reenvío (no existe en «Mis boletos»); el límite gratuito de Brevo basta para la demo, un correo por orden completada.

## 1. Objetivo

Enviar un correo al comprador cuando su compra queda confirmada (gratis o con pago DEMO aprobado) con el enlace a su confirmación y boletos. Alcance v1: solo el correo de compra. Recordatorios de 24 h, encuesta y WhatsApp quedan fuera.

Fuera de alcance: correo a organizadores, cambios de contraseña (Supabase Auth ya envía los suyos), newsletter.

## 2. Punto de partida (verificado en el repositorio)

- `src/app/api/checkout/orders/[orderId]/confirm/route.ts` confirma la orden con la RPC `confirm_order` (atómica e idempotente, D-27) y ya llama a `buildTicketNotifications` y `enqueueNotifications`.
- `notification_outbox` (migración `20261109120000`) guarda solo el destino enmascarado (`a***@dominio`) y el estado `simulated`. No envía nada.
- `orders.buyer_email` existe en la base y solo lo leen las funciones con `service_role`.
- El token de checkout **no se guarda en claro** (D-26): solo su SHA-256. El enlace `/confirmacion/[orderId]/[token]/` solo se puede construir **en el momento de la confirmación**, cuando el token llega en la petición. Por eso el correo debe salir desde esa misma ruta y no desde un trabajador posterior.

## 3. Decisiones propuestas

| # | Decisión | Motivo |
|---|---|---|
| B-1 | Proveedor: **API transaccional de Brevo** (`POST https://api.brevo.com/v3/smtp/email`, cabecera `api-key`). No SMTP. | Una petición HTTP por correo, respuesta con `messageId`, sin dependencia nueva (`fetch` nativo). |
| B-2 | El envío sale **en la confirmación**, después de la RPC y con el token en memoria. Se usa `after()` de Next.js (o `await` si `after` no aplica al runtime) para no retrasar la respuesta al comprador. | El enlace necesita el token original; no se puede reconstruir desde la base. |
| B-3 | La fila de `notification_outbox` pasa a un ciclo de estados: `pending` → `sent` (con `provider_message_id`) o `failed` (con `attempts` y `last_error` acotado). | Registro auditable sin guardar el correo completo ni el token. |
| B-4 | **Idempotencia:** la fila `(order_id, 'email', 'ticket')` ya es única. El envío solo ocurre si la fila pasa de `pending` a `sent` en una actualización condicional. Un reintento de la confirmación (`alreadyProcessed`) no vuelve a enviar. | Evita correos duplicados ante doble clic o reintento de red. |
| B-5 | **Reintento:** sin cola nueva en v1. Si el envío falla, la fila queda `failed` y la confirmación sigue válida. Un enlace «Reenviar correo» en `/mis-boletos/` (cuentas, Fase 3) o una ruta protegida por `CRON_SECRET` reintenta las filas `failed` sin token. | El boleto es descargable en la confirmación; el correo es comodidad. Un reintento sin token no puede incluir el enlace, así que el reenvío lleva al comprador a iniciar sesión o a su enlace guardado. |
| B-6 | Compra gratuita y pago DEMO aprobado envían correo. El **pago rechazado no envía nada** y no emite boletos (regla del proyecto). | Coincide con la regla de negocio de `AGENTS.md`. |
| B-7 | Etiqueta **DEMO** en asunto y cuerpo: «Ticketera C3 · DEMO». El correo dice que el pago fue simulado. | `AGENTS.md`: etiquetar sitio y pagos como DEMO; sin cobros reales. |
| B-8 | Contenido sin HTML del usuario: el nombre del comprador y el título del evento se escapan. Sin imágenes externas en v1. | Evita inyección en el correo. |

## 4. Configuración (solo servidor)

Variables nuevas, sin prefijo `NEXT_PUBLIC_`:

- `BREVO_API_KEY`: clave de API de Brevo. **Nunca** en el repositorio ni en el cliente. Se crea en Brevo y se pega en Vercel.
- `BREVO_SENDER_EMAIL`: remitente verificado en Brevo (dominio autenticado con SPF y DKIM, o remitente validado).
- `BREVO_SENDER_NAME`: «Ticketera C3 DEMO».
- `NEXT_PUBLIC_SITE_URL`: ya existe; construye el enlace del correo.

Si `BREVO_API_KEY` falta, el correo no se envía, la fila queda `failed` con `last_error = 'proveedor no configurado'` y la compra **no** falla. En desarrollo el envío se desactiva.

## 5. Cambios por archivo (propuesta)

1. **Migración** `supabase/migrations/2026111xxxxxxx_notification_delivery.sql`: añade a `notification_outbox` las columnas `status` con valores `pending | sent | failed`, `provider_message_id text`, `attempts int default 0`, `last_error text` (máx. 200 caracteres) y `sent_at`. Pruebas en `tests/db`. **No se aplica a producción sin confirmación explícita del responsable** (roadmap).
2. `src/features/ticketing/email/brevo.ts`: cliente mínimo `sendBrevoEmail({ to, subject, html, text })` con `fetch`, tiempo límite de 10 s, sin registrar el correo ni la clave. Prueba unitaria con `fetch` simulado.
3. `src/features/ticketing/email/ticket-email.ts`: plantilla de texto y HTML (función pura): nombre, evento, fecha, cantidad de boletos, enlace de confirmación y aviso DEMO. Prueba unitaria de escapado.
4. `src/features/ticketing/notifications.ts`: `buildTicketNotifications` sigue creando la fila `pending` para correo; el WhatsApp sigue `simulated` y no se toca.
5. `src/app/api/checkout/orders/[orderId]/confirm/route.ts`: tras una confirmación nueva (`result_already_processed = false`) y con estado `confirmed`, programa el envío. Solo el primer envío transiciona la fila de `pending` a `sent`.
6. Datos del evento y de la orden para el correo: lectura con `service_role` dentro de la misma función, sin devolverlos al navegador.

## 6. Pruebas

- Unitarias: escapado de HTML, construcción del enlace, enmascarado de destinos (ya existe), respuesta de error del proveedor.
- Base (`tests/db`): transición `pending → sent` solo una vez; una segunda confirmación no vuelve a enviar; la fila `failed` queda sin token ni correo completo.
- Manual en el entorno de Brevo con un remitente verificado y un correo de prueba propio: compra gratuita, compra DEMO aprobada, compra rechazada (no debe llegar correo). Registrar el resultado en el backlog.
- Seguridad: revisar que ni el correo completo ni el token aparecen en logs de Vercel (`console.*`).

## 7. Preguntas para el responsable

1. ¿Qué dirección remitente usar y ya tiene el dominio autenticado en Brevo (SPF y DKIM)? Sin eso, los correos caen en spam o Brevo los rechaza.
2. ¿Confirma que el correo sale también en compras gratuitas?
3. ¿Quiere el botón de reenvío en «Mis boletos» (requiere la Fase 3 terminada) o basta con el enlace del correo original?
4. ¿Plan de Brevo: el límite diario del plan gratuito debe cubrir las pruebas de la demostración?

## 8. Orden de trabajo sugerido

1. Responder la sección 7 y verificar el remitente en Brevo.
2. Migración y pruebas de base (rama nueva desde `master`).
3. Cliente Brevo y plantilla, con pruebas unitarias.
4. Integración en la ruta de confirmación y prueba de idempotencia.
5. Prueba manual con correo propio y registro en `implementation-backlog.md`.

## 9. Fuentes

- Documentación de la API transaccional de Brevo (`smtp/email`): revisar el esquema vigente antes de codificar, porque la versión de la API puede cambiar.
- `docs/DECISIONS.md` D-12, D-26, D-27, D-28, D-48 (el envío era simulado; esta fase lo cambia y debe registrarse como decisión nueva).
