# Fase 7 — Cierre y entrega — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Las tareas marcadas **(equipo)** las hacen personas; el modelo solo prepara plantillas, protocolos y verificaciones.

**Goal:** Verificar el sitio (SEO, URLs y rendimiento), cerrar E2E y documentos finales, y conservar capturas del sitio final. El responsable ejecuta manualmente una lista mínima de activación. No incluye investigación UX, marketing ni presentación.

**Architecture:** Fase de verificación y documentos. El código solo cambia si una auditoría encuentra un defecto; cada defecto se corrige con prueba en la fase que lo originó o en una rama de arreglo.

**Tech Stack:** Vitest, Playwright, Lighthouse, Markdown, Mermaid.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (SEO-08 a SEO-11, CO-09 y requisitos documentales finales aplicables) · [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- No se inventan resultados ni métricas en la auditoría, la evidencia E2E o los documentos finales; los datos no disponibles se identifican como pendientes.
- No se elaboran investigación UX, entregables de marketing ni presentaciones; corresponden al equipo del responsable.
- Compra real contra la base remota (`REAL_PURCHASE=1`) y cualquier cambio en producción solo con confirmación explícita del responsable.
- La indexación **no se activa** en esta fase: queda lista y el responsable la enciende cuando lo decida (Fase 5, cierre).
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Páginas con filtros (`?ciudad=…`) deben tener canónico a la ruta base y no entrar al sitemap (7.2).
2. Las capturas del sitio final no exponen datos personales ni comparan contra wireframes (7.6).
3. Rutas nuevas sin documentar en `SEO_ROUTES.md` o sin `noindex` cuando son privadas (7.4).
4. La lista manual de activación indica los prerrequisitos y comprobaciones mínimos antes de activar indexación (7.9).

---

## Parte 7.A — Verificación técnica

### Tarea 7.1: Auditoría SEO (SEO-09)

**Estado:** parcial; se auditó el dominio DEMO y se documentó el hallazgo/pendiente, pero falta un preview aislado con base de pruebas para validar el modo indexable.

**Files:**
- Create: `docs/analisis/auditoria-seo.md`

- [ ] **Step 1:** Levantar un entorno de **preview con base de pruebas** (no producción) con `indexing_enabled = true` y `NEXT_PUBLIC_SITE_URL` de ese preview.
- [ ] **Step 2:** Ejecutar los skills `searchfit-seo:seo-audit` y `searchfit-seo:technical-seo` sobre el preview; ejecutar `searchfit-seo:schema-markup` para validar `Event`, `BreadcrumbList`, `WebSite`, `Organization` y `Article`.
- [ ] **Step 3:** Registrar en `auditoria-seo.md` una tabla `Hallazgo | Gravedad | Archivo o ruta | Estado (corregido en <commit> / justificado)`.
- [ ] **Step 4: Verify:** ningún hallazgo de gravedad alta queda sin corregir ni justificar.
- [ ] **Step 5: Commit** — `git commit -m "docs: auditoría SEO con hallazgos cerrados"`

### Tarea 7.2: Verificación de URLs y rendimiento (SEO-08, SEO-10)

**Estado:** URLs 5/5 E2E; métricas Lighthouse pendientes por cuota PSI 0 y sin runner local disponible.

**Files:**
- Create: `tests/e2e/urls.spec.ts`, `docs/analisis/evidencias/fase-7/rendimiento.md`

- [ ] **Step 1: Write the failing/guard test** `tests/e2e/urls.spec.ts`: `test('/congresos sin barra redirige con 308 a /congresos/')`, `test('una ruta inexistente responde 404 con noindex')`, `test('la ruta filtrada /congresos/?ciudad=san-salvador tiene canónico a /congresos/')`, `test('robots.txt y sitemap.xml responden 200 con el tipo correcto')`, `test('las rutas privadas llevan noindex')` (`/carrito/`, `/checkout/`, `/ingresar/`, `/registro/`, `/mis-boletos/`).
- [ ] **Step 2: Run** `npx playwright test tests/e2e/urls.spec.ts --project=chromium` — Expected: PASS (si falla, corregir en la fase de origen).
- [ ] **Step 3:** Repetir las mediciones de Lighthouse móvil de 5.8 (portada, categoría, ficha, checkout) y registrar valores y fecha frente al presupuesto (LCP ≤ 2.5 s, CLS ≤ 0.1).
- [ ] **Step 4: Commit** — `git commit -m "test: verificación de URLs y rendimiento final"`

### Tarea 7.3: E2E final y compras de evidencia (CO-09)

**Estado:** parcial. Vitest 656/656; Playwright general 71 aprobadas, 19 omitidas y 2 fallidas (navegación/datos DEMO dinámicos). La compra real creó una orden confirmada pero la prueba falló al verificar el outbox; no se repitió.

**Files:**
- Modify: `docs/testing/ACCEPTANCE.md`

- [ ] **Step 1: Run** `npm test && npm run lint && npm run typecheck && npm run build && npx playwright test --project=chromium` — Expected: todo en verde.
- [ ] **Step 2 (con confirmación del responsable):** `REAL_PURCHASE=1 npx playwright test tests/e2e/purchase-flow-real.spec.ts --project=chromium` — Expected: 4/4. Anotar ids de orden y fecha en la tabla «Tres compras documentadas» de `ACCEPTANCE.md`.
- [ ] **Step 3:** Añadir a `ACCEPTANCE.md` una sección por fase (0–6) con las pruebas ejecutadas y la evidencia; marcar solo lo que tiene evidencia.
- [ ] **Step 4: Commit** — `git commit -m "docs: evidencias de aceptación de las fases 0 a 6"`

### Tarea 7.4: Documentos finales (DOC-03, DOC-04, DOC-08)

**Estado:** documentación de rutas, datos, sistema, producto y decisiones actualizada; test documental 2/2.

**Files:**
- Modify: `docs/architecture/SEO_ROUTES.md` (tabla de rutas nuevas con indexable o no), `docs/architecture/DATA.md`, `docs/architecture/SYSTEM.md`, `docs/product/PRD.md`, `docs/DECISIONS.md`
- Create: `tests/unit/routes-doc.test.ts`

**Interfaces:**
- Tabla de rutas nuevas (indexable ✔ / no ✘): `/blog/` ✔, `/blog/[slug]/` ✔ publicado, `/copa/` ✔ con eventos, `/para-empresas/` ✔, `/privacidad/` ✔, `/terminos/` ✔, `/calendario/[id]/` ✘, `/mis-boletos/` ✘, `/cuenta/` ✘, `/registro/` ✘, `/recuperar/` ✘, `/panel/destacar/[id]/` ✘, `/panel/paquete/` ✘, `/panel/eventos/[id]/checkin|reporte/` ✘, `/admin/*` ✘, `/confirmacion/…/encuesta/` ✘.

- [ ] **Step 1: Write the failing test** `tests/unit/routes-doc.test.ts`: `test('SEO_ROUTES.md lista cada ruta nueva')` — comprueba que el texto contiene cada ruta de la tabla anterior; `test('las rutas no indexables están en privatePaths o llevan noindex en su página')` para `/calendario/`, `/mis-boletos/`, `/cuenta/`, `/registro/`, `/recuperar/`, `/panel/`, `/admin/`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/routes-doc.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** los cambios en los documentos enumerados; registrar en DECISIONS las decisiones pendientes que correspondan. El backlog queda fuera de esta tarea.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: rutas nuevas, datos y decisiones finales"`

---

## Parte 7.B — Capturas del sitio final

### Tarea 7.6: Capturas del sitio final

**Estado:** 10 capturas (Home, categoría, evento, carrito y checkout; móvil y escritorio) en `docs/analisis/evidencias/fase-7/`. Confirmación pendiente por el bloqueo de outbox registrado en ACCEPTANCE.md.

**Files:**
- Create: `docs/analisis/evidencias/fase-7/README.md` y capturas finales del sitio

- [ ] **Step 1 (sitio final):** Capturar las pantallas representativas ya terminadas (Home, categoría, evento, carrito/checkout y confirmación) en viewport móvil de 390 px y escritorio; guardar las imágenes en `docs/analisis/evidencias/fase-7/`.
- [ ] **Step 2:** El README enumera cada captura con ruta, viewport y fecha. No incluir wireframes, comparativas, evaluaciones de UX ni datos personales.
- [ ] **Step 3: Verify:** las capturas corresponden al sitio final y no exponen correos, nombres ni tokens reales.
- [ ] **Step 4: Commit** — `git commit -m "docs: capturas finales del sitio"`

### Tarea 7.9: Lista mínima de activación manual (SEO-11) **(responsable)**

**Estado:** documento creado y enlazado desde `docs/README.md`; activación queda a cargo manual del responsable.

**Files:**
- Create: `docs/analisis/activacion.md`

**Interfaces:**
- `activacion.md`: lista breve para que el responsable realice manualmente cuando decida publicar/indexar: confirmar que el dominio final apunta al deploy correcto y que `NEXT_PUBLIC_SITE_URL` coincide; comprobar `robots.txt` y `sitemap.xml` en ese dominio; verificar que los prerrequisitos operativos (migraciones y ajustes necesarios) ya están resueltos; activar indexación desde `/admin/ajustes/`; registrar el sitemap en Search Console y anotar fecha. No ejecutar estos pasos como parte de la tarea ni recopilar costos.

- [ ] **Step 1:** Crear `activacion.md` con la lista manual mínima indicada.
- [ ] **Step 2 (responsable, manual):** completar la lista solo cuando decida activar el dominio/indexación.
- [ ] **Step 3: Verify:** cada acción es concreta y no presupone precios, costos ni una activación ya autorizada.
- [ ] **Step 4: Commit** — `git commit -m "docs: lista mínima para activación manual"`

---

## Cierre de la fase

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test --project=chromium` — Expected: todo en verde.
- [ ] Actualizar el backlog con el alcance revisado y abrir PR de `codex/fase-7-cierre`.
