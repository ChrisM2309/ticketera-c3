# Plan: tarifa gratis y flujo de compra móvil

## Objetivo

Eliminar el cargo fijo de $0.50 por cada entrada gratuita, conservarlo para cada entrada pagada y reducir los clics redundantes del checkout. Corregir los botones que se desbordan en móvil y dejar compartir/calendario después de la compra.

## Decisiones

- La orden calcula en servidor una comisión para el organizador de 6 % del subtotal pagado, redondeada al centavo por orden, más $0.50 por unidad de entrada con precio mayor que cero. Las entradas gratuitas no generan porcentaje ni cargo fijo. El comprador sigue pagando solo el subtotal.
- Las órdenes históricas conservan sus importes y su comisión guardada. La migración solo modifica la función para órdenes nuevas.
- El formulario de datos inicia la compra pagada en Wompi automáticamente al crear la orden. El registro gratuito se confirma automáticamente. Si la llamada falla, se muestra una acción de reintento.
- La ficha del evento se concentra en selección y compra. Compartir, calendario y encuesta se quedan en la confirmación, con etiquetas cortas y adaptables en móvil.

## Tareas

1. Escribir pruebas DB que fallen para entradas gratis y órdenes mixtas; reemplazar la función en una migración posterior a `20261120100000_organizer_fee.sql`, contando solo cantidades con `price_cents > 0`, sin cambiar órdenes existentes.
2. Probar la acción única de checkout: datos → Wompi y registro gratuito → confirmación; conservar reintentos idempotentes y una ruta segura a los boletos después de Wompi.
3. Acortar las etiquetas principales, quitar compartir/calendario de la ficha del evento y ajustar las acciones de confirmación para que no desborden a 320 px.
4. Actualizar la decisión y la documentación de checkout para reemplazar la regla anterior que incluía entradas gratis.

## Verificación

- Unitarias y DB: gratis $0, pagadas 6 % + $0.50 por unidad pagada, mezcla, reintento e importe histórico.
- E2E: pago aprobado, registro gratis y error recuperable; revisar ficha/confirmación a 320–375 px y 1280 px sin scroll horizontal.
- Ejecutar lint y typecheck tras los cambios.
