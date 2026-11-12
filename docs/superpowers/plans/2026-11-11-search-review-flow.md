# Plan: filtros claros y revisión de compra

## Alcance

Reducir el peso visual de los filtros en búsqueda y categorías, mostrar opciones concretas cuando no haya resultados, e insertar una revisión de entradas, comprador y total antes de crear una orden.

## Decisiones

- Los filtros usan `<details>` nativo, cerrado cuando no hay filtros activos y abierto al aplicar filtros. Mantiene formularios GET y funciona sin JavaScript.
- Los estados vacíos ofrecen volver a la categoría/búsqueda completa y atajos a opciones útiles; no alteran la consulta existente.
- El checkout valida los datos y pasa a una pantalla de revisión. Solo «Confirmar y pagar» o «Confirmar registro gratis» crea la orden; «Editar datos» vuelve al formulario.
- El servidor sigue siendo autoridad para precios y cupos. El resumen del cliente es informativo y la creación de orden vuelve a validar todo.

## Implementación y verificación

- [x] Filtros plegables con apertura automática al tener filtros activos.
- [x] Sugerencias y recuperación para búsquedas/categorías sin resultados.
- [x] Paso de revisión con evento, entradas, datos de comprador y total.
- [ ] Pruebas de UI/regresión para el resumen y filtros; lint, typecheck y pruebas relacionadas.
- [ ] E2E del flujo; requiere servidor y catálogo disponibles en el entorno local.
