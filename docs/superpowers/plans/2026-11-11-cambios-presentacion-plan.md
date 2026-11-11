# Cambios para presentación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar el sitio DEMO con precios claros, contenido fiable y medición consentida, respetando las prioridades indicadas.

**Architecture:** Mantener los límites Next.js/Supabase y la información histórica de órdenes. Separar comisión de comprador y organizador en una migración compatible; entregar los demás cambios en tareas independientes. Las integraciones externas se configuran solo con datos verificables.

**Tech Stack:** Next.js 16.4.4, React 19, TypeScript, Supabase/PostgreSQL, Vitest y Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-cambios-presentacion-design.md`.

## Global Constraints

- Excluir dominio; no reactivar Wompi ni ejecutar transacciones solo para documentarlo.
- Total del comprador = subtotal; comisión al organizador = 6 % más $0.50 por boleto, incluidas las entradas gratis, confirmado por el responsable.
- Conservar íntegramente órdenes y pagos históricos y su idempotencia; verificar RPC y privilegios solo `service_role`.
- Tuteo, USD en centavos, distintivo DEMO; no inventar certificados, políticas, credenciales, cuentas, evidencia o afiliación.
- Leer la guía pertinente de `node_modules/next/dist/docs/` antes de modificar Next.js; actualizar backlog y decisiones solo al tener evidencia.
- Mantener privacidad y consentimiento; nunca enviar tokens, correos, teléfonos o datos de pago a herramientas de medición.
- Panel del organizador: validar propiedad en servidor; archivar por estado `archived`, sin `DELETE` físico; no mutar tipos de entrada ni historial transaccional.

## Review Focus

- Compras mixtas y gratis: el comprador paga subtotal y el fijo por unidad se calcula según decisión confirmada (tarea 1).
- Reintento de orden previa al despliegue: conserva importes y no duplica boletos (tarea 1).
- Imagen HTTPS rota: aparece respaldo local y no hay bucle de error (tarea 2).
- Medición de terceros queda fuera del alcance; solo continúa la analítica propia saneada.
- Solo existen cero o un evento relacionado: confirmación no duplica ni recomienda el evento comprado (tarea 5).
- Un organizador ajeno intenta editar/archivar y no cambia filas; editar un publicado lo devuelve a revisión; archivar conserva tipos de entrada y órdenes (tarea 9).

---

## Mapa de archivos

- Comisión: nueva migración en `supabase/migrations/`; RPC vigente en `20261110110000_order_buyer_link.sql`, restricción en `20261102120000_init_marketplace_schema.sql`, reporte en `20261113110000_event_survey.sql`; `src/features/checkout/{cart,order}.ts`, `src/app/api/checkout/orders/route.ts`, `src/components/checkout/{cart-summary,cart-page,checkout-page,payment-step}.tsx`, `src/features/organizers/report.ts` y pruebas correspondientes.
- Contenido: `src/features/catalog/{home,images,queries,event-detail}.ts*`, `src/components/catalog/{featured-carousel,event-card}.tsx`, `src/components/layout/site-footer.tsx`, `src/lib/site-config.ts`, textos de `src/`; pruebas `home`, `images`, `event-detail`, `site-config` y E2E.
- Confirmación: `src/app/confirmacion/[orderId]/[token]/page.tsx`, `src/features/ticketing/confirmed-order.ts`, consultas de catálogo y pruebas de confirmación.
- Medición: `src/lib/analytics/{consent,track}.ts`, `src/components/layout/{consent-banner,page-view-tracker}.tsx`, `src/app/layout.tsx`, `src/features/legal/content.ts`, `.env.example` y pruebas de consentimiento y medición.
- Filtro: `src/features/catalog/{filters,types}.ts`, `src/components/catalog/catalog-filters.tsx`, `src/app/[...segments]/page.tsx` y pruebas de filtros.
- Panel organizador: `src/app/panel/page.tsx`, `src/app/panel/eventos/[id]/editar/page.tsx`, `src/components/organizers/{publish-event-form,archive-event-form}.tsx`, `src/features/organizers/actions.ts`, migración `supabase/migrations/20261120130000_organizer_event_management.sql` y pruebas DB de autorización/archivo.

### Tarea 1 — Comisión y total del comprador (imprescindible)

**Interfaces:** `orders.fee_cents` conserva su significado histórico de cargo al comprador; añadir `orders.organizer_fee_cents integer not null default 0` para nuevas órdenes. `create_pending_order` conserva la firma vigente por compatibilidad, ignora `p_fee_percent` en órdenes nuevas y devuelve `fee_cents = 0`; `total_cents = subtotal_cents`. La regla de comisión se fija en la RPC, nunca procede del navegador. Mantener `orders_total_check` para históricos. El reporte debe agregar comisiones del organizador por separado de cargos históricos.

- [x] El responsable confirmó que el fijo aplica también a entradas gratis; la especificación contiene los ejemplos.
- [ ] Añadir pruebas en `tests/db/order-creation.test.ts`: dos entradas de $10 producen subtotal/total 2000, `fee_cents=0`, `organizer_fee_cents=220`; redondeo de 6 %, múltiples tipos, mezcla y gratis según decisión; manipulación de `p_fee_percent` no altera resultado. Verificar repetición con mismo `requestId`, órdenes históricas y acceso denegado a `anon`.
- [ ] Ejecutar `npx vitest run tests/db/order-creation.test.ts` y comprobar fallo por la comisión anterior.
- [ ] Crear migración posterior a `20261119100000`, reemplazando la definición vigente de RPC, conservando bloqueos, validaciones, privilegios y retorno de órdenes existentes; agregar columna sin reescribir importes. Actualizar RPC de reporte para mostrar por separado la comisión del organizador y los cargos históricos, manteniendo controles de acceso.
- [ ] Actualizar cálculo provisional y resúmenes en carrito/checkout para mostrar únicamente precio de entradas y total, sin comisión del comprador. Wompi sigue usando `orders.total_cents`; no alterar órdenes pendientes ya creadas.
- [ ] Adaptar `tests/unit/cart.test.ts`, `tests/unit/order.test.ts`, `tests/db/event-report.test.ts`, `tests/e2e/cart.spec.ts` y `tests/e2e/checkout.spec.ts`: verificar total sin cargo, reporte y orden histórica/reintento. Ejecutar `npx vitest run tests/unit/cart.test.ts tests/unit/order.test.ts tests/db/order-creation.test.ts tests/db/event-report.test.ts` y `npm run test:e2e -- tests/e2e/cart.spec.ts tests/e2e/checkout.spec.ts`; esperar PASS.
- [ ] Actualizar `docs/architecture/DATA.md`, `docs/architecture/SYSTEM.md`, `docs/checkout/DEMO_PAYMENT.md`, `docs/testing/ACCEPTANCE.md` y `docs/DECISIONS.md` sin borrar evidencias históricas. Registrar pendiente la aplicación remota hasta verificarla.

### Tarea 2 — Evento de prueba e imágenes del Home (imprescindible)

**Interfaces:** `coverImagePath` continúa devolviendo URL; el manejo de error en imagen usa `illustrationForEvent` una sola vez. `chooseHomeEvents` no cambia su contrato.

- [ ] Escribir prueba E2E de Home con imagen remota que falla: tanto destacado como próximos muestran imagen local cargada (`naturalWidth > 0`), sin repetir intentos; incluir 390 y 1280 px. Ejecutar `npm run test:e2e -- tests/e2e/home.spec.ts` y comprobar fallo.
- [ ] Implementar respaldo local en los componentes de imagen que realmente renderizan ambas secciones. Ejecutar la prueba y esperar PASS.
- [ ] Localizar en remoto el evento por ID exacto y revisar estado y referencias; retirarlo mediante administración/actualización reversible, sin borrar transacciones. Verificar que no aparezca en destacados ni catálogo público; registrar ID, entorno y evidencia. Si no hay acceso, dejar bloqueo explícito sin afirmar que se retiró.
- [ ] Comprobar el sitio desplegado en escritorio y móvil: cada tarjeta visible en ambos bloques carga imagen; anotar URL, fecha y resultados sin exponer credenciales.

### Tarea 3 — Contacto, tuteo y Wompi (imprescindible)

**Interfaces:** pie con `mailto:competitivecodingclub.sv@gmail.com` y `tel:+50369639295`, texto `+503 6963-9295`.

- [ ] Añadir aserciones de contacto y voz en `tests/unit/site-config.test.ts` y pruebas de interfaz relevantes; buscar voseo con `rg -n -i 'explorá|elegí|seleccioná|revisá|finalizá|completá|descubrí|encontrá' src`. Verificar que las pruebas nuevas fallan.
- [ ] Corregir textos visibles y metadatos en `src/`, incluyendo `site-config.ts`; no modificar registros históricos. Ejecutar las pruebas y la búsqueda anterior; esperar PASS y ninguna coincidencia de voseo en interfaz.
- [ ] Actualizar encabezado de `docs/superpowers/plans/2026-11-11-wompi-sandbox.md`, `docs/checkout/DEMO_PAYMENT.md`, `docs/DECISIONS.md` y backlog: responsable informa que Wompi ya está activado; no atribuir fecha, migración, resultado de $0.01 ni pruebas a una verificación inexistente. Corregir la afirmación obsoleta de que destacados y paquetes siguen en simulación según D-68 y código, distinguiendo implementación de despliegue verificado.

### Tarea 4 — Señales de confianza (importante)

**Interfaces:** `CatalogEventDetail.includesCertificate: boolean`; columna `events.includes_certificate boolean not null default false`, expuesta y editable por el formulario del organizador mediante su RPC validada.

- [ ] Agregar pruebas DB y unitarias: default falso; solo verdadero muestra «Incluye certificado»; organizador no puede modificar evento ajeno; información de reembolso enlaza a `/terminos/`; métodos reflejan solo Wompi sandbox habilitado. Ejecutar pruebas y confirmar fallo.
- [ ] Crear migración de columna y actualizar RPC de publicación/edición existente, consultas, tipos, validación y formulario; conservar RLS y compatibilidad de datos existentes. Añadir bloque bajo compra con información verificable y enlace a términos.
- [ ] Ejecutar `npx vitest run tests/db/create-organizer-event.test.ts tests/unit/event-detail-page.test.ts tests/unit/publish.test.ts` y pruebas E2E de ficha; esperar PASS. Si no hay edición de eventos, permitir declaración al crear y documentar esa limitación.

### Tarea 5 — Confirmación y newsletter (importante)

**Interfaces:** consulta de relacionados recibe ID, tema y categoría del evento confirmado y devuelve hasta tres `CatalogEvent` públicos futuros, excluyendo ID actual. El CTA de newsletter abre `mailto:competitivecodingclub.sv@gmail.com?subject=Suscripci%C3%B3n%20al%20newsletter` si no hay un servicio de suscripción configurado.

- [ ] En `tests/unit/confirmation-page.test.ts` y `tests/e2e/checkout.spec.ts`, probar cero, uno y tres resultados, exclusión del comprado y CTA sin afirmar suscripción exitosa. Ejecutar y comprobar fallo.
- [ ] Reutilizar consultas de catálogo publicado y componentes de tarjetas en `src/app/confirmacion/[orderId]/[token]/page.tsx`; elegir tema antes de categoría, sin duplicados. Mantener confirmación privada y no incluir token en enlaces externos.
- [ ] Ejecutar pruebas anteriores; esperar PASS, incluidos casos sin eventos relacionados.

### Tarea 6 — Medición externa (fuera de alcance)

**Estado:** GA4 y Meta Pixel quedan fuera del alcance por decisión del responsable. No crear variables de IDs ni instalar scripts. La analítica propia existente continúa saneando rutas privadas.

- [x] Excluir GA4 y Meta Pixel del trabajo actual; no quedan como tareas pendientes ni activaciones externas.

### Tarea 7 — Número corto de orden (opcional)

**Interfaces:** `orders.public_code text unique not null`, formato `TC3-<entero>` mediante secuencia de base de datos; conservar UUID y token para rutas y autorización.

- [ ] Probar unicidad en inserciones concurrentes, backfill estable de órdenes históricas, reintentos y ausencia del token en código; ejecutar DB y confirmar fallo.
- [ ] Crear migración para secuencia y backfill seguro; actualizar consulta, confirmación y comprobante/correo para mostrar el código, sin cambiar enlaces seguros.
- [ ] Ejecutar `npx vitest run tests/db/order-creation.test.ts tests/unit/confirmation-page.test.ts tests/unit/ticket-email.test.ts`; esperar PASS.

### Tarea 8 — Filtro Tema (opcional)

**Interfaces:** ampliar `CatalogFilters` con `tema: string | null`; parser acepta únicamente slugs de `taxonomy.topics`; `filterCatalogEvents` combina tema con los demás filtros.

- [ ] Añadir a `tests/unit/filters.test.ts` y E2E de categoría casos de tema válido, inválido, combinación con ciudad y tema incompatible con ruta; verificar canónico y conservación de filtros. Ejecutar y comprobar fallo.
- [ ] Añadir selector accesible en `catalog-filters.tsx` y aplicar filtro al alcance existente; no generar rutas nuevas ni alterar orden de categorías.
- [ ] Ejecutar `npx vitest run tests/unit/filters.test.ts` y E2E correspondiente; esperar PASS.

### Tarea 9 — Edición y archivo lógico de eventos del organizador

**Interfaces:** `organizer_update_event_details(p_event_id uuid, p_details jsonb)` actualiza metadatos validados y devuelve el estado resultante; `organizer_archive_event(p_event_id uuid)` transiciona a `archived`. Ambas RPC comprueban `auth.uid()` y `owns_event`. La edición no recibe ni altera entradas. Un evento publicado editado vuelve a `pending` para revisión administrativa.

- [x] El responsable definió borrado lógico para conservar órdenes y boletos; la especificación detalla campos editables y transición a revisión.
- [x] Añadir pruebas DB: el dueño puede editar, otro usuario no; editado publicado queda pendiente; archivo conserva evento y tipos. Verificado: `tests/db/create-organizer-event.test.ts`, 12/12.
- [x] Implementar formulario reutilizado de publicación con datos precargados, sin controles de tipos de entrada; añadir acciones de servidor, RPC autorizadas, confirmación de archivo, links desde el panel y ruta de edición.
- [x] Verificar lint y tipos: `npm run lint`, `npm run typecheck` y typecheck de build Webpack pasan.

### Tarea 10 — Cierre y evidencia

- [ ] Verificación local (2026-11-11): `npm run lint` PASS; `npm run typecheck` PASS; `npx vitest run tests/db/create-organizer-event.test.ts tests/unit/order.test.ts tests/unit/check-in.test.ts tests/unit/cart.test.ts tests/unit/confirmation-page.test.ts tests/unit/filters.test.ts tests/unit/images.test.ts` PASS, 7 archivos/62 pruebas; `npx next build --webpack` PASS. `npm test` global se inició y se canceló antes de completarse; no se reporta resultado global. Un build inicial evidenció importaciones transitivas de `node:crypto` en módulos cliente; se separaron en `order-token.ts` y `check-in-token.ts`, después de lo cual Webpack compiló correctamente.
- [ ] Ejecutar batería E2E pertinente; registrar cualquier bloqueo de entorno. No marcar como comprobado lo que no se ejecutó.
- [ ] Revisar Home → categoría → evento → carrito → checkout → confirmación en móvil y escritorio; incluir gratis y sandbox únicamente cuando el entorno de prueba esté autorizado y disponible.
- [x] Actualizar `docs/superpowers/plans/implementation-backlog.md` con estado y evidencia por tarea, distinguiendo implementado, desplegado y verificado. No marcar las tareas opcionales como completadas si no pasaron sus criterios.
- [ ] Crear commits por entregable solo si el usuario lo autoriza o el flujo del repositorio lo requiere; no incluir secretos ni cambios ajenos.
