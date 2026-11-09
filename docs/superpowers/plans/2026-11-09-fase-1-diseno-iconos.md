# Fase 1 — Diseño, iconos, imágenes y wireframes — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un solo sistema de iconos (`lucide-react`) usado en cada componente donde ayude, con color por línea de C3; imágenes propias y de stock registradas; wireframes de todas las pantallas.

**Architecture:** Un componente `Icon` y un registro de nombres lo centralizan; los componentes importan `Icon`, nunca `lucide-react` directo. Las ilustraciones se generan con un script desde SVG fuente a WebP. Los wireframes son SVG en `docs/design/wireframes/`.

**Tech Stack:** `lucide-react` 0.468, React 19 (`react-dom/server` para pruebas de render), `sharp` (ya viene con Next) para ilustraciones, Playwright.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (R-01, R-07; DP-07, DP-08, DP-19) · [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- Leer `node_modules/next/dist/docs/` antes de tocar rutas o `next/image` (AGENTS.md).
- D-33: color de línea **clasifica**, no decora; icono siempre con texto o `aria-label`; sin emojis; sin gradientes; foco visible; áreas táctiles de 44 px; sin scroll horizontal a 375 px.
- Iconos decorativos: `aria-hidden="true"`. Iconos con significado: `role="img"` y `aria-label`.
- Imágenes: rutas locales solo en `/images/tipos/` y `/images/stock/` (D-36); toda imagen de stock con crédito en `public/images/CREDITOS.md`.
- Sin imágenes de personas identificables ni logos de terceros.
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Un icono sin etiqueta accesible que sí transmite información (estado, tipo de evento): `tests/unit/icons.test.ts` (1.1) y E2E de 1.4.
2. Un icono nuevo con color que no alcanza 3:1 sobre su fondo: prueba de contraste en 1.3.
3. Un SVG a mano que reaparece fuera de `Icon`: `tests/unit/no-handwritten-svg.test.ts` (1.2).
4. Una imagen de stock sin crédito registrado: `tests/unit/image-credits.test.ts` (1.5).
5. Desbordamiento horizontal a 375 px al añadir iconos en barras y filtros: E2E de 1.4.

---

## Parte 1.A — Sistema de iconos

### Tarea 1.1: Componente `Icon` y mapas (DI-02)

**Files:**
- Create: `src/components/ui/icon.tsx`, `src/features/catalog/icons.ts`, `tests/unit/icons.test.ts`

**Interfaces:**
- Produces en `src/components/ui/icon.tsx`:
  - `export type IconTone = 'texto' | 'suave' | 'accion' | 'compite' | 'crea' | 'conecta' | 'exito' | 'advertencia' | 'error' | 'inverso'`
  - `export const iconRegistry` (objeto nombre → componente de `lucide-react`) con al menos: `search, cart, user, userPlus, logIn, logOut, menu, close, chevronDown, chevronLeft, chevronRight, calendar, calendarPlus, clock, mapPin, monitor, ticket, tag, qr, share, check, alert, info, lock, mail, phone, building, trophy, handshake, wrench, rocket, target, monitorPlay, mic, code, users, message, store, cloud, cpu, terminal, star, flag, download, print, plus, minus, edit, trash`
  - `export type IconName = keyof typeof iconRegistry`
  - `export function Icon(props: { name: IconName; label?: string; size?: 16 | 20 | 24; tone?: IconTone; className?: string }): JSX.Element` — sin `label` renderiza `aria-hidden="true"`; con `label` renderiza `role="img"` y `aria-label`. Siempre añade `data-icon={name}`. Mapea `tone` a clases de token (`crea` usa `text-crea-texto`, nunca `text-crea` sobre fondo claro).
- Produces en `src/features/catalog/icons.ts`:
  - `export const eventTypeIcon: Record<string, IconName>` para los 12 slugs: `congresos→building, competencias→trophy, networking→handshake, workshops→wrench, bootcamps→rocket, concursos→target, webinars→monitorPlay, conferencias→mic, hackathons→code, meetups→users, charlas→message, ferias-tecnologicas→store`
  - `export const topicIcon: Record<string, IconName>`: `cloud→cloud, inteligencia-artificial→cpu, programacion→code, python→terminal`
  - `export function iconForEventType(slug: string): IconName` (devuelve `ticket` si el slug no existe)
  - `export const statusIcon: Record<'pending' | 'published' | 'rejected' | 'confirmed' | 'failed' | 'cancelled' | 'draft' | 'archived', IconName>`

- [ ] **Step 1: Write the failing test** `tests/unit/icons.test.ts` usando `renderToStaticMarkup`:
  - `test('cada uno de los 12 tipos de evento tiene icono')` — usar la lista de slugs de `src/features/catalog/categories.ts`.
  - `test('todos los nombres del registro existen en lucide-react')` — `Object.values(iconRegistry).every(Boolean)`.
  - `test('sin label es decorativo')` — el HTML contiene `aria-hidden="true"` y no contiene `role="img"`.
  - `test('con label es accesible')` — contiene `role="img"` y `aria-label="Gratis"`.
  - `test('cada estado tiene icono')` — `Object.keys(statusIcon)` incluye los ocho estados.
- [ ] **Step 2: Run** `npx vitest run tests/unit/icons.test.ts` — Expected: FAIL (módulos no definidos).
- [ ] **Step 3: Implement** los dos archivos con las firmas de Interfaces. Verificar cada nombre contra los exports reales de `lucide-react` 0.468 (si falta alguno, elegir el más cercano y anotarlo en el comentario del registro).
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git add src/components/ui/icon.tsx src/features/catalog/icons.ts tests/unit/icons.test.ts && git commit -m "feat: componente Icon y mapas de iconos"`

### Tarea 1.2: Migrar los SVG escritos a mano (DI-07)

**Files:**
- Modify: `src/components/layout/site-search.tsx`, `src/components/layout/cart-link.tsx`, `src/components/layout/category-nav.tsx`, `src/components/catalog/featured-controls.tsx`, `src/components/catalog/ticket-selector.tsx`
- Create: `tests/unit/no-handwritten-svg.test.ts`

**Interfaces:**
- Consumes: `Icon`, `IconName` de 1.1.

- [ ] **Step 1: Write the failing test:** `test('ningún componente escribe SVG a mano')` — recorre `src/**/*.tsx`, ignora `src/components/ui/icon.tsx` y una lista `allowlist` (logos y marca; descubrirla con `grep -rln "<svg" src` y justificar cada entrada en un comentario), y espera cero coincidencias de `<svg`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/no-handwritten-svg.test.ts` — Expected: FAIL (cinco componentes).
- [ ] **Step 3: Implement:** sustituir cada SVG por `<Icon name="…" />` (buscar → `search`, carrito → `cart`, flechas del carrusel → `chevronLeft/Right`, controles de cantidad → `plus` y un `minus` añadido al registro, desplegable de categorías → `chevronDown`). Conservar `aria-label` y áreas táctiles existentes.
- [ ] **Step 4: Run** el test, `npx vitest run tests/unit/navigation.test.ts` y `npx playwright test tests/e2e/navigation.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "refactor: iconos con lucide-react en lugar de SVG a mano"`

### Tarea 1.3: Iconos de color por línea y tipo (DI-03)

**Files:**
- Modify: `src/components/catalog/category-tile.tsx`, `src/components/catalog/event-card.tsx`, `src/components/layout/category-nav.tsx`, `tests/unit/design-tokens.test.ts`
- Create: `tests/unit/icon-tones.test.ts`

**Interfaces:**
- Consumes: `iconForEventType`, `Icon` (1.1) y el mapeo de línea (`compite`/`crea`/`conecta`) que ya existe en `src/features/catalog/categories.ts` (leerlo; no duplicarlo).
- Produces: `export function toneForEventType(slug: string): IconTone` en `src/features/catalog/icons.ts`, igual a la línea del tipo.

- [ ] **Step 1: Write the failing test** `tests/unit/icon-tones.test.ts`: `test('cada tipo usa el tono de su línea')` y `test('los tonos de icono alcanzan 3:1 sobre superficie y sobre navy')` reutilizando el helper de contraste de `design-tokens.test.ts` (extraerlo a `tests/unit/helpers/contrast.ts` si hace falta); `crea` se evalúa con su variante de texto sobre claro y con el turquesa base sobre navy.
- [ ] **Step 2: Run** `npx vitest run tests/unit/icon-tones.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `toneForEventType` y mostrar el icono con su tono junto al nombre del tipo en tarjetas, chips y menú (el nombre sigue visible: el color nunca va solo).
- [ ] **Step 4: Run** el test y `npx vitest run tests/unit/design-tokens.test.ts tests/unit/no-undefined-tokens.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: iconos de color por tipo de evento"`

### Tarea 1.4: Iconos en cada componente donde haga falta (DI-04)

**Files:**
- Modify: `src/components/layout/site-header.tsx`, `site-footer.tsx`, `src/components/catalog/event-card.tsx`, `catalog-filters.tsx`, `src/features/catalog/event-detail.tsx`, `src/components/checkout/cart-page.tsx`, `checkout-page.tsx`, `payment-step.tsx`, `src/app/confirmacion/[orderId]/[token]/page.tsx`, `src/app/panel/page.tsx`, `src/app/admin/page.tsx`, `src/app/ingresar/page.tsx`
- Create: `tests/e2e/icons.spec.ts`

**Interfaces:**
- Consumes: `Icon`, `statusIcon`, `iconForEventType`, `topicIcon`.

**Dónde va cada icono (decidido):**
- Cabecera: buscar, cuenta (`user`, `logIn`), carrito (con contador), menú móvil (`menu`/`close`). Pie: `mail` en el contacto DEMO, enlaces legales con `lock`.
- Tarjeta y ficha de evento: fecha `calendar`, hora `clock`, lugar `mapPin`, modalidad virtual `monitor`, precio `tag`, entradas `ticket`, organizador `building`.
- Filtros: ciudad `mapPin`, modalidad `monitor`, precio `tag`, fecha `calendar`.
- Checkout y confirmación: pasos con `check`, QR `qr`, descargar `download`, imprimir `print`.
- Panel y administración: badge de estado con `statusIcon` + texto.

- [ ] **Step 1: Write the failing test** `tests/e2e/icons.spec.ts` (Chromium, 375×812 y 1280×800), recorriendo `/`, `/congresos/`, una ficha, `/carrito/`, `/ingresar/`: `test('no hay scroll horizontal')` (`document.documentElement.scrollWidth <= window.innerWidth`); `test('todo icono con significado tiene nombre accesible')` (`svg[data-icon]` sin `aria-hidden` debe tener `role="img"` y `aria-label` no vacío); `test('la tarjeta de evento muestra fecha, lugar y precio con icono')`.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/icons.spec.ts --project=chromium` — Expected: FAIL (la tarjeta no tiene iconos).
- [ ] **Step 3: Implement** según la lista anterior; mantener cada texto visible junto a su icono.
- [ ] **Step 4: Run** el E2E, `npm run lint`, `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: iconos en cabecera, tarjetas, fichas, filtros, checkout y paneles"`

---

## Parte 1.B — Imágenes

### Tarea 1.5: Más fotos de stock con crédito (IM-01, equipo)

**Files:**
- Create: archivos nuevos en `public/images/stock/` (JPG, ≤ 1600 px de ancho)
- Modify: `public/images/CREDITOS.md`, `src/features/catalog/images.ts`
- Create: `tests/unit/image-credits.test.ts`

**Interfaces:**
- Produces: cada archivo de `public/images/stock/` y `public/images/tipos/` tiene una línea en `CREDITOS.md` con la URL de origen, autor, fecha de descarga y licencia (leer el formato actual de las líneas y repetirlo).

- [ ] **Step 1: Write the failing test:** `test('toda imagen de stock y de tipos tiene crédito')` — lista los archivos de ambas carpetas y comprueba que su nombre aparece en `CREDITOS.md`. Hoy debe pasar; sirve como compuerta de este paso.
- [ ] **Step 2 (equipo):** buscar y descargar fotos de bancos con licencia libre (salas, auditorios, equipos de trabajo sin rostros identificables, espacios de coworking, pantallas con código), al menos dos por línea (Compite, Crea, Conecta). Registrar crédito antes de usar.
- [ ] **Step 3: Implement:** registrar las fotos nuevas en `images.ts` por línea.
- [ ] **Step 4: Run** `npx vitest run tests/unit/image-credits.test.ts tests/unit/images.test.ts tests/unit/image-paths.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: más fotos de stock con créditos"`

### Tarea 1.6: Ilustraciones propias por tipo (IM-02)

**Files:**
- Create: `design/illustrations/{slug}-1.svg`, `design/illustrations/{slug}-2.svg` (12 tipos × 2 variantes), `scripts/build-illustrations.mjs`, `public/images/tipos/{slug}-1.webp`, `{slug}-2.webp`, `tests/unit/illustrations.test.ts`
- Modify: `src/features/catalog/images.ts`, `public/images/CREDITOS.md` (entrada «Ilustraciones propias del proyecto»)

**Interfaces:**
- Produces en `images.ts`: `export function illustrationForEvent(input: { eventId: string; typeSlug: string }): { src: string; alt: string }` — elige la variante `1` o `2` con un hash estable del `eventId` y devuelve `/images/tipos/{typeSlug}-{n}.webp`; `alt` empieza con «Ilustración DEMO de».
- `scripts/build-illustrations.mjs`: lee cada SVG de `design/illustrations/`, escribe WebP de 1600×900 con `sharp`.

- [ ] **Step 1: Write the failing test** `tests/unit/illustrations.test.ts`: `test('hay dos variantes por cada uno de los 12 tipos')` (existen los 24 `.webp`), `test('la elección de variante es estable')` (mismo `eventId` → mismo `src`) y `test('el alt declara que es ilustración')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/illustrations.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Dibujar los 24 SVG a mano con la paleta C3 (navy `#0F203E`, azul `#205298`, violeta `#4F5BA9`, turquesa `#33BEAC`), nodos circulares del logo como motivo repetido, sin personas ni texto; correr `node scripts/build-illustrations.mjs`; usarlas como imagen de respaldo cuando un evento no tiene portada propia, manteniendo la etiqueta visible «Imagen ilustrativa» de D-36.
- [ ] **Step 4: Run** el test y `npx vitest run tests/unit/images.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: ilustraciones propias por tipo de evento"`

### Tarea 1.7: Revisión visual de la fase (DI-05)

**Files:**
- Create: `docs/analisis/evidencias/fase-1/README.md` y capturas `*.png`

- [ ] **Step 1:** Levantar `npm run build && npm start`; tomar capturas a 390 y 1280 px de Home, categoría, ficha, carrito, checkout y confirmación.
- [ ] **Step 2:** Ejecutar el comando de Impeccable de la tarea 0.5 sobre los archivos cambiados de la fase — Expected: sin hallazgos o con cada hallazgo justificado en el README.
- [ ] **Step 3:** Registrar en el README de evidencias: capturas, resultado del detector, tamaño de descarga de una tarjeta antes/después.
- [ ] **Step 4: Commit** — `git commit -m "docs: evidencias visuales de la Fase 1"`

---

## Parte 1.C — Wireframes (WF-01, WF-02, WF-03)

### Tarea 1.8: Cinco pantallas (WF-01)

**Files:**
- Create: `docs/design/wireframes/01-home.svg`, `02-categoria.svg`, `03-evento.svg`, `04-carrito-pago.svg`, `05-confirmacion.svg`, `docs/design/wireframes/README.md`, `tests/unit/wireframes.test.ts`

**Interfaces:**
- Cada SVG contiene dos tablas de dibujo (`<g id="movil">` 375×812 y `<g id="escritorio">` 1280×800), un `<title>` y bloques de anotación (`<text>` con prefijo `Nota:`). Los wireframes son de baja fidelidad: cajas grises, texto de marcador y flechas; sin colores de marca.

**Contenido obligatorio por pantalla (PDF diapositiva 12):**
- Home: eventos y categorías en la primera pantalla; el logo lleva al Home; sin «Inicio».
- Categoría: H1 con la palabra clave; filtros de tema, fecha, precio y ciudad; bloque de destacados de la categoría.
- Evento: agenda y ponentes visibles; caja de compra sin hacer scroll en móvil; agregar al calendario y compartir.
- Carrito y pago: sin crear cuenta (con opción de iniciar sesión); total claro con comisión visible, sin cargos sorpresa; pago de demostración.
- Confirmación: boleto con QR; envío simulado por correo y WhatsApp; agregar al calendario; compartir.

- [ ] **Step 1: Write the failing test** `tests/unit/wireframes.test.ts`: `test('existen los cinco wireframes')`, `test('cada SVG es XML bien formado con title y las dos tablas de dibujo')` (parsear con `DOMParser` de `jsdom` si está disponible; si no, comprobar con expresiones regulares `<title>`, `id="movil"`, `id="escritorio"`), `test('el README enlaza cada wireframe')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/wireframes.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** los cinco SVG y el README (una sección por pantalla con la persona que atiende y la palabra clave SEO de su ruta).
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: wireframes de las cinco pantallas"`

### Tarea 1.9: Flujo móvil con estados (WF-02)

**Files:**
- Create: `docs/design/wireframes/06-flujo-movil.svg`
- Modify: `docs/design/wireframes/README.md`, `tests/unit/wireframes.test.ts`

- [ ] **Step 1: Write the failing test:** `test('el flujo móvil muestra los estados vacío, agotado, error, pago rechazado y gratis')` (el SVG contiene un `<text>` con cada palabra en una nota `Estado:`).
- [ ] **Step 2: Run** el test — Expected: FAIL.
- [ ] **Step 3: Implement:** secuencia de 5 pantallas con flechas (Home → Categoría → Evento → Carrito y pago → Confirmación, «4 clics hasta el boleto») y una fila inferior con los cinco estados.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: wireframe del flujo móvil con estados"`

### Tarea 1.10: Pantallas nuevas (WF-03)

**Files:**
- Create: `docs/design/wireframes/10-login-cuenta.svg`, `11-mis-boletos.svg`, `12-panel-organizador.svg` (publicar, destacar por días, check-in, reporte), `13-admin-destacados.svg`, `14-admin-contenido.svg`, `15-checkin.svg`, `16-para-empresas.svg`
- Modify: `docs/design/wireframes/README.md`, `tests/unit/wireframes.test.ts`

- [ ] **Step 1: Write the failing test:** `test('existen los siete wireframes de pantallas nuevas')` y `test('el README los enlaza')`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** cada wireframe con su requisito: login y registro con «Continuar como invitado»; «Mis boletos» con historial de compras; selector de días del destacado con total; administración de destacados (pagados y manuales en una lista); editor de contenido con campos SEO; check-in con campo de código; página del paquete con los cuatro beneficios.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: wireframes de cuentas, destacados, contenido, check-in y paquete"`

---

## Cierre de la fase

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test --project=chromium` (E2E con API simulada) — Expected: todo en verde.
- [ ] PR de `codex/fase-1-diseno` con capturas de 1.7 y marcar el tablero del roadmap.
