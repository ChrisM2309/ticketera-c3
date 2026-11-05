# Backlog de implementación — Ticketera C3

**Organización:** por áreas y funcionalidades, **sin fechas ni duración asignada**.  
**Objetivo:** terminar funcionalidades verificables y avanzar según disponibilidad, sin perder el flujo completo de compra.  
**Agentes:** documento compartido para Codex, Claude Code o cualquier herramienta que lea `AGENTS.md`.

## Cómo usar este backlog

- **P0 — Núcleo:** necesario para que el visitante complete el recorrido de compra con datos persistidos y QR.
- **P1 — Marketplace mínimo:** publicación por organizadores, revisión y gestión mínima.
- **P-A — Entrega académica:** tareas necesarias para la rúbrica de Comercio Electrónico y Mercadeo Digital; pueden avanzar en paralelo al código.
- **P2 — Opcional:** mejoras después de cumplir los criterios anteriores.
- **Estados:** `Pendiente` → `En curso` → `Bloqueado` / `En revisión` → `Terminado`. Al terminar, registrar evidencia o comando de prueba; no marcar por estimación.
- Una tarea está **disponible** cuando sus dependencias están completas. Se puede cambiar el orden de tareas independientes; el orden de las áreas es una sugerencia, no un calendario.

## Tablero maestro

| ID | Área | Funcionalidad | Prioridad | Depende de | Estado |
|---|---|---|---|---|---|
| T01 | Fundamentos | Proyecto Next.js y herramientas | P0 | — | Terminado |
| T02 | Fundamentos | Diseño base, navegación, responsive | P0 | T01 | Terminado |
| T03 | Datos | Supabase, migraciones, RLS y seed | P0 | T01 | Terminado |
| T04 | Catálogo | Home con datos reales de demo | P0 | T02, T03 | Terminado |
| T05 | Catálogo | Categorías, rutas y filtros | P0 | T03, T04 | Terminado |
| T06 | SEO | Metadatos, sitemap y reglas de indexación | P0 | T05 | Terminado |
| T07 | Catálogo | Ficha del evento y selección de entradas | P0 | T03, T05 | Terminado |
| T08 | Compra | Carrito de un evento | P0 | T07 | Terminado |
| T09 | Compra | Datos de comprador y creación de orden | P0 | T03, T08 | Terminado |
| T10 | Compra | Confirmación transaccional e inventario | P0 | T09 | En curso |
| T11 | Compra | Pagos demo gratis/aprobado/rechazado | P0 | T10 | Terminado |
| T12 | Boletos | Confirmación, QR y descarga | P0 | T11 | Terminado |
| T13 | Pruebas | Flujo de compra end-to-end | P0 | T12 | Terminado |
| T14 | Organizadores | Inicio de sesión y roles | P1 | T03 | En curso |
| T15 | Organizadores | Formulario de publicación de evento | P1 | T07, T14 | En curso |
| T16 | Administración | Revisión, aprobación y gestión mínima | P1 | T15 | Terminado |
| T17 | Calidad | Revisión funcional, seguridad y responsive | P0 | T13; T16 para B2B | Terminado |
| T18 | Publicación | Vercel, variables y dominio existente | P0 | T01; validar al final con T17 | Terminado |
| T23 | Extra (fuera de plan) | Integración del sistema visual de marca C3 | P0 | T02 | Terminado |
| T19 | Evidencias | Pruebas de usabilidad y competidores | P-A | T04, T05, T07, T12 | Pendiente |
| T20 | Evidencias | Wireframes y justificación visual | P-A | T02; revisar tras T19 | Pendiente |
| T21 | Evidencias | SEO y marketing documental | P-A | T05, T06 | Pendiente |
| T22 | Presentación | Capturas, video de compra y respaldo | P-A | T13, T18, T19, T20, T21 | Pendiente |

## Área A — Fundamentos y sistema visual

### T01 · Inicializar proyecto [P0]
**Qué hacer:** Next.js App Router, TypeScript `strict`, Tailwind, shadcn/ui; configurar estructura `src/`, scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`; `.env.example` y `.gitignore`. Mantener documentación en la raíz.

**Terminado cuando:** el proyecto arranca y `build`, `lint` y `typecheck` funcionan; no hay secretos versionados.

### T02 · Aplicar marca y layout [P0]
**Qué hacer:** tokens de marca del manual C3, tipografías, header/footer, navegación por categorías, búsqueda visible, distintivo `Proyecto académico / DEMO`, componentes reutilizables y responsive.

**Terminado cuando:** el logo lleva al Home, no hay enlace «Inicio», el menú es usable en móvil y se revisa contraste/teclado.

## Área B — Base de datos y catálogo

### T03 · Supabase, esquema y datos semilla [P0]
**Qué hacer:** migraciones para perfiles, organizadores, categorías/temas, eventos, tipos de entrada, órdenes, partidas, pagos y boletos; RLS y funciones transaccionales necesarias; seed de **12 categorías y 8–10 eventos DEMO** (gratis/pago, presencial/virtual, varias ciudades).

**Terminado cuando:** las migraciones se aplican desde cero, el seed se reproduce y un usuario público solo lee eventos `published`.

### T04 · Home orientado a venta [P0]
**Qué hacer:** evento destacado, próximos eventos, buscador/filtros rápidos, categorías ordenadas por volumen según Excel, eventos gratuitos y CTA «Publicar evento».

**Terminado cuando:** se muestran eventos de Supabase; los enlaces a rutas aún no construidas quedan documentados y se resuelven en T05, T07, T14, T15 y T08 (criterio ajustado, D-20).

### T05 · Categorías, filtros y URLs [P0]
**Qué hacer:** resolvedor dinámico de tipos/temas/subcategorías según `docs/architecture/SEO_ROUTES.md`; filtros por ciudad, modalidad, fecha, tema y precio; breadcrumbs, resultados y estados vacíos.

**Terminado cuando:** `/congresos/` y `/congresos/inteligencia-artificial/` funcionan; rutas inexistentes devuelven 404; las 12 categorías son navegables.

### T06 · SEO técnico y on-page [P0]
**Qué hacer:** title, description, H1, canonical, sitemap, robots, datos estructurados Event cuando corresponde y `noindex` en privadas/sin contenido y demos que no deben presentarse como eventos reales.

**Terminado cuando:** metadatos renderizados son correctos y las rutas no indexables quedan excluidas del sitemap.

### T07 · Ficha del evento [P0]
**Qué hacer:** foto, fecha y horario, modalidad/lugar, organizador, agenda, ponentes cuando existan, precio, cupos, tipos de entrada, relacionados y CTA visible.

**Terminado cuando:** se puede escoger tipo y cantidad válidos; el servidor rechaza eventos no publicados o sin cupos.

## Área C — Carrito, checkout y emisión de boletos

### T08 · Carrito [P0]
**Qué hacer:** carrito de **un evento por orden**, con varios tipos de boleto; editar cantidades, eliminar, ver subtotal/comisión/total provisional; persistencia local temporal.

**Terminado cuando:** cantidades y límites se validan y el cálculo se comprueba con pruebas unitarias.

### T09 · Crear orden como invitado [P0]
**Qué hacer:** formulario accesible, nombre y email requeridos, validación de servidor, recálculo de precios en centavos, `order_items` con snapshot del importe.

**Terminado cuando:** se guarda una orden pendiente correcta sin exigir cuenta y sin confiar en totales enviados por cliente.

### T10 · Confirmación transaccional [P0]
**Qué hacer:** función SQL/RPC atómica que valida inventario, confirma orden y emite boletos sin duplicados. Garantizar idempotencia y manejar concurrencia.

**Terminado cuando:** doble clic/reintento no genera boletos adicionales; no hay sobreventa en pruebas de concurrencia.

### T11 · Pago de demostración [P0]
**Qué hacer:** registro gratuito sin pasarela; resultado de pago demo aprobado/rechazado mediante servidor; mensajes claros, sin campos bancarios ni cobro real.

**Terminado cuando:** gratuito y aprobado producen boletos; rechazado deja orden fallida y **cero boletos**. Se persisten los tres estados.

### T12 · Confirmación y QR [P0]
**Qué hacer:** página de confirmación por token seguro, número de orden, QR no adivinable por boleto, descarga/impresión y recuperación mediante enlace; compartir evento de forma opcional.

**Terminado cuando:** la compra muestra QR válido y una persona no puede enumerar ni ver órdenes ajenas.

### T13 · Pruebas del flujo [P0]
**Qué hacer:** Playwright u otra herramienta E2E para Home → categoría → evento → compra → confirmación; gratis, demo aprobado y demo rechazado, más uso móvil.

**Terminado cuando:** los tres escenarios pasan y se registran pruebas reales en `docs/testing/ACCEPTANCE.md`.

**Punto de control funcional:** al cerrar T01–T13 ya se puede demostrar la venta completa. No esperar a tener el dashboard para validar compras.

## Área D — Marketplace del organizador y administrador

### T14 · Autenticación y roles [P1]
**Qué hacer:** login para organizadores, permisos en servidor, rol admin y políticas RLS.

**Terminado cuando:** se bloquean rutas privadas sin sesión y cada usuario solo accede a lo autorizado.

### T15 · Publicar evento [P1]
**Qué hacer:** formulario simple para nombre, descripción, portada, fecha/hora, modalidad, lugar, categoría, tema y tipo(s) de entradas; guardar como `pending`; vista de eventos propios y estado.

**Terminado cuando:** el organizador crea un evento y este no es visible públicamente antes de aprobación.

### T16 · Moderación mínima [P1]
**Qué hacer:** tabla de eventos pendientes, aprobar/rechazar y consulta básica de órdenes; el organizador ve conteos de registros de sus propios eventos.

**Terminado cuando:** admin publica y aparece en catálogo; un organizador no puede aprobar ni editar eventos ajenos.

## Área E — Calidad, publicación y pruebas académicas

### T17 · Revisión integral [P0]
**Qué hacer:** compilar, lint, typecheck, pruebas, accesibilidad básica, 404/errores, imágenes, permisos, seguridad, SEO y recorrido móvil. Revisar la parte B2B cuando T16 esté terminada.

**Terminado cuando:** se registra evidencia verificable, fallos pendientes y su resolución; ningún flujo P0 roto.

### T18 · Publicación en Vercel [P0]
**Qué hacer:** vincular repositorio, variables de entorno, preview y producción; conectar dominio ya existente y HTTPS cuando esté disponible.

**Terminado cuando:** catálogo y compra demo funcionan en el deployment público; no se filtran credenciales.

### T19 · Investigación UX y benchmarking [P-A]
**Qué hacer:** documentar competencia con capturas/URLs y estudiar el flujo. Realizar test con **5 usuarios, 3 tareas** y métricas de éxito, tiempo y errores, según presentación del equipo.

**Terminado cuando:** hay resultados reales anonimizados, hallazgos y cambios concretos; no se inventan entrevistas ni métricas.

### T20 · Wireframes y justificación de diseño [P-A]
**Qué hacer:** elaborar las cinco pantallas pedidas (Home, Categoría, Producto, Carrito/Pasarela, Confirmación) en desktop o móvil, explicando decisiones con buyer personas, SEO, competencia y hallazgos del test.

**Terminado cuando:** los cinco wireframes coinciden con el comportamiento de la web y tienen una justificación documentada.

### T21 · Respaldo SEO y marketing [P-A]
**Qué hacer:** registrar keyword research y árbol; documentar on-page SEO, canales por buyer persona, objetivos SMART, distribución de presupuesto, captación orgánica y proyección de visitas, conversiones, ventas, ticket promedio y ROAS. No inventar datos medidos: señalar supuestos.

**Terminado cuando:** cada apartado exigido en rúbrica tiene fundamento y evidencia documentada.

### T22 · Presentación y demo [P-A]
**Qué hacer:** capturas comparativas, evidencias de compra, PPT y documentos de apoyo; grabar video corto con compra completa como respaldo. Priorizar explicación comercial/UX/SEO sobre detalles técnicos.

**Terminado cuando:** hay presentación, anexos y demo operativa respaldada, sin afirmaciones de mediciones inexistentes.

## Área F — Opcionales [P2, no bloquean entrega]

- Correo transaccional con boleto, newsletter opt-in.
- Calendario `.ics`, compartir en WhatsApp, métricas ampliadas.
- Escaneo de QR para check-in y reportes adicionales.
- Pasarela externa sandbox, **solo** si se vuelve un requisito explícito.
- Carrito con múltiples eventos, payout de organizadores, analítica avanzada.

## Reglas para avanzar entre tareas

1. **Elegir por dependencias y prioridad, no por fecha.** Si una tarea se bloquea, registrar causa y tomar otra que esté disponible.
2. **Trabajar por cortes verticales:** interfaz + persistencia + validación + prueba, evitando terminar solo pantallas vacías.
3. **No llamar «terminado» a un mock visual.** El catálogo y el checkout requieren datos persistidos y reglas de servidor.
4. **Actualizar el estado y evidencia** en este tablero al completar cada tarea. Registrar decisiones nuevas en `docs/DECISIONS.md`.
5. **Mantener P-A paralelo:** la entrega académica exige investigación y marketing aunque el código ya funcione.

## Registro de ejecución

Completar de forma incremental, sin estimaciones inventadas:

| Tarea | Evidencia (PR/commit, comando, captura o prueba) | Observaciones/bloqueos |
|---|---|---|
| T01 | Scaffold Next.js 16.4.4 en `src/`, TypeScript estricto, Tailwind/PostCSS, shadcn/ui, scripts npm, `.env.example`, estructura de features y pruebas; `npm run lint` (0), `npm run typecheck` (0), `npm test -- --run` (2/2), `npm run build` (0; `/` y `/_not-found`), `npm run test:e2e -- --list` (1 smoke), servidor dev HTTP 200 | Playwright queda configurado; la ejecución con navegador real se valida en T13. No se versionan secretos. |
| T02 | Tokens C3 v2 en `globals.css` (`@theme inline`, tema oscuro en cabecera y pie); Montserrat y Poppins con `next/font/google`; cabecera con logo a Home, búsqueda visible, distintivo DEMO, 12 categorías en orden del Excel y menú móvil con `aria-expanded`; pie DEMO; `npm run lint` (0), `npm run typecheck` (0), `npm test -- --run` (6/6), `npm run build` (0; `/` y `/_not-found`). Revisión en navegador (producción local): 375 px sin desbordamiento horizontal, botón de menú de 44 px, panel con 12 categorías y 3 enlaces de cuenta, foco visible con teclado y textos con contraste ≥5.2:1 | Enlaces a categorías, `/buscar`, `/publicar`, `/mis-boletos` y `/carrito` aún no tienen ruta: responden 404 hasta T05, T15, T14 y T08. El pie no lleva enlaces legales porque esas páginas no existen. Sin prueba con lector de pantalla. Decisión: D-14. |
| T03 | Migración `supabase/migrations/20261102120000_init_marketplace_schema.sql`: 9 tablas con RLS, FKs compuestas por tipo de categoría, checks de montos, cupos y estados, y funciones `is_admin`, `owns_organizer` y `owns_event` (security definer). Seed `supabase/seed.sql`: 12 tipos de evento, 4 temas, 3 ciudades, 2 organizadores DEMO, 10 eventos publicados (5 gratuitos y 5 de pago, 6 presenciales y 4 virtuales) y 13 tipos de entrada. Pruebas en `tests/db` con PGlite 0.5.12 (Postgres real en WASM): 29 pruebas de esquema, seed, RLS, restricciones e idempotencia. `npm test` 35/35, `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0). Página 404 personalizada (`src/app/not-found.tsx`): HTTP 404 con `noindex`, verificada en producción local | Aplicado en el proyecto Supabase remoto con `supabase db push --remote` (migraciones) y seed pegado en el SQL Editor, ambos sin errores. `supabase test db` (pgTAP) no se ejecutó porque requiere el stack local con Docker; las pruebas de base de datos viven en `tests/db` (PGlite). Decisiones D-15 a D-18. Sin tablas `topics` ni `seo_routes` (D-15). Páginas `/claude/` y `/copa/` sin sembrar hasta verificar nombres (D-18). Escrituras de órdenes y pagos quedan para T09 y T10. |
| T04 | Home con `getHomeCatalog` (anon, RLS): evento destacado, próximos (6), gratuitos (3), 12 categorías en orden del Excel y CTA «Publicar evento». Tarjetas con fecha recortada como boleto y línea de C3 (Compite, Crea, Conecta). Verificado con datos reales del proyecto remoto (`curl` como anon solo devuelve publicados). Revisado con Impeccable: detector sin hallazgos; se quitó el kicker de categoría, se corrigió el formato de precios y se redujo el movimiento a subrayado. `npm test` (unitarias 15/15), `npm run lint` y `npm run typecheck` sin errores, `npm run build` correcto | Cierre con criterio ajustado (D-20): los enlaces de categorías, buscador, fichas, `/publicar`, `/mis-boletos` y `/carrito` responden 404 hasta T05, T07, T15, T14 y T08. Decisiones D-19 y D-20. |
| T05 | Resolvedor en `src/app/[...segments]/page.tsx` con la taxonomía de `categories` (`src/features/catalog/routes.ts`): tipo, tema, ciudad y tipo + tema; `notFound()` para el resto. Filtros por GET (`ciudad`, `modalidad`, `precio`, `fecha`) en `src/features/catalog/filters.ts`, con migas, subtemas, estado vacío y canónico. `trailingSlash: true` (D-23) y filtrado en memoria (D-22). | `npm test` 71/71 (39 unitarias y 32 de base de datos, incluido el árbol de 128 rutas y los 50 eventos del seed), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0; `/[...segments]` dinámica). Servidor de producción: `/congresos/`, `/congresos/inteligencia-artificial/`, `/cloud/`, `/san-salvador/` y `/ferias-tecnologicas/` responden 200; las 12 categorías responden 200; `/congresos/zzz/`, `/zzz/`, `/publicar/` y `/carrito/` responden 404. Filtros comprobados contra los datos del proyecto remoto. Móvil de 375 px sin desbordamiento horizontal. Detector de Impeccable sin hallazgos en `src` | Las fichas enlazadas desde las tarjetas responden 404 hasta T07 (D-20). Árbol del Excel en `seo_routes` (128 rutas, D-24) y 40 eventos ficticios adicionales (50 en total). Resuelto: la migración de `seo_routes` y sus 128 filas están en producción; `/congresos/` y `/congresos/inteligencia-artificial/` responden 200 en el demo. T06 debe marcar `noindex` en listados vacíos y excluirlos del sitemap. `/buscar` sigue sin ruta (fuera de T05). |
| T06 | `src/lib/seo/indexing.ts` (reglas de sitemap y robots), `src/app/sitemap.ts` y `src/app/robots.ts`; `isDemo` con `NEXT_PUBLIC_IS_DEMO` (D-25); `noindex` en listados vacíos y en modalidad; portada con título y H1 de la palabra clave del Excel; canónicos en catálogo y portada. | `npm test` 76/76 (44 unitarias y 32 de base de datos), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0; `/robots.txt` y `/sitemap.xml` estáticos). Servidor local en modo demo: `robots.txt` con `Disallow: /`, `sitemap.xml` vacío, `noindex` en la portada y en `/ferias-tecnologicas/` (sin eventos). Detector de Impeccable sin hallazgos | Datos JSON-LD de evento quedan para T07 (fichas), solo en sitio real. La compilación adicional con `NEXT_PUBLIC_IS_DEMO=false` pasó durante T07; la verificación completa de sitemap real queda condicionada a que Supabase remoto tenga `seo_routes` sembrado. La portada en demo emite dos etiquetas `robots`; no afecta al resultado. |
| T07 | `src/app/[...segments]/page.tsx` conserva la prioridad del árbol y resuelve fichas de 2/3 segmentos; `src/features/catalog/queries.ts` lee con `anon` detalle publicado, agenda, organizador, inventario y relacionados; `src/features/catalog/tickets.ts` calcula cupo, máximo por orden y subtotal validado; `src/features/catalog/event-detail.tsx` muestra estado finalizado/agotado, metadata, canónico y JSON-LD solo fuera de demo; `src/components/catalog/ticket-selector.tsx` permite selección accesible y enlaza al carrito; `src/app/page.tsx` corrige el título DEMO de Home; `playwright.config.ts` admite puerto aislado. | `npm test` 84/84, `npm run lint` (0), `npm run typecheck` (0), `NEXT_PUBLIC_IS_DEMO=false npm run build` (0), `npm run test:e2e -- --project=chromium` (2/2 con red para Supabase), detector `impeccable detect --json` sobre las tres superficies UI (`[]`). Mejora visual posterior: portada de respaldo con fecha y hora en lugar de un recuadro sin imagen; selector con cantidad en pasos de 44 px, fila marcada al elegir entradas y enlace «Elegir entradas» en móvil; `npm test` 84/84, `npm run typecheck` y `npm run lint` (0), detector `[]` y `npm run test:e2e -- --project=chromium` (2/2) contra el servidor de desarrollo. Segunda pasada: tarjetas con foto arriba y enlace de tarjeta completa; cuando un evento no tiene `image_path`, la portada usa una foto temporal de Unsplash por línea de C3 (`src/features/catalog/images.ts`, fotos en `public/images/mockups/`; no son del evento). `npm test` 88/88 y E2E 2/2. | Se verificó con anon que el remoto tiene 10 eventos y 13 entradas; `seo_routes` existe pero está vacío. `npx supabase db push --project-ref xlpbftuvltczxdmemjti --include-all` quedó bloqueado por `AccessTokenRequiredError`; no se pudo pegar el seed sin credenciales. El código y las pruebas de T07 están completos, pero la propagación de la migración/seed remoto sigue pendiente heredada. |
| T08 | `src/features/checkout/cart.ts` define el carrito single-event con normalización de cantidades, límites por cupos/max_per_order, comisión DEMO configurable/redondeada en centavos, parseo defensivo de query y snapshot local; `src/features/catalog/queries.ts` añade `getCartEvent` para eventos publicados; `/carrito/` usa `searchParams` de Next 16 y metadata `noindex`; la UI permite editar/eliminar tipos, muestra subtotal/comisión/total provisional, conserva localStorage y deja checkout pendiente de T09. | `npm test -- --run` (95/95), `npm run lint` (0), `npm run typecheck` (0), E2E enfocado `tests/e2e/cart.spec.ts` (3/3), revisión visual desktop/375 px sin scroll horizontal. `npm run build` no pudo descargar Montserrat/Poppins desde Google Fonts; E2E completo 3/5 porque Supabase remoto no respondió para los dos casos heredados de `home.spec.ts`; `impeccable` no está instalado en el entorno. | T09 debe recalcular precios/cupos en servidor y habilitar el checkout; el botón permanece deshabilitado para no presentar un flujo inexistente. No se creó commit porque `.git` está en solo lectura y no permite `.git/index.lock`. |
| T09 | Migración `20261104130000_create_pending_order.sql` con RPC `SECURITY DEFINER` solo ejecutable por `service_role`: bloquea las filas validadas y materializa esas mismas lecturas en `orders` `pending` + `order_items`, con precios y total en centavos. `POST /api/checkout/orders` valida nombre/correo/IDs/cantidades, genera token aleatorio hasheado y usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. `/checkout/` recupera el carrito local, muestra formulario accesible con errores anunciados y conserva el token únicamente en `sessionStorage`. | `npm run lint` (0), `npm run typecheck` (0), `npm test -- --run` (106/106), `npm run build` (0), DB enfocado (7/7), unitarias enfocadas (4/4), E2E carrito + checkout (6/6) y revisión visual desktop/375 px. | E2E completo: 5/7; los dos fallos heredados de `home.spec.ts` dependen de catálogo/ficha de Supabase remoto no disponible. T10 conserva confirmación atómica/inventario y T11 los resultados de pago DEMO; T09 no emite boletos ni descuenta cupos. |
| T10 | Migración `supabase/migrations/20261104140000_confirm_order.sql` con RPC `confirm_order` (`SECURITY DEFINER`, solo `service_role`). En una transacción: valida el token de checkout, bloquea la orden y sus tipos de entrada, valida evento, tipo activo, máximo y cupo, descuenta inventario, emite un boleto por unidad con hashes QR del servidor y registra el pago DEMO aprobado o rechazado. Un reintento sobre una orden procesada no altera nada. Pruebas en `tests/db/confirm-order.test.ts` (13/13). | `npm test` 119/119 (incluye las 13 de T10), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0). | Sin cerrar: falta la prueba de concurrencia real con dos conexiones, que requiere Postgres con Docker o Supabase local (no disponible aquí). Sin ruta HTTP ni interfaz: T11. El QR en claro solo sale en la primera respuesta; su recuperación por enlace queda para T12 (D-27). |
| T11 | Ruta `POST /api/checkout/orders/[orderId]/confirm/` (servidor, `service_role`): valida el token, deriva el resultado (`free`, `demo_approved` o `demo_rejected`), genera los QR en el servidor y llama a `confirm_order`. Lógica en `src/features/checkout/payment.ts` y `src/features/ticketing/qr.ts`. `/checkout/` ofrece confirmar gratis, simular pago aprobado o rechazado, muestra el resultado y anuncia errores. Sin campos de tarjeta. Decisión D-28. | `npm test` 128/128 (9 de T11), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0, ruta nueva), E2E `tests/e2e/checkout.spec.ts` 7/7 y `tests/e2e/cart.spec.ts` 3/3 con la API simulada, detector Impeccable `[]`, `curl` a la ruta: 400 y 503 como se espera. Compra de prueba en producción revertida en transacción (gratis, aprobado, rechazado y reintento): correcta. Compra gratis por HTTP en producción: orden `1b0c6a87-bca4-4acd-a983-e28d93012d35`, 1 boleto, reintento sin duplicar. | Cerrada por decisión del dueño el 2026-11-04; los criterios de «Terminado cuando» quedan cubiertos por pruebas de base, E2E simulado y la compra gratis en producción. Sin verificar por HTTP en producción: pagos aprobado y rechazado (solo probados en base) y la concurrencia real heredada de T10. |
| T12 | Página `/confirmacion/[orderId]/[token]/` con estado, número de orden, evento, fecha, modalidad, total DEMO y un QR por boleto. Descarga de cada QR en SVG (`/confirmacion/[orderId]/[token]/qr/[ticketId]/`) e impresión. El QR se deriva del token de checkout y del id del boleto (D-29), así que el enlace lo recupera sin guardarlo en claro. Migración `20261105130000_confirm_order_ticket_ids.sql`: la RPC recibe `p_tickets`. | `npm test` 133/133 (16 archivos; incluye recuperación de QR y el round-trip de PGlite), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0; rutas nuevas), E2E checkout+carrito 10/10, `curl`: identificadores inválidos y orden inexistente responden 404. Migración aplicada en producción (firma de `confirm_order` verificada) y compra real del dueño: muestra sus QR. | Cerrada por decisión del dueño el 2026-11-04; criterios cubiertos. Sin automatizar: la prueba con Supabase real de la página de confirmación con token real fue manual (la hizo el dueño). |
| T13 | `tests/e2e/purchase-flow-real.spec.ts` (con `REAL_PURCHASE=1`, sin simular la API): compra real de punta a punta en escritorio (gratis, pago DEMO aprobado y rechazado) y en 375 px (gratis), desde Home → categoría → evento → carrito → checkout → confirmación. `tests/e2e/purchase-flow.spec.ts` queda como prueba sin escrituras (API simulada, D-31). | Ejecutado el 2026-11-05 contra el servidor local de producción (`next start`) y la base del proyecto: 4/4. Órdenes `29577f25-…` (gratis), `678e3653-…` (aprobado, 2 boletos), `376715ca-…` (rechazado, `failed`) y `4052c2ec-…` (gratis, 375 px); verificadas con consulta de solo lectura. `npm run lint` y `npm run typecheck` sin errores. | Cerrado. Las cuatro órdenes de prueba quedan en la base con correo `e2e-real-*@example.test`. |
| T14 | Login con Supabase Auth (correo y contraseña), sesión en cookies httpOnly, `src/proxy.ts` y comprobación de rol en cada página de `/panel/` y `/admin/`. Sin migración: RLS existente. Decisión D-30. | `npm test` 178/178 en la rama de T14, lint (0), typecheck (0), build (0). Redirección sin sesión verificada en el build de producción (307 a `/ingresar/`). | Sin cerrar: inicio de sesión real y cuentas de prueba, que crea el dueño del proyecto. |
| T15 | Formulario `/panel/eventos/nuevo/` con validación en servidor (`src/features/organizers/publish.ts`), acción `publishEventAction` y migración `20261105140000_create_organizer_event.sql`. El evento queda `pending`. Decisión D-32. | `npm test` 199/199 (21 nuevas: 15 unitarias y 6 de base), lint (0), typecheck (0), build (0). | Sin cerrar: envío real desde una cuenta de organizador y aplicar la migración en producción. |
| T16 | Migración `supabase/migrations/20261105150000_admin_review_events.sql`: `review_organizer_event` (solo administrador, transición `pending` → `published` o `rejected` con bloqueo de la fila; rechaza eventos ya terminados) y `organizer_event_ticket_counts` (boletos emitidos de los eventos del propio organizador). `/admin/` lista los eventos pendientes con Aprobar y Rechazar, y las últimas 20 órdenes. `/panel/` muestra los boletos emitidos de cada evento. Acciones en `src/features/organizers/review-actions.ts`. | `npx vitest run tests/db/review-organizer-event.test.ts` 9/9 y `tests/unit/review.test.ts` 7/7; `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0; `/admin` y `/panel` dinámicas). | Migración `20261105150000` aplicada en producción el 2026-11-05 con `supabase db push --linked --yes`. Verificada en solo lectura: `review_organizer_event` y `organizer_event_ticket_counts` son SECURITY DEFINER, `anon` no tiene EXECUTE y `authenticated` sí; `migrations list` coincide con local. Cerrado el 2026-11-05: `empresa@demo.c3` envió «CONGRESO DE IA 2027!!!» y `admin@demo.c3` lo aprobó desde `/admin/`. Está publicado, sin pendientes, y aparece en `/congresos/` de producción. Depende de T15, que sigue En curso por el envío real pendiente. |
| T17 | Revisión integral (workflow `review-t17-t18`: 4 revisores de solo lectura y un verificador adversarial por hallazgo). Corregido en la rama `codex/t17-revision`: (1) **media** `create_pending_order` seguía ejecutable por `anon` en producción; migración `20261105160000_revoke_anon_pending_order.sql` y prueba `tests/db/privileges.test.ts`, que emula los privilegios por defecto de Supabase. (2) **media** el catálogo demo no llevaba `noindex` (`/congresos/`); corregido. (3) **media** `/publicar`, `/buscar` y `/mis-boletos` daban 404; el CTA y el menú apuntan a `/panel/eventos/nuevo/`, existe `/buscar/` con búsqueda por texto, y «Mis boletos» sale del menú. (4) **baja** faltaban `X-Content-Type-Options`, `Referrer-Policy` y `X-Frame-Options`; añadidas en `next.config.ts`. (5) **baja** `.claude/worktrees/` sin ignorar; añadido a `.gitignore`. Verificado: `npm test` 26/26 archivos, `npm run lint`, `npm run typecheck`, `npm run build` (incluye `/buscar`) y servidor local: cabeceras, búsqueda, noindex y enlaces. Producción (solo GET): 200, 308, 307 y 404 esperados; `robots.txt` y `sitemap.xml` correctos; sin credenciales en el HTML ni en los chunks. | T13 cerrado el 2026-11-05 con compras reales. Parte B2B verificada con la prueba real de T16 (2026-11-05). Terminado al hacer merge de #21 y de los ajustes posteriores. Sin corregir y registrados: CSP (necesita pruebas con los scripts de Next); `owner_user_id` visible para cualquier usuario autenticado (requiere vista o cambio de RLS); sin límite de tasa en crear y confirmar órdenes; la RPC `create_organizer_event` no valida imagen ni fechas; el administrador ve pocos datos del evento pendiente. Migración `20261105160000` aplicada en producción el 2026-11-05 (`supabase db push --linked --yes`). Verificada en solo lectura: `anon` ya no tiene EXECUTE sobre ninguna función SECURITY DEFINER de `public`, y `service_role` sí sobre `create_pending_order`. |
| T18 | Producción `https://demo.ticketera.c3.com.sv` (Vercel, dominio existente). HTTPS con HSTS y http → https con 308; catálogo, categorías y fichas responden 200; rutas inexistentes responden 404 con `noindex`; `/panel/` y `/admin/` sin sesión redirigen a `/ingresar/`. El HTML y los chunks JS de producción no contienen credenciales (sin JWT con rol de servicio, sin claves `sb_` ni `sk_`); `service_role` solo se usa en código de servidor (`server-only`). La compra demo ya se verificó en producción (T11 y T12). | Cumple «Terminado cuando», pero el cierre se valida con T17 según el tablero. Las correcciones de T17 llegan a producción al hacer merge y desplegar. |
| T23 | Plan `docs/superpowers/plans/2026-11-05-integracion-sistema-visual.md`; documento de marca en `docs/design/SISTEMA-VISUAL-C3-2026-11.md`; decisiones en D-33. Cambios: acción violeta `#6548c7` (oscuro `#6e54cc`) en botones, CTA de compra, enlace y foco; neutrales del documento salvo `fondo`; campos con radio de 6 px; tarjetas de evento con 12 px; sombras de resumen en `shadow-sm`; movimiento reducido global; etiqueta de botón con tokens. Pruebas: `tests/unit/design-tokens.test.ts`, `button-variants`, `field-class`, `no-undefined-tokens` (verdes). `npm test` 30/30 archivos, lint, typecheck, build. E2E con API simulada 16/16. Capturas antes y después a 390 y 1280 px sin desbordamiento. | Pendientes de marca fuera de alcance (D-33): modo oscuro global, token `info`, voz «tú» frente a voseo, auditoría con herramienta, manual de marca oficial. Tarea extra; no estaba en el plan original. |
