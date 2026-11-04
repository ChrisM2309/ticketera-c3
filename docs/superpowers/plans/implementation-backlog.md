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
| T10 | Compra | Confirmación transaccional e inventario | P0 | T09 | Pendiente |
| T11 | Compra | Pagos demo gratis/aprobado/rechazado | P0 | T10 | Pendiente |
| T12 | Boletos | Confirmación, QR y descarga | P0 | T11 | Pendiente |
| T13 | Pruebas | Flujo de compra end-to-end | P0 | T12 | Pendiente |
| T14 | Organizadores | Inicio de sesión y roles | P1 | T03 | Pendiente |
| T15 | Organizadores | Formulario de publicación de evento | P1 | T07, T14 | Pendiente |
| T16 | Administración | Revisión, aprobación y gestión mínima | P1 | T15 | Pendiente |
| T17 | Calidad | Revisión funcional, seguridad y responsive | P0 | T13; T16 para B2B | Pendiente |
| T18 | Publicación | Vercel, variables y dominio existente | P0 | T01; validar al final con T17 | Pendiente |
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
| T05 | Resolvedor en `src/app/[...segments]/page.tsx` con la taxonomía de `categories` (`src/features/catalog/routes.ts`): tipo, tema, ciudad y tipo + tema; `notFound()` para el resto. Filtros por GET (`ciudad`, `modalidad`, `precio`, `fecha`) en `src/features/catalog/filters.ts`, con migas, subtemas, estado vacío y canónico. `trailingSlash: true` (D-23) y filtrado en memoria (D-22). | `npm test` 71/71 (39 unitarias y 32 de base de datos, incluido el árbol de 128 rutas y los 50 eventos del seed), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0; `/[...segments]` dinámica). Servidor de producción: `/congresos/`, `/congresos/inteligencia-artificial/`, `/cloud/`, `/san-salvador/` y `/ferias-tecnologicas/` responden 200; las 12 categorías responden 200; `/congresos/zzz/`, `/zzz/`, `/publicar/` y `/carrito/` responden 404. Filtros comprobados contra los datos del proyecto remoto. Móvil de 375 px sin desbordamiento horizontal. Detector de Impeccable sin hallazgos en `src` | Las fichas enlazadas desde las tarjetas responden 404 hasta T07 (D-20). Árbol del Excel en `seo_routes` (128 rutas, D-24) y 40 eventos ficticios adicionales (50 en total). Pendiente: aplicar en Supabase `supabase/migrations/20261103120000_seo_routes.sql` y volver a pegar `supabase/seed.sql`; hasta entonces el sitio remoto no tiene los subtemas. T06 debe marcar `noindex` en listados vacíos y excluirlos del sitemap. `/buscar` sigue sin ruta (fuera de T05). |
| T06 | `src/lib/seo/indexing.ts` (reglas de sitemap y robots), `src/app/sitemap.ts` y `src/app/robots.ts`; `isDemo` con `NEXT_PUBLIC_IS_DEMO` (D-25); `noindex` en listados vacíos y en modalidad; portada con título y H1 de la palabra clave del Excel; canónicos en catálogo y portada. | `npm test` 76/76 (44 unitarias y 32 de base de datos), `npm run lint` (0), `npm run typecheck` (0), `npm run build` (0; `/robots.txt` y `/sitemap.xml` estáticos). Servidor local en modo demo: `robots.txt` con `Disallow: /`, `sitemap.xml` vacío, `noindex` en la portada y en `/ferias-tecnologicas/` (sin eventos). Detector de Impeccable sin hallazgos | Datos JSON-LD de evento quedan para T07 (fichas), solo en sitio real. La compilación adicional con `NEXT_PUBLIC_IS_DEMO=false` pasó durante T07; la verificación completa de sitemap real queda condicionada a que Supabase remoto tenga `seo_routes` sembrado. La portada en demo emite dos etiquetas `robots`; no afecta al resultado. |
| T07 | `src/app/[...segments]/page.tsx` conserva la prioridad del árbol y resuelve fichas de 2/3 segmentos; `src/features/catalog/queries.ts` lee con `anon` detalle publicado, agenda, organizador, inventario y relacionados; `src/features/catalog/tickets.ts` calcula cupo, máximo por orden y subtotal validado; `src/features/catalog/event-detail.tsx` muestra estado finalizado/agotado, metadata, canónico y JSON-LD solo fuera de demo; `src/components/catalog/ticket-selector.tsx` permite selección accesible y enlaza al carrito; `src/app/page.tsx` corrige el título DEMO de Home; `playwright.config.ts` admite puerto aislado. | `npm test` 84/84, `npm run lint` (0), `npm run typecheck` (0), `NEXT_PUBLIC_IS_DEMO=false npm run build` (0), `npm run test:e2e -- --project=chromium` (2/2 con red para Supabase), detector `impeccable detect --json` sobre las tres superficies UI (`[]`). Mejora visual posterior: portada de respaldo con fecha y hora en lugar de un recuadro sin imagen; selector con cantidad en pasos de 44 px, fila marcada al elegir entradas y enlace «Elegir entradas» en móvil; `npm test` 84/84, `npm run typecheck` y `npm run lint` (0), detector `[]` y `npm run test:e2e -- --project=chromium` (2/2) contra el servidor de desarrollo. Segunda pasada: tarjetas con foto arriba y enlace de tarjeta completa; cuando un evento no tiene `image_path`, la portada usa una foto temporal de Unsplash por línea de C3 (`src/features/catalog/images.ts`, fotos en `public/images/mockups/`; no son del evento). `npm test` 88/88 y E2E 2/2. | Se verificó con anon que el remoto tiene 10 eventos y 13 entradas; `seo_routes` existe pero está vacío. `npx supabase db push --project-ref xlpbftuvltczxdmemjti --include-all` quedó bloqueado por `AccessTokenRequiredError`; no se pudo pegar el seed sin credenciales. El código y las pruebas de T07 están completos, pero la propagación de la migración/seed remoto sigue pendiente heredada. |
| T08 | `src/features/checkout/cart.ts` define el carrito single-event con normalización de cantidades, límites por cupos/max_per_order, comisión DEMO configurable/redondeada en centavos, parseo defensivo de query y snapshot local; `src/features/catalog/queries.ts` añade `getCartEvent` para eventos publicados; `/carrito/` usa `searchParams` de Next 16 y metadata `noindex`; la UI permite editar/eliminar tipos, muestra subtotal/comisión/total provisional, conserva localStorage y deja checkout pendiente de T09. | `npm test -- --run` (95/95), `npm run lint` (0), `npm run typecheck` (0), E2E enfocado `tests/e2e/cart.spec.ts` (3/3), revisión visual desktop/375 px sin scroll horizontal. `npm run build` no pudo descargar Montserrat/Poppins desde Google Fonts; E2E completo 3/5 porque Supabase remoto no respondió para los dos casos heredados de `home.spec.ts`; `impeccable` no está instalado en el entorno. | T09 debe recalcular precios/cupos en servidor y habilitar el checkout; el botón permanece deshabilitado para no presentar un flujo inexistente. No se creó commit porque `.git` está en solo lectura y no permite `.git/index.lock`. |
| T09 | Migración `20261104130000_create_pending_order.sql` con RPC `SECURITY DEFINER` solo ejecutable por `service_role`: bloquea las filas validadas y materializa esas mismas lecturas en `orders` `pending` + `order_items`, con precios y total en centavos. `POST /api/checkout/orders` valida nombre/correo/IDs/cantidades, genera token aleatorio hasheado y usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. `/checkout/` recupera el carrito local, muestra formulario accesible con errores anunciados y conserva el token únicamente en `sessionStorage`. | `npm run lint` (0), `npm run typecheck` (0), `npm test -- --run` (106/106), `npm run build` (0), DB enfocado (7/7), unitarias enfocadas (4/4), E2E carrito + checkout (6/6) y revisión visual desktop/375 px. | E2E completo: 5/7; los dos fallos heredados de `home.spec.ts` dependen de catálogo/ficha de Supabase remoto no disponible. T10 conserva confirmación atómica/inventario y T11 los resultados de pago DEMO; T09 no emite boletos ni descuenta cupos. |
