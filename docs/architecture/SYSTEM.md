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

## 7. Contratos API recomendados

- `POST /api/checkout/orders`: recibe `{eventId, items, attendee}` → valida, crea `pending`, devuelve token de checkout.
- `POST /api/checkout/demo-pay`: `{checkoutToken, outcome}` → `demo_approved` / `demo_rejected`; solo entorno demo; confirma en transacción.
- `POST /api/checkout/free`: registra evento de monto cero, confirma en transacción.
- `GET /api/orders/[token]`: devuelve una orden sin información ajena.
- `GET /api/tickets/[token]`: prepara boleto imprimible/descargable sin revelar PII innecesaria.
- Organizador/admin: usar Server Actions protegidas para operaciones CRUD y aprobación.

Nota: los nombres exactos de endpoints pueden adaptarse a convenciones de Next.js sin cambiar comportamientos.

## 8. Despliegue

Vercel conectado al repositorio; variables de entorno Supabase solo donde corresponde. Configurar DNS para el dominio **ya existente** después de conocer el hostname. Usar despliegues preview para validar antes de producción.

## 9. Plan de pruebas técnicas

Unit: precio/fee, estado, rutas SEO, validación. Integración: función de cupos y emisión idempotente, restricciones RLS. E2E: flujo gratis, pagado simulado y rechazado; publicación de organizador; acceso público privado. Ver criterios en `../testing/ACCEPTANCE.md`.
