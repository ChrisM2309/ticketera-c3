# Recordatorio de carrito DEMO — Plan de implementación

> **Para agentes:** ejecutar tarea por tarea con `superpowers:executing-plans` o, si el usuario lo solicita, `superpowers:subagent-driven-development`. Los pasos usan casillas.

**Objetivo:** enviar un único recordatorio de un carrito abandonado a quien lo solicite, como invitado o con cuenta.

**Arquitectura:** el navegador solicita guardar una selección mínima; una tabla privada en Supabase permite reclamar solicitudes y un endpoint protegido las procesa diariamente con Brevo. Se revalidan evento y compra; el enlace reconstruye la selección sin confiar en precios del cliente.

**Stack:** Next.js App Router, TypeScript, Supabase/PostgreSQL, Brevo, Vitest. **Spec:** `docs/superpowers/specs/2026-11-13-correos-demo-design.md`.

## Restricciones globales

Mantener español y DEMO; 24 horas de inactividad; un intento por solicitud; borrar datos terminales tras 30 días. No afectar la compra, reservar inventario, exponer secretos o enviar sin aceptación. Antes de código Next, leer guías correspondientes en `node_modules/next/dist/docs/`. No modificar archivos ajenos preexistentes.

## Riesgos que deben cubrir las pruebas

1. Datos manipulados: ids ajenos, cantidades inválidas y evento no publicado se rechazan (tarea 1).
2. Solicitud cancelada o compra confirmada antes de procesar no envía (tareas 1 y 3).
3. Dos ejecuciones simultáneas no reclaman la misma fila (tarea 1).
4. Correo o URL con HTML no altera la plantilla (tarea 3).
5. Falta de secreto o proveedor no expone datos ni afecta checkout (tareas 3 y 4).

### 1. Persistencia y validación

**Crear:** `supabase/migrations/20261120140000_email_reminders.sql`, `src/features/reminders/cart-validation.ts`, `tests/db/cart-reminders.test.ts`, `tests/unit/cart-reminders-validation.test.ts`.

**Interfaces:** `parseCartReminder(input: unknown): { valid: true; email: string; eventId: string; items: { ticketTypeId: string; quantity: number }[] } | { valid: false }`; SQL de servicio para crear/actualizar, cancelar por hash y reclamar solicitudes elegibles atómicamente.

- [ ] Escribir pruebas que rechacen consentimiento ausente, correo inválido, cantidades fuera de 1–10, duplicados o demasiados tipos; comprobar que normaliza correo sin incluir precios.
- [ ] Ejecutar `npx vitest run tests/unit/cart-reminders-validation.test.ts`; comprobar fallo por funcionalidad ausente.
- [ ] Crear validador y migración con tabla privada, hash del secreto aleatorio, estado, fechas y selección; RLS y permisos solo `service_role`. Revalidar IDs y cantidades contra evento publicado y tipos activos en la operación de servidor. Indexar plazo y unicidad por solicitud. Una operación de reclamación condicional debe devolver cada fila a un solo procesador.
- [ ] Añadir pruebas DB con dos reclamaciones, cancelación, compra confirmada posterior y permisos `anon`/`authenticated`. Correr `npx vitest run tests/unit/cart-reminders-validation.test.ts tests/db/cart-reminders.test.ts` y verificar todo en verde.

### 2. Captura y cancelación

**Modificar:** `src/app/carrito/page.tsx`, `src/components/checkout/cart-page.tsx`, `src/app/api/checkout/orders/[orderId]/confirm/route.ts` y el flujo de confirmación de pago que efectivamente use la aplicación; **crear:** `src/app/api/recordatorios/carrito/route.ts`, `tests/unit/cart-reminder-route.test.ts`.

**Interfaces:** `POST /api/recordatorios/carrito/` acepta selección y consentimiento explícito; `DELETE` recibe secreto del navegador; ambos devuelven resultado genérico sin enumerar correos. La cuenta procede de `readOptionalSession`, nunca de un id enviado por el cliente.

- [ ] Escribir pruebas del POST para invitado y cuenta, consentimiento ausente, validación, protección de origen y límite de solicitudes; probar DELETE con secreto correcto/incorrecto y que solicitudes fallidas no bloquean compra.
- [ ] Ejecutar `npx vitest run tests/unit/cart-reminder-route.test.ts`; verificar fallo inicial.
- [ ] Implementar formulario accesible desmarcado, correo precargado de sesión y aviso de plazo; persistir secreto aleatorio localmente sin mostrarlo. Cambios o vaciado invocan actualización/cancelación explícita; fallo informa al usuario sin romper carrito.
- [ ] Cancelar por correo/evento tras confirmación exitosa en ambos flujos reales; no cancelar al crear orden pendiente ni en pago rechazado. Añadir pruebas de cada ruta y de selección reconstruida.
- [ ] Ejecutar pruebas de rutas y checkout afectadas; confirmar que pasan.

### 3. Plantilla y procesador

**Crear:** `src/features/reminders/cart-email.ts`, `src/features/reminders/process-cart-reminders.ts`, `tests/unit/cart-reminder-email.test.ts`, `tests/unit/process-cart-reminders.test.ts`.

**Interfaces:** `buildCartReminderEmail({ eventTitle, cartUrl }: { eventTitle: string; cartUrl: string }): { subject: string; html: string; text: string }`; `processCartReminders(): Promise<{ sent: number; failed: number; skipped: number }>`.

- [ ] Escribir pruebas de escape, enlace del sitio, etiqueta DEMO, texto plano, plazo de 24 horas, evento no publicado/pasado, compra confirmada, cancelación, proveedor ausente y error/timeout simulado.
- [ ] Ejecutar `npx vitest run tests/unit/cart-reminder-email.test.ts tests/unit/process-cart-reminders.test.ts`; comprobar fallo inicial.
- [ ] Implementar plantilla con estilo de `ticket-email.ts`, enlace a `/carrito/` con ids y cantidades, y procesador que reclama antes de enviar, revalida, usa `sendBrevoEmail` y deja `sent`, `failed` o `cancelled`. No reintentar resultados inciertos. Eliminar datos terminales tras 30 días.
- [ ] Repetir el comando y comprobar que pasa; documentar la ventana de carrera con confirmación y el fallo incierto.

### 4. Programación y verificación

**Crear:** `src/app/api/cron/recordatorios-carrito/route.ts`, `tests/unit/cart-reminder-cron.test.ts`; **modificar:** `.env.example`, `docs/superpowers/plans/implementation-backlog.md` y documentación operativa pertinente.

- [ ] Probar que secreto ausente o incorrecto devuelve 401 y no procesa; con secreto válido ejecuta una vez. Implementar `GET` con `Authorization: Bearer` y `CRON_SECRET` solo servidor, sin registrar credenciales.
- [ ] Documentar programación diaria a las 15:00 UTC, migración, configuración existente de Brevo, secreto y prueba manual con correo propio; comprobar compatibilidad real con el plan de alojamiento. No incluir secretos.
- [ ] Ejecutar `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` y E2E pertinentes; registrar resultados y limitaciones. No marcar T28 terminado sin demostrar envío real autorizado y todos los criterios del backlog.
