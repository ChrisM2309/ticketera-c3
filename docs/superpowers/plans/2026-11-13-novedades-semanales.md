# Novedades semanales DEMO — Plan de implementación

> **Para agentes:** ejecutar tarea por tarea con `superpowers:executing-plans` o, si el usuario lo solicita, `superpowers:subagent-driven-development`. Los pasos usan casillas.

**Objetivo:** enviar una selección semanal de eventos a cuentas que aceptaron recibir novedades.

**Arquitectura:** reutilizar `profiles.marketing_opt_in` y la interfaz de `/cuenta/`. Un registro privado por cuenta y semana permite reclamar una sola vez; un endpoint programado consulta eventos publicados y futuros, correos confirmados de Auth y envía con Brevo.

**Stack:** Next.js App Router, TypeScript, Supabase/PostgreSQL/Auth, Brevo, Vitest. **Spec:** `docs/superpowers/specs/2026-11-13-correos-demo-design.md`.

## Restricciones globales

Casilla desactivada por defecto; no suscribir al registrar; máximo tres eventos publicados y futuros por fecha; lunes 15:00 UTC; sin reintentos automáticos de resultados inciertos; enlace a `/cuenta/` para revocar. Español, DEMO, `service_role` solo servidor y sin correos en logs. Leer guías Next locales antes de escribir código.

## Riesgos que deben cubrir las pruebas

1. Cuenta sin consentimiento, revocada o sin confirmar no recibe (tareas 1 y 2).
2. Eventos pasados, sin publicar o selección vacía no producen correo improcedente (tarea 2).
3. Dos ejecuciones simultáneas no envían dos veces al mismo usuario y semana (tarea 1).
4. Nombre o título con HTML se escapa y enlaces pertenecen al sitio (tarea 2).
5. Cron sin secreto y Brevo no configurado no envían ni exponen datos (tareas 2 y 3).

### 1. Registro privado y preferencias

**Crear:** `supabase/migrations/20261120140000_email_reminders.sql`, `tests/db/weekly-event-emails.test.ts`; **modificar:** `src/components/accounts/profile-form.tsx` solo si hace falta aclarar frecuencia o baja.

**Interfaces:** tabla privada `weekly_event_email_deliveries` con `user_id`, semana local, estado y resultado sin dirección; unicidad `(user_id, week_start)`; función transaccional de reclamación y consulta de elegibilidad con rol de servicio.

- [ ] Escribir pruebas de RLS y privilegios, unicidad y reclamación concurrente; comprobar que baja de `marketing_opt_in` impide nueva reclamación.
- [ ] Ejecutar `npx vitest run tests/db/weekly-event-emails.test.ts`, confirmar fallo inicial e implementar migración sin cambiar el valor de consentimiento de cuentas existentes. Los registros terminales no contienen direcciones.
- [ ] Verificar en UI que la casilla existente permite activar/desactivar y menciona novedades semanales; conservar su valor desactivado por defecto. Ejecutar las pruebas DB y las existentes de perfil.

### 2. Selección, plantilla y envío

**Crear:** `src/features/reminders/weekly-email.ts`, `src/features/reminders/process-weekly-emails.ts`, `tests/unit/weekly-email.test.ts`, `tests/unit/process-weekly-emails.test.ts`.

**Interfaces:** `buildWeeklyEmail({ events, accountUrl }: { events: { title: string; startsAt: Date; url: string }[]; accountUrl: string }): { subject: string; html: string; text: string }`; `processWeeklyEmails(now: Date): Promise<{ sent: number; failed: number; skipped: number }>`.

- [ ] Escribir pruebas para hasta tres eventos publicados/futuros por fecha, semana del lunes en El Salvador, cero eventos sin envío, escape HTML, texto plano, enlace a cuenta y etiqueta DEMO. Probar cuenta con correo sin confirmar, baja antes del envío, fallo Brevo y respuesta incierta.
- [ ] Ejecutar `npx vitest run tests/unit/weekly-email.test.ts tests/unit/process-weekly-emails.test.ts`; comprobar fallo inicial.
- [ ] Implementar selección de eventos con URLs canónicas, paginación acotada de cuentas de Auth y control de errores; usar `marketing_opt_in` como única fuente de consentimiento. Reclamar por usuario/semana, volver a comprobar preferencia y correo confirmado antes de enviar, y registrar resultado sin reintento automático. Nunca incluir correo o token en logs.
- [ ] Repetir pruebas; verificar que concurrencia y fallos no dan lugar a un segundo intento de la misma semana. Documentar la ventana entre última consulta y envío externo.

### 3. Cron y validación final

**Crear:** `src/app/api/cron/novedades-semanales/route.ts`, `tests/unit/weekly-email-cron.test.ts`; **modificar:** `.env.example` y `docs/superpowers/plans/implementation-backlog.md`, coordinando el secreto compartido con T28.

- [ ] Escribir pruebas: `GET` sin secreto o con secreto incorrecto devuelve 401 sin llamar al procesador; autorizado fuera del lunes local no envía; autorizado el lunes ejecuta una vez por cuenta y semana. Implementar con `CRON_SECRET` solo en servidor.
- [ ] Documentar programación diaria 15:00 UTC, ejecución solo lunes, migración, configuración de Brevo y secreto, prueba manual con cuenta propia y baja. Verificar que programador y plan de alojamiento lo soporten; no dar por activado el envío por documentarlo.
- [ ] Ejecutar `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` y pruebas pertinentes de cuenta; registrar evidencia y límites. Mantener T29 pendiente hasta comprobar sus criterios y un envío real autorizado.
