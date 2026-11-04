# Plan de pruebas y aceptación

## Criterios de salida P0

- [ ] App compila y despliega en Vercel con HTTPS y dominio propio.
- [ ] Logo lleva al home y navbar no contiene 'Inicio'.
- [ ] Doce tipos de evento en orden por keyword del Excel.
- [ ] Diez eventos demo con fecha, lugar/modalidad, organizador y precio.
- [ ] Filtros funcionales por tipo, tema, fecha, ciudad, modalidad y gratis/de pago.
- [ ] Categorías/subcategorías con URLs estables, metadata y breadcrumbs.
- [ ] Fichas con agenda, imágenes, CTA visible, cantidad de entradas y disponibilidad.
- [x] Carrito de un evento; subtotal, comisión y total calculados en servidor.
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

### T09 — Datos de comprador y orden pendiente

- [x] Formulario de invitado con nombre y correo obligatorios, labels visibles, atributos nativos y errores anunciados.
- [x] `POST /api/checkout/orders` acepta solo IDs/cantidades/datos de comprador y descarta totales recibidos desde navegador.
- [x] La RPC protegida vuelve a leer el catálogo, valida evento/tipo/cupo/límite y persiste una orden `pending` con snapshots de precio e importes en centavos.
- [x] El token de checkout tiene 32 bytes aleatorios; solo su SHA-256 llega a DB y el original permanece en `sessionStorage` tras el éxito.
- [x] DB (7/7), unitarias (4/4), E2E local de carrito+checkout (6/6), lint, typecheck, suite completa (106/106) y build pasaron.
- [ ] Confirmación atómica, actualización de inventario y boletos: queda para T10; pago gratuito/aprobado/rechazado: T11.

La corrida E2E completa quedó en `5/7` antes del refuerzo de accesibilidad; la corrida enfocada actual de carrito+checkout queda en `6/6`. Los dos casos heredados de `tests/e2e/home.spec.ts` siguen sin cargar catálogo/ficha porque el proyecto Supabase remoto no respondió. El build de T09 sí pasó cuando Next tuvo permiso para escribir su caché local.

### T10 — Confirmación transaccional e inventario

- [x] RPC `confirm_order` (`supabase/migrations/20261104140000_confirm_order.sql`): en una sola transacción confirma o rechaza la orden, valida evento, tipo activo, máximo por orden y cupo, descuenta `quantity_sold`, emite un boleto por unidad y registra el pago DEMO.
- [x] Reintento o doble clic sobre una orden procesada: devuelve `already_processed` sin boletos nuevos ni descuento de cupo.
- [x] Pago DEMO rechazado: orden `failed`, pago `demo_rejected`, 0 boletos y cupo intacto.
- [x] Pruebas `tests/db/confirm-order.test.ts` (13/13): gratis, aprobado, rechazado, reintento, token incorrecto, sobreventa secuencial, tipo inactivo, evento archivado, importe incoherente, cantidad y formato de QR, permisos.
- [ ] Concurrencia real con dos conexiones simultáneas: pendiente. PGlite usa una sola conexión y Docker no está disponible para levantar Postgres local. La exclusión mutua se apoya en `SELECT ... FOR UPDATE` sobre la orden y los tipos de entrada, pero no está demostrada en paralelo.

### T11 — Pago de demostración

- [x] Gratis: «Confirmar registro gratuito» confirma sin pasarela y muestra los boletos emitidos (E2E con API simulada).
- [x] Aprobado: «Simular pago aprobado» confirma la orden, registra el pago `demo_approved` y emite boletos (E2E simulado y pruebas de base de T10).
- [x] Rechazado: «Simular pago rechazado» deja la orden `failed` y muestra que no hubo boletos ni descuento de cupo (E2E simulado y pruebas de base de T10).
- [x] Un error del servidor se anuncia y el comprador puede reintentar (E2E).
- [x] Validación de la petición y mapeo del resultado: `tests/unit/payment.test.ts` (9/9).
- [ ] Prueba con Supabase real y clave `service_role`: pendiente. Este entorno no tiene `SUPABASE_SERVICE_ROLE_KEY` y el proyecto remoto no respondió. La ruta devuelve 400 ante entrada inválida y 503 sin la clave, comprobado con `curl`.

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
