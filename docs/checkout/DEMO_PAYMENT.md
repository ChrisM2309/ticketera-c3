# Política de checkout y pago DEMO

## Qué exige cada fuente

- **Rúbrica oficial del profesor:** wireframe del carrito/pasarela de pago y confirmación; no especifica pago real, SDK, integración API ni sandbox externo.
- **Guía de construcción del equipo:** sí solicita carrito y checkout funcionales, 'pasarela en modo prueba (sandbox)' y al menos tres compras de prueba, incluida una gratuita.
- **Decisión de implementación:** pago simulado internamente sin proveedor externo. Por tanto, satisface la experiencia transaccional, pero **NO** debe declararse integración de pasarela externa/sandbox.

## Adaptador recomendado

Interfaz `PaymentProvider` con `createPaymentAttempt(order)`, `confirmDemoPayment(order, outcome)`; implementación inicial `DemoPaymentProvider`. Esto permite sustituir por sandbox externo sin reescribir carrito, precios ni boletos.

## Escenarios

1. **Registro gratuito:** subtotal=0, comisión=0, total=0; confirma en servidor, emite QR.
2. **Pago DEMO aprobado:** subtotal > 0, mostrar aviso demo; simular aceptación del proveedor, persistir pago `demo_approved` y crear boletos.
3. **Pago DEMO rechazado:** subtotal > 0; simular rechazo, estado `failed`, 0 tickets emitidos y cupo sin cambios.
4. **Reintento o doble click:** idempotencia, la confirmación no duplica boletos ni consume cupos dos veces.
5. **Sin cupos:** bloquear compra en servidor y mostrar error recuperable.

## Otros cobros DEMO de la Fase 4

El destacado de un evento usa un selector de 1 a 30 días. El servidor lee `featured_daily_rate_cents`; si la cuenta tiene un paquete activo, aplica primero los días gratuitos restantes y después el porcentaje de descuento guardado en la instantánea del paquete. El organizador solo elige la fecha, los días y el resultado `approved` o `rejected`; nunca envía tarifa ni total.

El paquete empresarial usa `package_annual_price_cents` y los beneficios DEMO de `site_settings`. La compra aprobada crea un paquete activo por 365 días; la rechazada crea `payment_failed`. No hay datos de tarjeta, cobro real ni proveedor externo. Mientras el responsable no configure el precio, la interfaz muestra «Precio por definir».

## Propuesta de interfaz

`Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria.`

Los controles representan un resultado de pago ficticio y **no** deben usar campos que aparenten capturar tarjetas reales. Guardar en DB el resultado del pago de prueba y los importes.

## Pasos del checkout y del panel de pago simulado (Fase 2)

El indicador de la compra tiene tres pasos: **Tus datos → Pago (o Confirmación, si es gratuito) → Boletos**.

1. **Tus datos** (`/checkout/`): nombre, correo y teléfono opcional para WhatsApp (8 dígitos de El Salvador; se guarda como `+503XXXXXXXX`). El botón principal lleva el monto: «Pagar $X · pago de demostración» o «Confirmar registro gratuito». Al enviarlo se crea la orden `pending` con precios, comisión y cupo calculados en servidor.
2. **Pago simulado** (solo si el total es mayor que cero), en el componente `SimulatedPaymentPanel`. Muestra siempre el aviso exacto de modo demostración y mueve el foco al título de cada paso:
   - **Resumen:** subtotal, «Comisión DEMO (5 %)» y «Total a pagar (simulado)». Botón «Continuar con el pago simulado».
   - **Resultado de la simulación:** dos opciones, «Simular pago aprobado» y «Simular pago rechazado». Sin elegir una, el panel pide que se elija y no envía nada; «Volver al resumen» regresa sin perder la orden. Botón «Confirmar pago simulado».
   - **Procesando** y **Resultado registrado:** se muestran mientras el servidor confirma. Un segundo clic no repite el envío.
   - No hay campos de tarjeta, vencimiento, CVV ni datos bancarios en ningún paso.
3. **Registro gratuito:** no hay panel; un solo botón «Confirmar registro gratuito» confirma sin pasarela.
4. **Resultado** en la misma pantalla: «Orden confirmada» (con el número de orden, «Pago de demostración: Aprobado (simulado)» en pagos y el enlace «Ver mis boletos») o «Pago rechazado» («Pago de demostración: Rechazado (simulado)», sin enlace a boletos).

**Reintento sin duplicar:** el navegador genera un `request_id` por sesión de compra (se guarda en `sessionStorage` y cambia si cambia la selección). Repetir el envío con el mismo `request_id` devuelve la misma orden y el mismo token; «Reintentar» repite la misma confirmación, que es idempotente (sin boletos duplicados ni doble consumo de cupo).

**Errores recuperables:** sin cupo o evento no disponible muestran «Volver al evento»; un fallo de red o del servidor muestra «Reintentar». Nunca se muestra el texto crudo del servidor.

## Comprobante, envío simulado y post-compra

La página privada `/confirmacion/[orderId]/[token]/` (con `noindex`) reúne:

- **Boletos** con su QR y descarga SVG por boleto; impresión.
- **Comprobante simulado:** número de orden, método «Pago de demostración», estado («Aprobado (simulado)», «Rechazado (simulado)» o «Gratuito (sin pago)»), referencia de pago y fecha de confirmación cuando existen, subtotal, comisión DEMO y total. Se puede imprimir y declara que no corresponde a un cobro real.
- **Envío del boleto (simulado):** «Boleto enviado a a***@dominio · Simulado» y, si el comprador dio teléfono, «Boleto enviado por WhatsApp a +503 ****-1234 · Simulado». No se envía ningún mensaje real; son los registros de la tabla `notification_outbox`.
- **Agregar al calendario:** enlace a `/calendario/[eventId]/`, que descarga un `.ics` del evento publicado (también está en la ficha).
- **Compartir por WhatsApp:** abre `https://wa.me/?text=…` con título, fecha y URL pública de la ficha del evento; nunca incluye el enlace privado de la confirmación.

### Outbox de notificaciones simuladas

- Al confirmar una orden (gratuita o con pago aprobado) la ruta de confirmación encola, una sola vez, el boleto por correo y, si hay teléfono, por WhatsApp. Un reintento sobre una orden ya procesada o un pago rechazado no encola nada.
- También encola el recordatorio `reminder_24h` con `scheduled_for` igual al inicio del evento menos 24 horas; si ese instante ya pasó, no se crea. Nada lo envía: en la demostración solo queda registrado.
- Cada fila guarda únicamente el destino **enmascarado**, nunca el correo ni el teléfono completos, y la restricción `unique (order_id, channel, template)` evita duplicados.
- Solo `service_role` puede leer y escribir la tabla; el navegador no tiene acceso. Un fallo del outbox nunca revierte la compra.

## Comisión

El modelo académico habla de comisión por venta, sin cifra definitiva. Configuración demo sugerida: `DEMO_COMMISSION_PERCENT=5`, sujeta a aprobación del equipo. Declarar siempre el supuesto y exhibir monto antes del botón final. Nunca atribuir 5% a una política real de C3.

## Forma de comprobarlo

Pruebas automatizadas: `npx playwright test tests/e2e/purchase-flow.spec.ts --project=chromium` recorre gratis, aprobado y rechazado en 1280 px y 375 px con la API de órdenes simulada (sin escrituras). `REAL_PURCHASE=1 npx playwright test tests/e2e/purchase-flow-real.spec.ts --project=chromium` crea órdenes reales de demostración (correo `e2e-real-*@example.test`), comprueba comprobante, envío simulado, `.ics` y WhatsApp en la confirmación, y anota los ids de orden; solo se ejecuta con confirmación del responsable.

Adjuntar al reporte de la materia tres evidencias (idealmente video + capturas + IDs de orden de DEMO) y un video completo móvil: evento gratis confirmado, pago aprobado y pago rechazado. Si profesor exige sandbox real, agregar como tarea P1 con credenciales externas y revalidar flujos.
