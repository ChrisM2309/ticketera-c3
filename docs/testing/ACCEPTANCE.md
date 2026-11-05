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
- [x] Compra de prueba en la base real de producción (gratis, aprobado, rechazado y reintento), dentro de una transacción revertida: resultados según lo esperado y sin órdenes, pagos ni boletos residuales (verificado con consulta de solo lectura).
- [x] Compra gratis por la ruta HTTP en producción: orden `1b0c6a87-bca4-4acd-a983-e28d93012d35` confirmada con 1 boleto; el reintento responde `alreadyProcessed` sin duplicar.
- [ ] Pagos aprobado y rechazado por HTTP: pendiente. Solo están probados en la base, dentro de una transacción revertida.

### T12 — Confirmación, QR y descarga

- [x] Página `/confirmacion/[orderId]/[token]/`: estado, número de orden, evento, fecha, modalidad, total DEMO y un boleto con QR por cada entrada.
- [x] Descarga de cada QR como SVG y botón para imprimir.
- [x] Recuperación por enlace: el QR se recalcula desde el token y no se guarda en claro (D-29).
- [x] Token o identificadores mal formados y órdenes inexistentes responden 404 con el mismo resultado (sin enumeración).
- [x] Pruebas: recuperación de QR en unitarias; en base, el QR emitido por la RPC se recupera con el token (round-trip en PGlite), los ids quedan persistidos y los ids repetidos se rechazan.
- [ ] Compra real por HTTP con la página de confirmación: pendiente de aplicar la migración `20261105130000` en producción. Sin ella, la RPC de producción no acepta `p_tickets`.

### T14 — Autenticación y roles

- [x] `/panel/` y `/admin/` redirigen a `/ingresar/` sin sesión (proxy y comprobación en servidor), verificado en el build de producción (307).
- [x] Un organizador no entra a `/admin/`; el rol se lee con RLS en cada página.
- [x] RLS y roles en PGlite: organizador sin acceso a eventos ajenos, anon sin borradores ni pendientes, admin con acceso total, nadie se autopromueve en `profiles`.
- [ ] Inicio de sesión real contra Supabase Auth: pendiente. Requiere cuentas de prueba que el dueño del proyecto crea en Supabase Auth.

### T15 — Publicar evento

- [x] Formulario en `/panel/eventos/nuevo/` con datos, fecha en hora de El Salvador, modalidad, ciudad, lugar, portada https y hasta cuatro tipos de entrada.
- [x] La validación corre en el servidor y los precios se guardan en centavos.
- [x] `create_organizer_event` crea el evento como `pending` con sus entradas; un evento pendiente no aparece en el catálogo público (pruebas en PGlite, 6/6).
- [x] Otro organizador o un usuario sin organización no puede insertar (RLS).
- [ ] Envío real desde una cuenta de organizador: pendiente de las cuentas de prueba.

### T13 — Pruebas del flujo de compra

- [x] Escritorio: Home → categoría → ficha → carrito → checkout → confirmación, con registro gratuito, pago DEMO aprobado y pago DEMO rechazado (`tests/e2e/purchase-flow.spec.ts`, 3/3).
- [x] Celular a 375 px: registro gratuito de extremo a extremo sin desbordamiento horizontal (1/1).
- [x] El catálogo y la ficha salen de la base real. Crear y confirmar la orden se simulan para no escribir en producción (D-31).
- [x] Prueba con la API real y la base real (`tests/e2e/purchase-flow-real.spec.ts`, 4/4, con `REAL_PURCHASE=1`). Ejecutada el 2026-11-05 contra el servidor de producción local (`next start`) y la base del proyecto. No simula la API.
  - Gratis en escritorio: orden `29577f25-12f2-4794-8553-39234b5bdb02`, `confirmed`, 1 boleto, total 0.
  - Pago DEMO aprobado: orden `678e3653-72f5-454b-b1d2-be9d3c14d6c1`, `confirmed`, 2 boletos, pago `demo_approved`, total 2100 centavos.
  - Pago DEMO rechazado: orden `376715ca-e0cd-4db7-a4a2-4220b8ea3845`, `failed`, 0 boletos, pago `demo_rejected`, cupo intacto.
  - Gratis en 375 px: orden `4052c2ec-d11d-437e-bbc6-600e370c905d`, `confirmed`, 1 boleto.
  - Las cuatro órdenes tienen correo `e2e-real-*@example.test`. Se dejaron en la base como registro; no se borraron.

### T16 — Moderación mínima

- [x] `review_organizer_event`: el administrador aprueba o rechaza solo eventos pendientes; un evento ya publicado no cambia y uno cuya fecha pasó no se publica (`tests/db/review-organizer-event.test.ts`, 9/9 con los conteos).
- [x] Un organizador no puede aprobar, rechazar ni publicar su evento con un UPDATE, y no revisa ni edita eventos ajenos (RLS y pruebas de base).
- [x] El organizador ve los boletos emitidos de sus propios eventos; los de otro organizador no aparecen (`organizer_event_ticket_counts`).
- [x] Migración `20261105150000` aplicada en producción (2026-11-05) y verificada en solo lectura: funciones SECURITY DEFINER, permisos de EXECUTE correctos y migración registrada en remoto.
- [x] Aprobación real (2026-11-05): `empresa@demo.c3` envió «CONGRESO DE IA 2027!!!» (organizador DEMO Uno); `admin@demo.c3` lo aprobó desde `/admin/`. Estado `published`, sin pendientes, visible en `/congresos/` y `/congresos/inteligencia-artificial/` de producción.
- [x] `/admin/` con sesión real: lista de eventos pendientes y órdenes recientes, con Aprobar y Rechazar.

### T17 — Revisión integral

- [x] Secretos: el repo y los chunks JS de producción no contienen credenciales; `service_role` solo en servidor (revisión de solo lectura).
- [x] Permisos: `create_pending_order` deja de ser ejecutable por `anon` con la migración `20261105160000` (`tests/db/privileges.test.ts`). Aplicada en producción el 2026-11-05 y verificada en solo lectura.
- [x] SEO: el catálogo demo lleva `noindex`; `robots.txt` y `sitemap.xml` correctos; rutas privadas excluidas.
- [x] Rutas: CTA, menú y búsqueda apuntan a rutas existentes; `/buscar/` responde.
- [x] Cabeceras: `X-Content-Type-Options`, `Referrer-Policy` y `X-Frame-Options` en todas las rutas.
- [ ] Flujo E2E con API y base reales (T13). Bloquea el cierre de T17.
- [ ] Pendientes registrados: CSP, `owner_user_id` visible a usuarios autenticados, límite de tasa en órdenes, validación de imagen y fechas en `create_organizer_event`.

### T18 — Publicación

- [x] Producción en `https://demo.ticketera.c3.com.sv`: HTTPS con HSTS y redirección desde http.
- [x] Catálogo, categorías y fichas responden 200 en producción; rutas inexistentes responden 404.
- [x] Sin credenciales en el HTML ni en los chunks JS de producción.
- [x] Validación final: T13 cerrado con compras reales, y T17 revisado en código y producción. Terminado.

### T23 — Integración del sistema visual de marca C3 (extra, fuera de plan)

- [x] Plan escrito antes de cambiar nada: `docs/superpowers/plans/2026-11-05-integracion-sistema-visual.md`. Documento de marca copiado en `docs/design/SISTEMA-VISUAL-C3-2026-11.md`.
- [x] Decisiones registradas en D-33 (línea Conecta, acción violeta, CTA de compra, neutrales, radios, sombras, modo oscuro, `info`, movimiento).
- [x] Contraste AA comprobado por prueba: texto inverso sobre acción en claro (6.35:1) y oscuro (4.82:1); hover oscuro 6.99:1; foco y enlace; borde de campos 3:1 en claro (`tests/unit/design-tokens.test.ts`).
- [x] Ninguna clase usa un token que no existe (`text-compite-claro` retirado) ni el turquesa como acción (`tests/unit/no-undefined-tokens.test.ts`, `tests/unit/button-variants.test.ts`).
- [x] Campos con radio de 6 px en un solo componente compartido (`tests/unit/field-class.test.ts`).
- [x] Suite completa: 30/30 archivos. Lint, typecheck y build sin errores.
- [x] E2E con la API simulada: 16/16 (`purchase-flow`, `cart`, `checkout`, `home`, `catalog`).
- [x] Capturas antes y después a 390 y 1280 px (`scratchpad`): sin desbordamiento horizontal; botones de compra y distintivo DEMO legibles. Revisión visual a cargo del responsable.
- [ ] Pendientes fuera de alcance (D-33): modo oscuro global, token `info`, voz «tú», auditoría de contraste con herramienta, manual de marca oficial.

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
| Evento gratis | Orden confirmada y QR | `tests/e2e/purchase-flow-real.spec.ts` | `29577f25-12f2-4794-8553-39234b5bdb02` (1 boleto) | Ejecutado el 2026-11-05 |
| Pago DEMO aprobado | Orden confirmada y QR | `tests/e2e/purchase-flow-real.spec.ts` | `678e3653-72f5-454b-b1d2-be9d3c14d6c1` (2 boletos, `demo_approved`) | Ejecutado el 2026-11-05 |
| Pago DEMO rechazado | Orden fallida, sin QR | `tests/e2e/purchase-flow-real.spec.ts` | `376715ca-e0cd-4db7-a4a2-4220b8ea3845` (`failed`, 0 boletos, `demo_rejected`) | Ejecutado el 2026-11-05 |

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
