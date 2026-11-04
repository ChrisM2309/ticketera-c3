# Plan de pruebas y aceptación

## Criterios de salida P0

- [ ] App compila y despliega en Vercel con HTTPS y dominio propio.
- [ ] Logo lleva al home y navbar no contiene 'Inicio'.
- [ ] Doce tipos de evento en orden por keyword del Excel.
- [ ] Diez eventos demo con fecha, lugar/modalidad, organizador y precio.
- [ ] Filtros funcionales por tipo, tema, fecha, ciudad, modalidad y gratis/de pago.
- [ ] Categorías/subcategorías con URLs estables, metadata y breadcrumbs.
- [ ] Fichas con agenda, imágenes, CTA visible, cantidad de entradas y disponibilidad.
- [ ] Carrito de un evento; subtotal, comisión y total calculados en servidor.
- [ ] Registro gratuito sin cuenta => orden confirmada y ticket QR persistido.
- [ ] Pago DEMO aprobado => orden confirmada, `payments` registrado, QR emitido.
- [ ] Pago DEMO rechazado => orden fallida, no emisión de tickets.
- [ ] Doble clic/reintento no duplica tickets. Sin sobreventa en concurrencia.
- [ ] Confirmación guest segura con token; no enumeración de órdenes.
- [ ] Botón descarga/imprime boleto QR (sin email obligatorio).
- [ ] Flujo completo usable en viewport móvil.
- [ ] Solo eventos publicados aparecen en catálogo público.

## Evidencia por tarea

### T08 — Carrito de un evento

- [x] Carrito local de un solo evento con varios tipos de entrada, edición de cantidades y eliminación.
- [x] Límites provisionales derivados de cupos disponibles y `max_per_order`; snapshot local defensivo en `localStorage`.
- [x] Subtotal, comisión DEMO configurable (supuesto por defecto: 5 %) y total provisional calculados en centavos, con pruebas unitarias.
- [x] E2E del carrito local: `3 passed` con estado lleno, persistencia, estado vacío y query inválida.
- [ ] Recalculo autoritativo en servidor y confirmación de orden: queda para T09.

La corrida E2E completa del repositorio quedó en `3/5`: los tres escenarios de T08 pasan; los dos escenarios heredados de `tests/e2e/home.spec.ts` no pudieron cargar catálogo/ficha porque el proyecto Supabase remoto no respondió en este entorno. `npm run build` también quedó bloqueado antes de la compilación por la descarga de Montserrat y Poppins desde Google Fonts; `npm run lint`, `npm run typecheck` y `npm test -- --run` sí terminaron con código 0 (95/95).

## Criterios de salida P1

- [ ] Organizador inicia sesión.
- [ ] Organizador crea evento y tipo(s) de entrada; queda `pending`.
- [ ] Admin aprueba evento; aparece catálogo público.
- [ ] Organizador ve sus eventos y número de registros.
- [ ] Organizador no puede modificar eventos ajenos (probar permisos/RLS).

## Casos de prueba automatizados recomendados

**Unit (Vitest):** redondeo de comisión y precio en centavos; cantidad >=1 <= máximo; carrito single-event; normalización y resolución de slugs; reglas de estados.

**Integration (DB):** confirmación idempotente; cantidad de tickets = cantidad comprada; no sobreventa al ejecutar dos compras simultáneas; RLS de acceso; token no adivinable.

**E2E (Playwright):** Home→categoría→evento→gratis→QR; Home→evento de pago→pago aprobado→QR; evento→pago rechazado→sin QR; organizador→pending→admin→published; móvil.

## Tres compras documentadas

| Escenario | Resultado esperado | ID prueba | Evidencia | Estado |
|---|---|---|---|---|
| Evento gratis | Orden confirmada y QR | pendiente | pendiente | No ejecutado |
| Pago DEMO aprobado | Orden confirmada y QR | pendiente | pendiente | No ejecutado |
| Pago DEMO rechazado | Orden fallida, sin QR | pendiente | pendiente | No ejecutado |

**Nunca** marcar estas filas como exitosas si no se han ejecutado.

## Investigación y testeo UX requerido por la PPT

La presentación del equipo propone **5 usuarios, 3 tareas y 3 métricas** (éxito, tiempo, errores). Tareas: comprar un workshop de IA; encontrar evento gratis en San Salvador; encontrar una entrada comprada.

Guardar resultados genuinos en anexo: participante (anonimizado), dispositivo, tarea, completada/no, duración, errores, comentarios, cambios propuestos y evidencia del cambio. Los resultados siguen **pendientes** hasta que se realicen pruebas.

## Checklist de presentación

- [ ] Capturas de la competencia revisada, con fecha/URL.
- [ ] Demostración de SEO on-page y árbol de categorías.
- [ ] Video de 1–2 min mostrando compra y confirmación, como respaldo.
- [ ] PPT con decisiones justificadas por keyword research, perfiles, entrevistas o testeo.
- [ ] Modelo de marketing: objetivos, canales, presupuesto y proyecciones sin inventar datos medidos.
