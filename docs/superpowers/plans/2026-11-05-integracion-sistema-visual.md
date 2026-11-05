# Integración del sistema visual C3 en Ticketera · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adoptar las mejoras del sistema visual C3 (documento de corte 5-nov-2026) en Ticketera sin romper lo existente y respetando el objetivo del producto: vender entradas con claridad, en móvil y con etiquetas DEMO.

**Architecture:** Los tokens de color, radio, sombra y tipografía viven en `src/app/globals.css` como variables CSS y se exponen con `@theme inline`. Cada cambio de valor se verifica con una prueba que lee esas variables y calcula el contraste WCAG. Los componentes solo cambian donde el documento y el producto coinciden; el resto se documenta como decisión pendiente.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (`@theme inline`), class-variance-authority, Vitest (pruebas unitarias), Playwright (E2E y capturas).

**Spec:** `docs/design/SISTEMA-VISUAL-C3-2026-11.md` (copia del documento de marca). Donde el documento y el producto chocan, gana el producto cuando el documento lo permite; los desacuerdos quedan en `docs/DECISIONS.md` (D-33).

## Global Constraints

- Idioma de interfaz: español. Moneda: USD, montos en centavos. (AGENTS.md)
- Etiquetar el sitio y los pagos como DEMO; el distintivo DEMO sigue visible en cabecera y pie. (AGENTS.md)
- El logo lleva al Home; el menú no incluye «Inicio». (AGENTS.md)
- Tipografía: Montserrat (`--font-titulo`) para títulos, botones y etiquetas; Poppins (`--font-texto`) para texto. (AGENTS.md, documento §3)
- Foco de teclado: anillo de 3 px con desfase de 2 px; nunca se elimina. (documento §8)
- Contraste AA: texto normal 4.5:1; texto grande y componentes 3:1. (documento §8)
- Tamaño táctil mínimo 44 px; botones y campos de checkout de al menos 44 px. (documento §8; DESIGN.md)
- Validar en 390 px y 1280 px sin desbordamiento horizontal. (AGENTS.md §4)
- Sin gradientes, texturas ni emojis en la interfaz de compra. (documento §1.6 y §10; DESIGN.md)
- Prohibido: animación que retrase la lectura o la compra; `prefers-reduced-motion` respetado. (documento §7)

## Review Focus

1. **Texto blanco sobre violeta de acción en el modo oscuro del encabezado.** El botón «Buscar» del encabezado usa `primario` dentro de `data-theme="oscuro"`. Debe pasar 4.5:1 en todos sus estados (reposo y hover). Prueba: `tests/unit/design-tokens.test.ts`.
2. **Foco visible en campos de formulario.** Los campos pierden el contorno nativo (`outline-none`) y dependen del anillo `focus-visible:ring-foco`. Prueba: `tests/unit/design-tokens.test.ts` (foco contra fondo) y revisión visual en Task 11.
3. **Una sola acción de compra visible por vista.** Al unificar `compra` con `accion`, ninguna vista debe mostrar dos botones primarios distintos. Prueba: revisión de capturas de carrito y checkout en Task 11.
4. **Etiqueta DEMO legible.** El distintivo usa `advertencia` como fondo; debe mantener 4.5:1 con su texto. Prueba: `tests/unit/design-tokens.test.ts`.
5. **Sin desbordamiento a 390 px en formularios y tarjetas.** El cambio de radios y de campos no debe ensanchar la página. Prueba: `tests/e2e/purchase-flow.spec.ts` (sin desbordamiento horizontal) y capturas en Task 11.

---

### Task 0: Línea base visual

**Files:**
- Create: `docs/testing/capturas-t23/` (capturas de referencia; solo si el usuario las pide en el repo, si no van a `scratchpad`)
- Create (scratch, fuera del repo): `capturar.mjs`

**Interfaces:**
- Consumes: servidor de producción local (`npm run build` y `next start -p 3123`) con datos reales de Supabase.
- Produces: capturas `antes-<pagina>-<ancho>.png` para `/`, `/congresos/`, una ficha, `/ingresar/` y `/carrito/` a 390 y 1280 px.

- [ ] **Step 1: Escribir el script de capturas** en `scratchpad` (usa `chromium` de `@playwright/test`; URL base por variable de entorno).
- [ ] **Step 2: Correr el script** con `BASE=http://localhost:3123 PREFIJO=antes`. Esperado: 10 PNG generados.
- [ ] **Step 3: Anotar** la ruta de las capturas en `docs/testing/ACCEPTANCE.md` (sección T23, sin copiarlas al repo).

---

### Task 1: Registro de la tarea y decisiones

**Files:**
- Modify: `docs/superpowers/plans/implementation-backlog.md` (tablero y registro: fila T23)
- Modify: `docs/DECISIONS.md` (nueva decisión D-33)

**Interfaces:**
- Consumes: ninguna.
- Produces: el identificador `T23` y la decisión `D-33`, que referencian las tareas siguientes.

- [ ] **Step 1: Agregar la fila T23 al tablero** como «Extra · fuera de plan», prioridad P0, dependencias «T02», estado «En curso». Sin cambiar los estados de otras tareas.
- [ ] **Step 2: Agregar D-33 a `DECISIONS.md`** con estas decisiones, una por línea de la tabla:

| Punto | Decisión | Motivo |
|---|---|---|
| Línea de Ticketera | Conecta (`#4f5ba9`, acción `#6548c7`) | Ticketera conecta a organizadores y asistentes; documento §1.4 |
| Acción | `accion` = `#6548c7` (claro) y `#6e54cc` (oscuro); `accion-intensa` = `#5236b0` (claro) y `#55409f` (oscuro) | Documento §2.3; texto blanco y `#eaf0f8` pasan 4.5:1 |
| CTA de compra | `compra` deja de usar turquesa y usa `accion` | Documento §1.4 y §10 («acción solo botón primario»); la vista sigue con una sola acción |
| Foco y enlace | `foco` = `#6548c7` (claro) y `#b9a8f0` (oscuro); `enlace` = `accion` | Documento §8 y §2.3 |
| Neutrales | `superficie-sutil` `#f6f8fb`, `texto-suave` `#536178`, `borde` `#dce3ed`, `borde-fuerte` `#7c8ba0`; `fondo` se mantiene `#f3f6fa` | Documento §2.2; `#f3f6fa` es un neutro muy claro (§1.6) |
| Radios | Campos `radius-sm` 6 px; tarjetas de evento y de categoría `radius-md` 12 px; módulos grandes sin cambio | Ticketera DESIGN.md (campos 6 px, tarjetas 12 px) y documento §5 |
| Sombras | `shadow-md` sale de las secciones de resumen y de entradas; queda `shadow-sm` | DESIGN.md (`sombra-md` solo para elementos flotantes) |
| Modo oscuro | Se mantiene solo para cabecera y pie (`data-theme`). No se activa en el resto de la página | Documento §9 y D-14 |
| Info | Sin token `info` por ahora: Ticketera no muestra estados informativos | Documento §2.4 (pendiente de marca) |
| Movimiento | Sin órbita decorativa ni tokens nuevos de movimiento; `prefers-reduced-motion` global | Documento §7 y DESIGN.md (movimiento con intención) |
| Voz | Sin cambio de copy en esta tarea; el conflicto voseo/tú queda para decisión de producto | Documento §10 (tú) frente a DESIGN.md (tuteo con voseo) |

- [ ] **Step 3: Verificar** con `grep -n "D-33" docs/DECISIONS.md` y `grep -n "T23" docs/superpowers/plans/implementation-backlog.md`. Esperado: una línea cada uno.
- [ ] **Step 4: Commit**

```bash
git add docs/DECISIONS.md docs/superpowers/plans/implementation-backlog.md docs/design/SISTEMA-VISUAL-C3-2026-11.md docs/superpowers/plans/2026-11-05-integracion-sistema-visual.md
git commit -m "docs: registra T23 (integración del sistema visual) y la decisión D-33"
```

---

### Task 2: Prueba de contraste de los tokens (rojo primero)

**Files:**
- Create: `tests/unit/design-tokens.test.ts`

**Interfaces:**
- Consumes: `src/app/globals.css` (bloques `:root` y `[data-theme='oscuro']`).
- Produces: `readTokens(theme: 'claro' | 'oscuro'): Record<string, string>` y `contrast(a: string, b: string): number`, usados en pruebas posteriores.

- [ ] **Step 1: Escribir la prueba**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

function readTokens(selector: string): Record<string, string> {
  const block = css.slice(css.indexOf(selector)).slice(0, css.slice(css.indexOf(selector)).indexOf('}'));
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2]]));
}

// Luminancia relativa WCAG 2.x y razón de contraste.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = readTokens(':root {');
const dark = readTokens("[data-theme='oscuro'] {");

describe('tokens de marca: contraste AA', () => {
  it('texto inverso sobre acción cumple 4.5:1 en claro y en oscuro (botón primario)', () => {
    expect(contrast(light['texto-inverso'], light.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-inverso'], light['accion-intensa'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-inverso'], dark.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-inverso'], dark['accion-intensa'])).toBeGreaterThanOrEqual(4.5);
  });

  it('texto y texto suave cumplen 4.5:1 sobre el fondo de página y las superficies', () => {
    expect(contrast(light.texto, light.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-suave'], light.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-suave'], light['superficie-sutil'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.texto, dark.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-suave'], dark.superficie)).toBeGreaterThanOrEqual(4.5);
  });

  it('el foco y el enlace cumplen 3:1 contra su fondo', () => {
    expect(contrast(light.foco, light.superficie)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.foco, dark.fondo)).toBeGreaterThanOrEqual(3);
    expect(contrast(light.enlace, light.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.enlace, dark.fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('el borde de campos cumple 3:1 sobre la superficie clara', () => {
    expect(contrast(light['borde-fuerte'], light.superficie)).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Correr la prueba** con `npx vitest run tests/unit/design-tokens.test.ts`. Esperado: FAIL en el contraste de `dark['accion-intensa']` (`#3f74c2` da 4.08) y en `enlace` oscuro si no pasa. Anotar qué assert falla.

---

### Task 3: Tokens de color, neutrales y tipografía

**Files:**
- Modify: `src/app/globals.css` (bloques `:root`, `[data-theme='oscuro']`, `@theme inline`, `@media (prefers-reduced-motion)`)

**Interfaces:**
- Consumes: `readTokens` y `contrast` de Task 2.
- Produces: tokens `--accion`, `--accion-intensa`, `--foco`, `--enlace`, `--superficie-sutil`, `--texto-suave`, `--borde`, `--borde-fuerte` con los valores de D-33; `--text-etiqueta` (0.8125rem), `--tracking-etiqueta` (0.08em). Se eliminan `--compra`, `--compra-intensa` y `--color-compra*`.

- [ ] **Step 1: Cambiar los valores en `:root`**: `--superficie-sutil: #f6f8fb`, `--texto-suave: #536178`, `--borde: #dce3ed`, `--accion: #6548c7`, `--accion-intensa: #5236b0`, `--enlace: #6548c7`, `--foco: #6548c7`. Quitar `--compra` y `--compra-intensa`.
- [ ] **Step 2: Cambiar los valores en `[data-theme='oscuro']`**: `--accion: #6e54cc`, `--accion-intensa: #55409f`, `--enlace: #b9a8f0`, `--foco: #b9a8f0`.
- [ ] **Step 3: Agregar tokens de etiqueta** en `@theme inline`: `--text-etiqueta: 0.8125rem;` y `--tracking-etiqueta: 0.08em;`. Quitar `--color-compra` y `--color-compra-intensa`.
- [ ] **Step 4: Agregar la regla de movimiento reducido** al final de `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Correr la prueba de Task 2.** Esperado: PASS en los cuatro bloques.
- [ ] **Step 6: Correr** `npm run lint` y `npm run typecheck`. Esperado: sin errores.
- [ ] **Step 7: Commit** `git commit -m "style: tokens de marca C3 para acción, foco, neutrales y movimiento reducido"`. Nota: `button.tsx` usa `bg-compra` hasta Task 4; el build fallará en Task 3 si no se cambia en el mismo commit. Hacer Task 3 y Task 4 en un solo commit.

---

### Task 4: Botón de compra y tipografía del botón

**Files:**
- Modify: `src/components/ui/button.tsx`
- Create: `tests/unit/button-variants.test.ts`

**Interfaces:**
- Consumes: tokens de Task 3 (`accion`, `accion-intensa`, `texto-inverso`, `text-etiqueta`, `tracking-etiqueta`).
- Produces: `buttonVariants({ variant: 'primario' | 'compra' | 'secundario', size })` sin clases `bg-compra`.

- [ ] **Step 1: Escribir la prueba**

```ts
import { describe, expect, it } from 'vitest';
import { buttonVariants } from '../../src/components/ui/button';

describe('buttonVariants', () => {
  it('la compra usa la acción de la marca y no el turquesa de la línea Crea', () => {
    const compra = buttonVariants({ variant: 'compra' });
    expect(compra).toContain('bg-accion');
    expect(compra).toContain('text-texto-inverso');
    expect(compra).not.toContain('bg-compra');
    expect(compra).not.toContain('text-navy');
  });

  it('la etiqueta del botón usa los tokens de etiqueta, no valores sueltos', () => {
    const base = buttonVariants();
    expect(base).toContain('text-etiqueta');
    expect(base).toContain('tracking-etiqueta');
    expect(base).not.toContain('text-[13px]');
    expect(base).not.toContain('tracking-[0.08em]');
  });
});
```

- [ ] **Step 2: Correr la prueba.** Esperado: FAIL.
- [ ] **Step 3: Implementar**: en `button.tsx`, base `font-titulo text-etiqueta font-bold uppercase tracking-etiqueta`; `compra: 'bg-accion text-texto-inverso hover:bg-accion-intensa'`.
- [ ] **Step 4: Correr la prueba y `npm run typecheck`.** Esperado: PASS.
- [ ] **Step 5: Commit junto con Task 3** `git commit -m "style: botón de compra con la acción de marca y tokens de etiqueta"`.

---

### Task 5: Radio de campos y de tarjetas

**Files:**
- Create: `src/components/ui/field.ts`
- Modify: `src/components/auth/login-form.tsx` (línea 16), `src/components/checkout/checkout-page.tsx` (líneas 245 y 269), `src/components/organizers/publish-event-form.tsx` (línea 21), `src/components/catalog/catalog-filters.tsx` (campos de búsqueda y select), `src/components/catalog/event-card.tsx` (línea 36), `src/components/catalog/category-tile.tsx` (línea 21)
- Create: `tests/unit/field-class.test.ts`

**Interfaces:**
- Consumes: ninguna.
- Produces: `export const fieldClass: string` con `rounded-sm`, usado por los cuatro formularios.

- [ ] **Step 1: Escribir la prueba**

```ts
import { describe, expect, it } from 'vitest';
import { fieldClass } from '../../src/components/ui/field';

describe('fieldClass', () => {
  it('usa radio de 6 px (radius-sm) y altura táctil de 44 px', () => {
    expect(fieldClass).toContain('rounded-sm');
    expect(fieldClass).not.toContain('rounded-md');
    expect(fieldClass).toContain('min-h-11');
  });

  it('conserva el anillo de foco de teclado', () => {
    expect(fieldClass).toContain('focus-visible:ring-2');
    expect(fieldClass).toContain('focus-visible:ring-foco');
  });
});
```

- [ ] **Step 2: Correr la prueba.** Esperado: FAIL (módulo no existe).
- [ ] **Step 3: Implementar** `src/components/ui/field.ts` con `export const fieldClass = 'min-h-11 rounded-sm border border-borde-fuerte bg-superficie px-3 font-texto text-base text-texto outline-none focus-visible:ring-2 focus-visible:ring-foco';`. Reemplazar la cadena repetida en los cuatro formularios por `fieldClass` (importación desde `@/components/ui/field`).
- [ ] **Step 4: En `event-card.tsx` y `category-tile.tsx`** cambiar `rounded-lg` por `rounded-md`.
- [ ] **Step 5: Correr la prueba, `npm run lint` y `npm run typecheck`.** Esperado: PASS.
- [ ] **Step 6: Commit** `git commit -m "style: campos con radio de 6 px y tarjetas de evento con radio de 12 px"`.

---

### Task 6: Sombras y clases sin token

**Files:**
- Modify: `src/components/catalog/ticket-selector.tsx` (línea 68: `shadow-md` → `shadow-sm`), `src/components/checkout/cart-summary.tsx` (línea 18: `shadow-md` → `shadow-sm`), `src/components/catalog/event-card.tsx` (línea 66: quitar `text-compite-claro`), `src/app/page.tsx` (línea 131: quitar `text-compite-claro`), `src/app/globals.css` (quitar `--shadow-tarjeta`)
- Test: `tests/unit/design-tokens.test.ts` (agregar un caso)

**Interfaces:**
- Consumes: ninguna.
- Produces: ninguna clase apunta a un token inexistente.

- [ ] **Step 1: Agregar el caso de prueba**: `it('ninguna clase usa un token de color que no existe', ...)` que recorre `src/**/*.tsx` buscando `text-(\w+-?)+` contra los tokens de `@theme` y falla si aparece `text-compite-claro`.
- [ ] **Step 2: Correr la prueba.** Esperado: FAIL con `text-compite-claro`.
- [ ] **Step 3: Implementar**: quitar `text-compite-claro` de los dos archivos (el texto hereda el color del contenedor, como hoy; sin cambio visual). Cambiar `shadow-md` por `shadow-sm` en los dos componentes. Quitar `--shadow-tarjeta` de `@theme inline`.
- [ ] **Step 4: Correr la prueba.** Esperado: PASS.
- [ ] **Step 5: Commit** `git commit -m "style: quitar clases sin token y reducir sombras de resumen"`.

---

### Task 7: Documentación de diseño y acceptance

**Files:**
- Modify: `docs/design/DESIGN.md` (secciones de color, radios, sombras y acción)
- Modify: `docs/testing/ACCEPTANCE.md` (nueva sección T23 con capturas y pruebas)
- Modify: `docs/superpowers/plans/implementation-backlog.md` (estado de T23 y fila de registro)

**Interfaces:**
- Consumes: resultados de Tasks 0–6 y Task 8.
- Produces: documentación consistente con D-33.

- [ ] **Step 1: Actualizar DESIGN.md**: `accion` violeta (valores de D-33), `enlace` y `foco`, radios de campos (6 px) y de tarjetas (12 px), sombras, y la nota de modo oscuro (solo cabecera y pie).
- [ ] **Step 2: Actualizar ACCEPTANCE.md** con una sección T23: pruebas ejecutadas, capturas antes y después, y pendientes (modo oscuro global, `info`, voz, auditoría con herramienta).
- [ ] **Step 3: Actualizar el backlog**: T23 pasa a «Terminado» solo si Task 8 pasa; si no, queda «En revisión».
- [ ] **Step 4: Commit** `git commit -m "docs: DESIGN, ACCEPTANCE y backlog de la integración del sistema visual"`.

---

### Task 8: Verificación de que nada existente se rompe

**Files:**
- Create (scratch): capturas `despues-*.png` en `scratchpad`

**Interfaces:**
- Consumes: todas las tareas anteriores.
- Produces: evidencia de que la suite, el build y las capturas no cambian el comportamiento salvo lo previsto.

- [ ] **Step 1: Pruebas unitarias y de base**: `npm test -- --run`. Esperado: todas pasan (26 archivos y las nuevas pruebas).
- [ ] **Step 2: Lint, typecheck y build**: `npm run lint && npm run typecheck && npm run build`. Esperado: sin errores.
- [ ] **Step 3: E2E sin escritura**: `npx playwright test tests/e2e --project=chromium` con el servidor de producción local. Esperado: pasan `purchase-flow`, `cart`, `checkout`, `home` y `catalog` (las pruebas que simulan la API). Las pruebas `purchase-flow-real` se omiten sin `REAL_PURCHASE=1`.
- [ ] **Step 4: Capturas después** con el mismo script que Task 0 y `PREFIJO=despues`. Comparar a 390 y 1280 px: no debe haber desbordamiento horizontal ni texto cortado; los botones de compra y el distintivo DEMO deben seguir legibles.
- [ ] **Step 5: Registrar el resultado** en ACCEPTANCE (Task 7). Si algún E2E falla, corregir la causa antes de cerrar la tarea.

---

## Pendientes que quedan fuera (documentados en D-33)

- Modo oscuro global (solo cabecera y pie se mantienen).
- Token `info` propio (sin uso en Ticketera).
- Voz «tú» frente a voseo en el copy.
- Auditoría de contraste con herramienta.
- Obtener el manual de marca oficial (no está en el repositorio).
