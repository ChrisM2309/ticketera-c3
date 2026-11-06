# Mejoras integrales de Ticketera · Plan para aprobación

> **Estado:** propuesto, pendiente de aprobación. No se ha cambiado código.
> **Alcance:** mejoras de producto y de interfaz fuera del backlog T01–T18 y T23. No toca los archivos de T19 a T22 (investigación, competencia, wireframes, presentación), que trabaja otro equipo.

**Goal:** Mejorar la navegación, los destacados, las imágenes y la administración de Ticketera, sin cambiar el objetivo del producto: que el visitante encuentre y compre entradas con claridad, y que el organizador y el administrador trabajen con datos completos.

**Spec de referencia:** `docs/design/SISTEMA-VISUAL-C3-2026-11.md`, `docs/design/DESIGN.md`, `docs/product/PRD.md`, `AGENTS.md`, y las decisiones D-21, D-24, D-25, D-33.

## Principios para todo el plan

- Sitio DEMO etiquetado. No se inventan eventos, métricas, testimonios ni fotos de personas reales identificables.
- El logo lleva al Home; el menú no incluye «Inicio».
- Eventos visibles desde la primera pantalla, también en 375 px.
- Checkout simple en móvil; Carrito visible sin abrir el menú.
- Sin movimiento por tarjeta ni avance automático de carruseles (DESIGN.md; WCAG 2.2.2).
- Cada cambio de base de datos es una migración nueva, con pruebas en `tests/db`, y se aplica en producción solo con tu confirmación.
- Las migraciones nuevas empiezan después de `20261105160000`.
- Cada bloque sale en su propia rama y su propio PR.

---

## Bloque A · Navegación y header

**Problema comprobado:** las 12 categorías van en una fila plana con desplazamiento horizontal; a 1280 px se ven 10 y la «C» de la siguiente queda cortada. El Carrito no está a la vista en 390 px; hay que abrir el Menú primero. El botón BUSCAR compite con Carrito. Publicar evento está en el mismo nivel que Carrito, aunque sirve a otro público.

**Propuesta:**
1. **Menú de categorías agrupado en tres secciones** en el orden del Excel dentro de cada grupo: escritorio con desplegable de tres columnas; móvil con acordeón de tres secciones. Grupos por línea: Compite (Competencias, Concursos, Hackathons), Crea (Workshops, Bootcamps, Charlas, Webinars), Conecta (Congresos, Conferencias, Networking, Meetups, Ferias tecnológicas).
   - *Decisión tuya:* ¿los grupos se llaman Compite / Crea / Conecta (nombres de marca, poco claros para un visitante) o con nombres de intención? Propongo nombres de intención a validar con el equipo, por ejemplo «Competir», «Aprender» y «Conectar». Es copy: no lo cambio sin tu visto bueno.
2. **Carrito en la primera fila del móvil**, con icono y contador de entradas, fuera del Menú.
3. **Separar compra de organización:** «Publicar evento» sale de la barra principal y va al pie y a la zona de cuenta.
4. **Zona de cuenta según rol** (ingresar; panel de organizador; administración), visible solo con sesión. El rol se comprueba en el servidor.
5. **Menú móvil:** se cierra al navegar, con Escape y con un botón de cerrar. Un solo control de cuenta (hoy hay dos con `aria-label="Cuenta"`).
6. **Buscador más bajo en móvil**, para que Carrito quede en la misma fila.
7. **Pie con enlaces a las 12 categorías** (enlaces internos para SEO) y a Publicar evento.
8. **Sticky compacto en móvil:** se evalúa en Task A4; no se adopta si tapa contenido.

**Archivos:** `src/components/layout/site-header.tsx`, `category-nav.tsx`, `site-footer.tsx`, `src/lib/navigation.ts`, pruebas en `tests/unit/navigation.test.ts` y E2E en `tests/e2e/navigation.spec.ts` (nuevo).

**Tareas:**
- A1 · Pruebas de la agrupación y del orden de las 12 categorías (rojo primero).
- A2 · Desplegable de escritorio y acordeón de móvil con teclado y `aria-expanded`.
- A3 · Carrito con contador y Menú cerrable.
- A4 · Evaluación de sticky compacto en 390 px, con captura antes y después.
- A5 · Verificación: lint, typecheck, pruebas, E2E de navegación y capturas en 390 y 1280 px.

---

## Bloque B · Destacados con carrusel

**Problema comprobado:** el «destacado» es el primer evento próximo, no una selección editorial. Hoy los tres gratuitos repiten tres eventos que ya aparecen en «Próximos» (`src/features/catalog/queries.ts`, `page.tsx`).

**Propuesta:**
1. **Selección sin migración:** los destacados son los próximos N (N = 4). «Próximos» y «Gratuitos» excluyen los ids ya mostrados. Un evento no aparece dos veces en la portada.
2. **Carrusel con scroll-snap** (`featured-carousel.tsx` en servidor): funciona sin JavaScript. Los botones Anterior y Siguiente y los puntos son una mejora progresiva en un componente cliente pequeño (`featured-carousel-controls.tsx`).
3. **Sin avance automático.** Se navega con deslizar, flechas con el contenedor enfocado y botones de 44 px.
4. **Accesibilidad:** contenedor con `role="region"` y nombre «Eventos destacados»; cada diapositiva con `aria-roledescription` y «1 de 4»; botones deshabilitados en los extremos; sin `aria-live` en cada desplazamiento.
5. **Un o dos destacados:** sin controles; con tres o más, controles solo si hay más tarjetas de las visibles.
6. **Movimiento reducido:** `scroll-behavior: auto` dentro de la regla de `globals.css`.

**Decisión tuya:** ¿los destacados son los próximos cuatro (automático, sin migración) o quieres una columna «destacado» editable por el administrador? La segunda requiere migración y prueba de RLS; la propongo como bloque posterior.

**Tareas:**
- B1 · Prueba unitaria de la selección sin duplicados (rojo primero).
- B2 · Carrusel de servidor con scroll-snap y pruebas de render.
- B3 · Controles cliente con teclado; prueba E2E de teclado.
- B4 · Verificación en 375, 390 y 1280 px; el primer evento debe verse sin scroll en 375 px.

---

## Bloque C · Imágenes

**Problema comprobado:**
- Las tres fotos de Unsplash se repiten en los 50 eventos y no son de los eventos; el texto que lo aclara está solo en el README, no en pantalla.
- `public/images/temp/` tiene dos fotos de un evento real con personas, diplomas con nombres y logos de patrocinadores. No se usan, pero se sirven por URL.
- `event-card.tsx` y `event-detail.tsx` usan `unoptimized`: cada tarjeta descarga el JPG completo.
- `publicImagePath` acepta rutas que empiezan con `/`, incluida `//dominio`.

**Propuesta:**
1. **Ilustraciones propias por tipo de evento** (12 SVG o PNG 1600×900, paleta C3, sin personas), en `public/images/tipos/{slug}.webp`. Quedan etiquetadas en pantalla como «Ilustración DEMO».
2. **Fotos de stock opcionales** (3 a 6, una o dos por línea) solo de bancos con licencia libre, registradas en `public/images/CREDITOS.md` con URL, autor, fecha y licencia.
3. **Marcado visible:** etiqueta «Imagen ilustrativa» en tarjeta y ficha; `alt` que dice que es ilustración; si el evento no tiene imagen propia, la ficha lo dice en texto.
4. **Optimización:** WebP a 1600 px en portadas y 800 px en tarjetas; quitar `unoptimized`; `sizes` correcto; `remotePatterns` solo para el host de almacenamiento.
5. **Validación de rutas:** `publicImagePath` acepta solo `/images/tipos/`, `/images/stock/` y el host de almacenamiento; rechaza `//`.
6. **Limpieza:** eliminar `public/images/temp/` del repositorio. **Requiere tu confirmación explícita**, porque borra archivos.

**Decisión tuya:** ¿ilustraciones propias (sin riesgo de licencia, recomendado) o fotos de stock? ¿Confirmas la eliminación de `public/images/temp/`?

**Tareas:**
- C1 · Pruebas de `publicImagePath` (rojo primero): rechaza `//`, acepta solo rutas permitidas.
- C2 · Etiqueta visible y `alt` descriptivo en tarjeta y ficha; prueba de render.
- C3 · Ilustraciones y `CREDITOS.md`.
- C4 · `next/image` optimizado; capturas antes y después con tamaño de descarga.
- C5 · Retirar `temp/` tras tu confirmación.

---

## Bloque D · Administración y panel formales

**Problema comprobado:**
- El administrador aprueba o rechaza con solo título, organizador, fecha y modalidad. No ve descripción, precios, cupos ni portada.
- Rechazar es final: no hay motivo ni forma de volver a revisar.
- No hay filtros ni paginación en eventos ni en órdenes.
- Publicar con dos organizadores manda todos los eventos al más antiguo, sin aviso.
- Después de publicar, el organizador no ve ningún mensaje de éxito.

**Propuesta, por fases:**

**D-fase 1 · Sin migración**
1. **Detalle de evento para el administrador** (`/admin/eventos/[id]/`): todos los datos, tipos de entrada con cupo vendido, portada con su host visible.
2. **Confirmación antes de aprobar o rechazar**, y botones con el nombre del evento en el texto accesible.
3. **Filtros por estado** (lista cerrada) y **paginación** de eventos pendientes y de órdenes.
4. **Mensaje de éxito** al publicar (leer `searchParams` en `panel/page.tsx`).
5. **Elección de organizador** al publicar si el usuario tiene más de uno; sin elegir automáticamente el más antiguo.

**D-fase 2 · Con migración `20261106…` (requiere tu aprobación y pruebas en `tests/db`)**
6. **Tabla `event_reviews`** (`event_id`, `decision`, `reason`, `reviewed_by`, `reviewed_at`), con historial por evento. El motivo de rechazo es obligatorio y tiene longitud mínima. El dueño lee el motivo de su evento; nadie escribe directo. Motivo: las columnas de `events` quedan expuestas a `anon` por el grant de tabla.
7. **Nueva versión de `review_organizer_event`** con `p_reason`; la firma anterior se elimina. El autor sale de `auth.uid()`.
8. **Edición del organizador mientras el evento está `pending` o `rejected`**, con una función transaccional (`update_organizer_event`) que aplica las reglas de `publish.ts`, deja el evento en `pending` y no toca tipos de entrada con órdenes. Esto corrige que hoy el dueño no pueda editar un evento `rejected` salvo en dos pasos no atómicos.
9. **Versión revisada:** la aprobación rechaza si el evento cambió después de la revisión.

**D-fase 3 · Endurecimiento (con migración, sujeto a tu aprobación)**
10. **Validar `image_path` en la base** (https, host permitido) y restringir columnas de `events` para `authenticated` (por ejemplo `is_demo`).
11. **Resumen de ventas para el organizador** por función (`organizer_event_sales_summary`) sin nombres ni correos de compradores. Por privacidad no mostramos compradores por nombre sin consentimiento.

**Pruebas (ejemplos):** rechazo sin motivo falla; anon no lee `event_reviews`; otro organizador no lee el motivo; editar `published` falla; cupo menor al vendido falla; un error en un tipo de entrada deshace todo; el evento reenviado no aparece en el catálogo.

**Coordinación:** registrar las decisiones de alcance en `docs/DECISIONS.md` (D-34 en adelante).

**Tareas:**
- D1 · Detalle de evento y confirmación (sin migración), con prueba de consulta por rol.
- D2 · Filtros, paginación y mensaje de éxito, con pruebas unitarias del parser.
- D3 · Migración de `event_reviews` y `review_organizer_event` con motivo (rojo primero en `tests/db`).
- D4 · Edición de evento pendiente o rechazado (`update_organizer_event`), con sus pruebas.
- D5 · Endurecimiento (fase 3), solo si lo apruebas.

---

## Bloque E · Pulido visual y de consistencia

- Revisar espaciados y tipografía contra la escala de marca (documento §3 y §4), sin cambiar valores de color.
- Estados vacíos con texto que explica el siguiente paso.
- `aria-describedby` en campos con error y en agenda, tema y modalidad (hoy faltan).
- Actualizar `docs/design/DESIGN.md` con lo que cambie.

**Tareas:** E1 a E3, cada una con captura antes y después.

---

## Orden y ramas propuestas

1. **Bloque A** (navegación) — rama `codex/mejoras-navegacion`.
2. **Bloque B** (destacados) — rama `codex/mejoras-destacados`, después de A por el header.
3. **Bloque C** (imágenes) — rama `codex/mejoras-imagenes`, sin la limpieza de `temp/` hasta tu confirmación.
4. **Bloque D, fase 1** — rama `codex/mejoras-admin-1`.
5. **Bloque D, fases 2 y 3** — rama `codex/mejoras-admin-2`, con sus migraciones; no se aplican a producción sin tu confirmación.
6. **Bloque E** — rama `codex/mejoras-pulido`.

Cada rama termina con lint, typecheck, pruebas, build, capturas y un PR. Ninguna aplica migraciones sola.

## Preguntas que necesito que respondas antes de empezar

1. **Grupos del menú:** ¿nombres de intención (propongo «Competir», «Aprender», «Conectar») o Compite / Crea / Conecta?
2. **Destacados:** ¿los próximos cuatro (sin migración) o una columna editable?
3. **Imágenes:** ¿ilustraciones propias (recomendado) o fotos de stock con licencia?
4. **`public/images/temp/`:** ¿confirmas su eliminación?
5. **Migraciones:** ¿apruebas las fases 2 y 3 del bloque D?
