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

## Propuesta de interfaz

`Modo demostración: aquí no se cobrará dinero ni se solicitará información bancaria.`

Los controles representan un resultado de pago ficticio y **no** deben usar campos que aparenten capturar tarjetas reales. Guardar en DB el resultado del pago de prueba y los importes.

## Comisión

El modelo académico habla de comisión por venta, sin cifra definitiva. Configuración demo sugerida: `DEMO_COMMISSION_PERCENT=5`, sujeta a aprobación del equipo. Declarar siempre el supuesto y exhibir monto antes del botón final. Nunca atribuir 5% a una política real de C3.

## Forma de comprobarlo

Adjuntar al reporte de la materia tres evidencias (idealmente video + capturas + IDs de orden de DEMO) y un video completo móvil: evento gratis confirmado, pago aprobado y pago rechazado. Si profesor exige sandbox real, agregar como tarea P1 con credenciales externas y revalidar flujos.
