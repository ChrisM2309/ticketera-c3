# Fase 0 — Fundamentos y documentación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar listos los cimientos sin esperar decisiones: decisiones registradas, documentos base corregidos, dos correcciones de código, herramienta de diseño instalada, textos legales y la organización Copa en el seed.

**Architecture:** Cambios pequeños y aislados. Solo hay pruebas nuevas de documentos (`tests/unit`) y de seed (`tests/db`). Ninguna migración.

**Tech Stack:** Vitest (`tests/unit`, `tests/db` con PGlite), Next.js App Router, Markdown.

**Spec:** [docs/analisis/2026-11-09-brechas-y-requerimientos.md](../../analisis/2026-11-09-brechas-y-requerimientos.md) · índice: [roadmap](2026-11-09-roadmap-nuevas-areas.md)

## Global Constraints

- Leer `node_modules/next/dist/docs/` antes de escribir rutas o metadatos (AGENTS.md).
- Español, USD en centavos, sitio y pagos DEMO; sin credenciales en repo ni docs.
- Ninguna migración en esta fase; los cambios de `supabase/seed.sql` se verifican con `tests/db`.
- Verificación por tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`.
- Commits en español con prefijo convencional.

## Review Focus

1. Un archivo de documento nuevo que no aparece en `docs/README.md` rompe el índice: lo detecta `tests/unit/docs-index.test.ts` (tarea 0.2).
2. Una palabra clave del seed con carácter de reemplazo `�` vuelve a colarse: lo detecta `tests/db/seed-encoding.test.ts` (tarea 0.3).
3. Las páginas legales deben existir y enlazarse desde el pie en todas las rutas públicas: E2E de 0.8.

---

## Parte 0.A — Registro y documentos base

### Tarea 0.1: Registrar las decisiones DP-01 a DP-21 (DOC-06)

**Files:**
- Modify: `docs/DECISIONS.md` (filas nuevas D-37 a D-57 al final de la tabla, antes de «Pendientes que no bloquean inicio»)
- Create: `tests/unit/decisions-log.test.ts`

**Interfaces:**
- Produces: ids `D-37`…`D-57`, uno por cada `DP-01`…`DP-21` en el mismo orden (`D-37 = DP-01`, `D-57 = DP-21`). Las fases 4 y 5 añaden `D-58` (indexación, enmienda de D-25) y siguientes.

- [ ] **Step 1: Write the failing test** `tests/unit/decisions-log.test.ts`

```ts
// test('registra D-37 a D-57 sin saltos'): lee docs/DECISIONS.md, extrae /^\| D-(\d+) \|/gm
// expect(ids).toEqual(expect.arrayContaining(range(37, 57)))
// test('cada decisión nueva tiene estado y justificación'): las filas D-37..D-57 tienen 4 celdas no vacías
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/decisions-log.test.ts` — Expected: FAIL (faltan D-37…D-57).
- [ ] **Step 3: Add rows.** Copiar de la sección 7 del análisis la columna «Decisión (2026-11-09)» como texto de decisión, el estado `Decisión del responsable`, y la «Implicación» como justificación. Marcar D-45 (DP-09) como «Cerrada; instalación en tarea 0.5» y D-41 (DP-05) con «mecanismo del botón: ver Fase 5».
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git add docs/DECISIONS.md tests/unit/decisions-log.test.ts && git commit -m "docs: registrar decisiones D-37 a D-57"`

### Tarea 0.2: Corregir documentos base (DOC-01, DOC-02, CO-12 documental)

**Files:**
- Modify: `README.md`, `docs/README.md`, `docs/testing/ACCEPTANCE.md`, `docs/superpowers/plans/implementation-backlog.md`, `docs/architecture/DATA.md`
- Create: `tests/unit/docs-index.test.ts`

- [ ] **Step 1: Write the failing test** `tests/unit/docs-index.test.ts`

```ts
// test('docs/README.md enlaza cada documento de docs/product, architecture, design, checkout, testing, analisis y DECISIONS.md')
// test('README.md ya no dice que el paquete no contiene la aplicación'): expect(readme).not.toMatch(/NO contiene una aplicación Next\.js/)
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/docs-index.test.ts` — Expected: FAIL.
- [ ] **Step 3: Edit documents.**
  - `README.md`: reemplazar la nota «Estado: planificación lista…» por el estado real (aplicación en producción en `demo.ticketera.c3.com.sv`, T01–T18 y T23 terminadas, nuevas áreas en `docs/analisis/` y `docs/superpowers/plans/2026-11-09-roadmap-nuevas-areas.md`).
  - `docs/README.md`: añadir `analisis/2026-11-09-brechas-y-requerimientos.md`, `design/SISTEMA-VISUAL-C3-2026-11.md`, `../PRODUCT.md` y los planes `2026-11-02` a `2026-11-09`.
  - `docs/testing/ACCEPTANCE.md`: marcar con `[x]` solo los criterios P0 que ya tienen evidencia registrada en este mismo archivo (logo a Home, 12 tipos en orden, filtros, fichas, registro gratuito, pago aprobado, pago rechazado, confirmación con token, descarga de QR, solo publicados); dejar sin marcar «concurrencia real» y «despliegue con dominio final».
  - `implementation-backlog.md`: añadir al tablero una nota bajo T10 («concurrencia real pendiente») y una fila por fase del roadmap bajo «Nuevas áreas (Fases 0–7)».
  - `DATA.md`: añadir en «Estados» la línea «`orders.status = cancelled` está reservado; hoy ninguna ruta lo escribe (CO-12)».
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "docs: README, índice, ACCEPTANCE y backlog con el estado real"`

---

## Parte 0.B — Correcciones rápidas de código

### Tarea 0.3: Seed sin caracteres rotos (TX-05)

**Files:**
- Modify: `supabase/seed.sql` (la fila con `registro programaci�n`; buscar con `grep -n $'\xEF\xBF\xBD' supabase/seed.sql`)
- Create: `tests/db/seed-encoding.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { seedSql } from './helpers';
// test('el seed no contiene caracteres de reemplazo'): expect(seedSql.includes('�')).toBe(false)
```

- [ ] **Step 2: Run** `npx vitest run tests/db/seed-encoding.test.ts` — Expected: FAIL.
- [ ] **Step 3: Corregir** la palabra a «registro programación» y guardar el archivo en UTF-8 sin BOM. Revisar las demás filas con el mismo grep.
- [ ] **Step 4: Run** el test y `npx vitest run tests/db/schema.test.ts` — Expected: PASS ambos.
- [ ] **Step 5: Commit** — `git commit -m "fix: palabra clave del seed con carácter roto"`

### Tarea 0.4: `robots` con rutas privadas reales (SEO-12)

**Files:**
- Modify: `src/lib/seo/indexing.ts` (constante `privatePaths`), `tests/unit/indexing.test.ts`

**Interfaces:**
- Produces: `privatePaths: string[]` sin `/publicar/`. Se conserva `/mis-boletos/` porque la Fase 3 crea esa ruta; la Fase 3 añade `/registro/`, `/cuenta/` y `/recuperar/`.

- [ ] **Step 1: Write the failing test** en `tests/unit/indexing.test.ts`: `test('privatePaths no lista rutas inexistentes')` — `expect(privatePaths).not.toContain('/publicar/')` y `expect(privatePaths).toContain('/mis-boletos/')`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/indexing.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement:** quitar `'/publicar/'` de `privatePaths` y añadir en el comentario que `/mis-boletos/` se crea en la Fase 3.
- [ ] **Step 4: Run** el test — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "fix: robots sin rutas privadas inexistentes"`

---

## Parte 0.C — Herramientas y guías de diseño

### Tarea 0.5: Instalar Impeccable (DI-00)

**Files:**
- Modify: `package.json` / `package-lock.json` (solo si Impeccable se instala como paquete npm) o ninguno si es una skill de Claude
- Modify: `docs/design/DESIGN.md` (sección «Reglas de calidad de interfaz»: comando exacto)

- [ ] **Step 1: Confirmar el método de instalación** leyendo el README oficial de `pbakaus/impeccable` (la skill lo cita en DESIGN.md). No adivinar el comando.
- [ ] **Step 2: Instalar** con el método documentado; registrar el comando exacto y la versión.
- [ ] **Step 3: Verificar:** `impeccable detect --json src/components/ui/button.tsx` (o el comando equivalente documentado) imprime JSON — Expected: salida JSON sin error.
- [ ] **Step 4: Documentar** en DESIGN.md el comando y la versión; quitar la frase «Falta `PRODUCT.md`» (el archivo existe en la raíz).
- [ ] **Step 5: Run** `npm run lint && npm run typecheck` — Expected: sin errores. **Commit** — `git commit -m "chore: instalar Impeccable y documentar su comando"`

### Tarea 0.6: Documentar las guías de diseño (DI-01)

**Files:**
- Modify: `docs/design/DESIGN.md`, `PRODUCT.md` (enlazar la guía)

- [ ] **Step 1:** Añadir sección «Guías de diseño»: la skill `frontend-design` como guía de dirección (jerarquía, tipografía, decisiones intencionales) y Impeccable como detector; indicar que los tokens de marca mandan sobre ambas.
- [ ] **Step 2:** Añadir al principio de la sección «Reglas de estilo» la regla 13: «Los iconos salen de `lucide-react` mediante el componente `Icon` (Fase 1); no se escriben SVG a mano».
- [ ] **Step 3: Verify:** `grep -n "Falta PRODUCT.md" docs/design/DESIGN.md` — Expected: sin resultados.
- [ ] **Step 4: Commit** — `git commit -m "docs: guías de diseño y regla de iconos"`

---

## Parte 0.D — Organizador Copa y textos legales

### Tarea 0.7: Organizador DEMO «Copa Salvadoreña» (TX-03)

**Files:**
- Modify: `supabase/seed.sql` (insertar en `organizers` con `slug = 'copa'`, `name = 'Copa Salvadoreña'`, descripción que diga «Organizador DEMO del proyecto académico»; asignar a tres eventos DEMO de `competencias` y `hackathons`)
- Create: `tests/db/seed-organizers.test.ts`

**Interfaces:**
- Produces: fila `organizers.slug = 'copa'` con `status = 'active'` (el valor exacto del enum está en la migración inicial; leerlo). `/claude/` **no** se siembra (DP-11). La ruta pública `/copa/` se construye en la tarea 5.7.

- [ ] **Step 1: Write the failing test:** `test('existe el organizador copa marcado DEMO')` (consulta `organizers` por slug y comprueba que `description` incluya «DEMO») y `test('no existe organizador claude')`.
- [ ] **Step 2: Run** `npx vitest run tests/db/seed-organizers.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** en el seed.
- [ ] **Step 4: Run** el test y `npx vitest run tests/db` — Expected: PASS (el seed sigue reproducible).
- [ ] **Step 5: Commit** — `git commit -m "feat: organizador DEMO Copa Salvadoreña en el seed"`

### Tarea 0.8: Privacidad y términos DEMO (LG-01, LG-03)

**Files:**
- Create: `src/features/legal/content.ts`, `src/app/privacidad/page.tsx`, `src/app/terminos/page.tsx`, `tests/unit/legal-content.test.ts`, `tests/e2e/legal.spec.ts`
- Modify: `src/components/layout/site-footer.tsx` (enlaces a ambas páginas)

**Interfaces:**
- Produces: `export type LegalSection = { id: string; title: string; paragraphs: string[] }`; `export const privacySections: LegalSection[]`; `export const termsSections: LegalSection[]`.
- `privacySections` debe contener los `id`: `datos`, `finalidad`, `analitica`, `cookies`, `conservacion`, `derechos`, `contacto`, `demo`. `termsSections`: `alcance`, `pagos-simulados`, `contenido`, `responsabilidad`, `demo`.

- [ ] **Step 1: Write the failing tests:** `legal-content.test.ts` — `test('la política de privacidad cubre los ocho apartados')` y `test('los términos incluyen pagos simulados y no servicio oficial de C3')` (texto de `demo` contiene «no es un servicio oficial de C3»). E2E: `test('el pie enlaza privacidad y términos y ambas páginas cargan')` en 375 px y 1280 px.
- [ ] **Step 2: Run** ambas pruebas — Expected: FAIL.
- [ ] **Step 3: Implement.** Redactar los textos en español claro a partir de los apartados; datos reales: cuenta (correo, nombre, universidad opcional), compra (nombre, correo, teléfono opcional), analítica propia con consentimiento, cookies de sesión y consentimiento, sin datos de tarjeta, contacto de demostración. Páginas de servidor con metadatos y `generateMetadata` según las guías de Next 16.
- [ ] **Step 4: Run** `npx vitest run tests/unit/legal-content.test.ts` y `npx playwright test tests/e2e/legal.spec.ts --project=chromium` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: páginas de privacidad y términos DEMO"`. **El responsable debe revisar el texto antes del PR.**

---

## Cierre de la fase

- [ ] `npm test` (unit + db), `npm run lint`, `npm run typecheck`, `npm run build` — Expected: todo en verde.
- [ ] PR de `codex/fase-0-fundamentos` con la lista de tareas 0.1–0.8 y evidencia en el backlog.
