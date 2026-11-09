# Fase 7 — Cierre y entrega — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Las tareas marcadas **(equipo)** las hacen personas; el modelo solo prepara plantillas, protocolos y verificaciones.

**Goal:** Verificar todo lo construido (SEO, URLs, rendimiento, compra real), dejar la documentación al día y preparar los entregables académicos sin inventar datos: investigación UX, marketing, costos, capturas y presentación.

**Architecture:** Fase de verificación y documentos. El código solo cambia si una auditoría encuentra un defecto; cada defecto se corrige con prueba en la fase que lo originó o en una rama de arreglo.

**Tech Stack:** Vitest, Playwright, Lighthouse, Markdown, Mermaid.

**Spec:** [análisis](../../analisis/2026-11-09-brechas-y-requerimientos.md) (SEO-08 a SEO-11, CO-09, DOC-03 a DOC-08, UX-01 a UX-05, MK-03, MK-04, DM-01 a DM-04, WF-04, WF-05, IM-03) · [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- **Ningún dato de entrevistas, testeos, métricas, precios o cifras se inventa.** Las plantillas llevan el estado `PENDIENTE` hasta que haya datos reales con fuente y fecha.
- Las cifras de la presentación (31,590 visitas, 872 conversiones, $11,769, $27, ROAS) se conservan tal como están (D-51 = DP-15); las inconsistencias I-01 e I-02 se registran como riesgo, no se corrigen.
- Compra real contra la base remota (`REAL_PURCHASE=1`) y cualquier cambio en producción solo con confirmación explícita del responsable.
- La indexación **no se activa** en esta fase: queda lista y el responsable la enciende cuando lo decida (Fase 5, cierre).
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.

## Review Focus

1. Páginas con filtros (`?ciudad=…`) deben tener canónico a la ruta base y no entrar al sitemap (7.2).
2. Una plantilla de resultados con datos de ejemplo parece investigación real: toda plantilla lleva `PENDIENTE` visible (7.7).
3. Capturas con datos personales de testers reales: anonimizar antes de subirlas (7.5, 7.10).
4. Rutas nuevas sin documentar en `SEO_ROUTES.md` o sin `noindex` cuando son privadas (7.4).
5. La URL final de la presentación no coincide con el dominio real (7.9, 7.10).

---

## Parte 7.A — Verificación técnica

### Tarea 7.1: Auditoría SEO (SEO-09)

**Files:**
- Create: `docs/analisis/auditoria-seo.md`

- [ ] **Step 1:** Levantar un entorno de **preview con base de pruebas** (no producción) con `indexing_enabled = true` y `NEXT_PUBLIC_SITE_URL` de ese preview.
- [ ] **Step 2:** Ejecutar los skills `searchfit-seo:seo-audit` y `searchfit-seo:technical-seo` sobre el preview; ejecutar `searchfit-seo:schema-markup` para validar `Event`, `BreadcrumbList`, `WebSite`, `Organization` y `Article`.
- [ ] **Step 3:** Registrar en `auditoria-seo.md` una tabla `Hallazgo | Gravedad | Archivo o ruta | Estado (corregido en <commit> / justificado)`.
- [ ] **Step 4: Verify:** ningún hallazgo de gravedad alta queda sin corregir ni justificar.
- [ ] **Step 5: Commit** — `git commit -m "docs: auditoría SEO con hallazgos cerrados"`

### Tarea 7.2: Verificación de URLs y rendimiento (SEO-08, SEO-10)

**Files:**
- Create: `tests/e2e/urls.spec.ts`, `docs/analisis/evidencias/fase-7/rendimiento.md`

- [ ] **Step 1: Write the failing/guard test** `tests/e2e/urls.spec.ts`: `test('/congresos sin barra redirige con 308 a /congresos/')`, `test('una ruta inexistente responde 404 con noindex')`, `test('la ruta filtrada /congresos/?ciudad=san-salvador tiene canónico a /congresos/')`, `test('robots.txt y sitemap.xml responden 200 con el tipo correcto')`, `test('las rutas privadas llevan noindex')` (`/carrito/`, `/checkout/`, `/ingresar/`, `/registro/`, `/mis-boletos/`).
- [ ] **Step 2: Run** `npx playwright test tests/e2e/urls.spec.ts --project=chromium` — Expected: PASS (si falla, corregir en la fase de origen).
- [ ] **Step 3:** Repetir las mediciones de Lighthouse móvil de 5.8 (portada, categoría, ficha, checkout) y registrar valores y fecha frente al presupuesto (LCP ≤ 2.5 s, CLS ≤ 0.1).
- [ ] **Step 4: Commit** — `git commit -m "test: verificación de URLs y rendimiento final"`

### Tarea 7.3: E2E final y compras de evidencia (CO-09)

**Files:**
- Modify: `docs/testing/ACCEPTANCE.md`

- [ ] **Step 1: Run** `npm test && npm run lint && npm run typecheck && npm run build && npx playwright test --project=chromium` — Expected: todo en verde.
- [ ] **Step 2 (con confirmación del responsable):** `REAL_PURCHASE=1 npx playwright test tests/e2e/purchase-flow-real.spec.ts --project=chromium` — Expected: 4/4. Anotar ids de orden y fecha en la tabla «Tres compras documentadas» de `ACCEPTANCE.md`.
- [ ] **Step 3:** Añadir a `ACCEPTANCE.md` una sección por fase (0–6) con las pruebas ejecutadas y la evidencia; marcar solo lo que tiene evidencia.
- [ ] **Step 4: Commit** — `git commit -m "docs: evidencias de aceptación de las fases 0 a 6"`

### Tarea 7.4: Documentos finales (DOC-03, DOC-04, DOC-08)

**Files:**
- Modify: `docs/architecture/SEO_ROUTES.md` (tabla de rutas nuevas con indexable o no), `docs/architecture/DATA.md`, `docs/architecture/SYSTEM.md`, `docs/product/PRD.md`, `docs/superpowers/plans/implementation-backlog.md`, `docs/DECISIONS.md`
- Create: `tests/unit/routes-doc.test.ts`

**Interfaces:**
- Tabla de rutas nuevas (indexable ✔ / no ✘): `/blog/` ✔, `/blog/[slug]/` ✔ publicado, `/copa/` ✔ con eventos, `/para-empresas/` ✔, `/privacidad/` ✔, `/terminos/` ✔, `/calendario/[id]/` ✘, `/mis-boletos/` ✘, `/cuenta/` ✘, `/registro/` ✘, `/recuperar/` ✘, `/panel/destacar/[id]/` ✘, `/panel/paquete/` ✘, `/panel/eventos/[id]/checkin|reporte/` ✘, `/admin/*` ✘, `/confirmacion/…/encuesta/` ✘.

- [ ] **Step 1: Write the failing test** `tests/unit/routes-doc.test.ts`: `test('SEO_ROUTES.md lista cada ruta nueva')` — comprueba que el texto contiene cada ruta de la tabla anterior; `test('las rutas no indexables están en privatePaths o llevan noindex en su página')` para `/calendario/`, `/mis-boletos/`, `/cuenta/`, `/registro/`, `/recuperar/`, `/panel/`, `/admin/`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/routes-doc.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** los cambios de documentos; en el backlog añadir las tareas T24 en adelante (una por fase) con evidencia, y en DECISIONS las decisiones pendientes de registrar.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: rutas nuevas, datos y decisiones finales"`

---

## Parte 7.B — Wireframes y capturas

### Tarea 7.5: Capturas «del wireframe al sitio» (WF-04, IM-03)

**Files:**
- Create: `docs/analisis/evidencias/wireframe-vs-sitio/README.md` y `*.png`

- [ ] **Step 1 (al terminar todo, DP-18):** Con el sitio final en 390 px, capturar Home, Categoría, Evento, Carrito y pago, y Confirmación; guardar como `01-home.png`… `05-confirmacion.png` junto a su wireframe de `docs/design/wireframes/`.
- [ ] **Step 2:** El README lista cada par con fecha y una línea sobre qué cambió del wireframe al sitio y por qué.
- [ ] **Step 3: Verify:** cinco pares completos; ninguna captura muestra correos o nombres reales.
- [ ] **Step 4: Commit** — `git commit -m "docs: capturas del wireframe al sitio"`

### Tarea 7.6: Documento de pantallas (WF-05)

**Files:**
- Create: `docs/design/WIREFRAMES.md`

- [ ] **Step 1:** Una sección por pantalla (cinco + las nuevas): persona que atiende, palabra clave SEO de la ruta, referencia de competidor (de `benchmark.md`), hallazgo de usabilidad (de 7.7 si ya hay datos; si no, `PENDIENTE`).
- [ ] **Step 2: Verify:** `grep -c "PENDIENTE" docs/design/WIREFRAMES.md` coincide con las secciones sin datos reales.
- [ ] **Step 3: Commit** — `git commit -m "docs: justificación de cada pantalla"`

---

## Parte 7.C — Entregables académicos (equipo)

### Tarea 7.7: Investigación UX (UX-01 a UX-05) **(equipo)**

**Files:**
- Create: `docs/analisis/ux/guia-entrevista.md`, `docs/analisis/ux/consentimiento.md`, `docs/analisis/ux/resultados-entrevistas.md`, `docs/analisis/ux/benchmark.md`, `docs/analisis/ux/protocolo-test.md`, `docs/analisis/ux/resultados-test.md`, `docs/design/ARBOL-Y-FLUJO.md`, `docs/product/PERSONAS.md`, `tests/unit/ux-docs.test.ts`

**Interfaces:**
- `guia-entrevista.md`: objetivo, perfil (3 universitarios o juniors y 2–3 de RR. HH. o líderes de comunidad), 8–10 preguntas abiertas, forma de anonimizar. `resultados-entrevistas.md`: tabla `Participante (anónimo) | Perfil | Hallazgo | Cita textual | Fecha` con estado `PENDIENTE` hasta tener datos.
- `benchmark.md`: tabla de las siete plataformas (Eventbrite, Luma, Meetup, Fever, Boletia, Passline, Tuboleta) con URL, fecha de consulta, captura, qué copiamos y qué evitamos (según diapositiva 15).
- `protocolo-test.md`: 5 usuarios, 3 tareas (comprar una entrada de un workshop de IA; encontrar un evento gratis en San Salvador; encontrar la entrada ya comprada) y 3 métricas (éxito, tiempo, errores). `resultados-test.md`: tabla `Participante | Dispositivo | Tarea | ¿Completó? | Tiempo | Errores | Comentario | Cambio propuesto`, estado `PENDIENTE`.
- `ARBOL-Y-FLUJO.md`: árbol de categorías (diagrama Mermaid: Home → 12 tipos, 4 temas, 3 ubicaciones, organizador Copa) y flujo de 4 clics y del organizador (publicar → revisar → publicado → reporte).
- `PERSONAS.md`: fichas de Diego, Andrea, Gabriela y Carlos (diapositiva 9) con porcentajes de canal marcados «estimado, por validar».

- [ ] **Step 1: Write the failing test** `tests/unit/ux-docs.test.ts`: `test('existen los ocho documentos de UX')`, `test('las plantillas de resultados llevan PENDIENTE hasta tener datos')` (el texto de `resultados-entrevistas.md` y `resultados-test.md` contiene `PENDIENTE` o una fila con fecha real; nunca ambos vacíos), `test('el benchmark lista las siete plataformas')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/ux-docs.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** los documentos con la estructura anterior.
- [ ] **Step 4 (equipo):** hacer las entrevistas y el test con personas reales y rellenar los resultados con fuente y fecha; capturas del benchmark; aplicar los cambios que salgan del test (con su prueba en la fase correspondiente).
- [ ] **Step 5: Run** el test — Expected: PASS. **Commit** — `git commit -m "docs: plantillas y protocolos de investigación UX"`

### Tarea 7.8: Marketing y proyección (MK-03, MK-04) **(equipo)**

**Files:**
- Create: `docs/analisis/MARKETING.md`, `tests/unit/marketing-doc.test.ts`

**Interfaces:**
- `MARKETING.md` con secciones: canales por persona (diapositiva 24, porcentajes «estimados, por validar»), objetivos SMART a 6 meses (31,590 visitas; 872 conversiones; ROAS 2.0x en junio; 4 paquetes B2B), embudo, inversión de $2,800 (Meta $980, Google $840, TikTok $560, LinkedIn $420; presupuesto asignado por el profesor), captación orgánica en cuatro frentes (SEO, correo, redes con calendario lunes/miércoles/viernes, comunidad y alianzas), proyección 2027 (diapositiva 28), **más** una sección «Riesgos de las cifras» con I-01 e I-02, y una tabla «Qué mide el sitio» que enlaza cada objetivo con su evento de `analytics_events` (5.9).

- [ ] **Step 1: Write the failing test** `tests/unit/marketing-doc.test.ts`: `test('el presupuesto suma $2,800')` (extrae los cuatro importes y suma), `test('cada objetivo SMART tiene fuente o está marcado como supuesto')`, `test('la sección de riesgos menciona I-01 e I-02')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/marketing-doc.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** el documento sin modificar ninguna cifra de la presentación.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: documento de marketing con riesgos de cifras"`

### Tarea 7.9: Dominio, costos y Search Console (DM-01 a DM-04, SEO-11) **(equipo)**

**Files:**
- Create: `docs/analisis/costos.md`, `docs/analisis/activacion.md`

**Interfaces:**
- `costos.md`: tabla `Concepto | Precio | Periodo | Fuente | Fecha de cotización` para dominio (SVNet/nic.sv), hosting, Supabase y Vercel, con **todas las celdas `PENDIENTE`** hasta que el responsable entregue los datos (DP-17). Nota sobre el plan de hosting que menciona el PDF frente al plan realmente usado (DM-03).
- `activacion.md`: lista ordenada para activar la indexación: 1) apuntar `ticketera.c3.com.sv` a Vercel (DM-01); 2) `NEXT_PUBLIC_SITE_URL=https://ticketera.c3.com.sv`; 3) aplicar migraciones pendientes (con confirmación); 4) fijar tarifa diaria y precio del paquete en `/admin/ajustes/`; 5) revisar `robots.txt` y `sitemap.xml` en el dominio final; 6) pulsar «Activar indexación»; 7) registrar el sitemap en Search Console y guardar captura con fecha.
- Frase para la diapositiva de plataforma (DM-04): «El pago es simulado: no se cobra dinero real ni se piden datos bancarios.»

- [ ] **Step 1:** Crear ambos documentos con la estructura anterior.
- [ ] **Step 2 (equipo):** entregar los precios con su fuente; ejecutar `activacion.md` cuando el responsable decida encender la indexación.
- [ ] **Step 3: Verify:** `grep -c "PENDIENTE" docs/analisis/costos.md` es 0 solo cuando todos los precios tienen fuente.
- [ ] **Step 4: Commit** — `git commit -m "docs: costos y lista de activación"`

### Tarea 7.10: Presentación final (DOC-05, IM-03) **(equipo)**

**Files:**
- Create: `docs/analisis/presentacion-cambios.md`

**Interfaces:**
- `presentacion-cambios.md`: tabla por diapositiva del PDF con el cambio a hacer: 1 (portada con integrantes), 4 (quitar cifras de alianzas sin evidencia o citar su fuente), 8 (dominio `ticketera.c3.com.sv`, precios de `costos.md`, frase de pago simulado), 10–11 (botón de compra violeta, sin brillo ni fotos reales; fotos de stock con crédito e ilustraciones propias), 12–13 (capturas de 7.5 y enlace del sitio), 15 (hallazgos reales de `resultados-entrevistas.md`), 18 (resultados reales de `resultados-test.md`), 21 (129 rutas del árbol y organizador Copa), 25 a 28 (cifras sin cambios, con nota de supuestos), 29 (URL final).

- [ ] **Step 1:** Crear el documento con la tabla.
- [ ] **Step 2 (equipo, al final de todo):** subir fotos y capturas finales y actualizar el PDF diapositiva por diapositiva.
- [ ] **Step 3: Verify:** ninguna diapositiva conserva texto «FALTA»; la URL del sitio coincide con el dominio real.
- [ ] **Step 4: Commit** — `git commit -m "docs: cambios a la presentación final"`

---

## Cierre de la fase

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test --project=chromium` — Expected: todo en verde.
- [ ] Marcar el tablero del roadmap y el backlog; PR de `codex/fase-7-cierre`.
