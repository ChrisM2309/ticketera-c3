# Home Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pulir los atajos y el destacado del Home para que sean compactos, claros y visualmente coherentes con la experiencia buyer-first.

**Architecture:** Se ajustarán `DiscoveryShortcuts`, `FeaturedCarousel` y la variante `featured` de `EventCard` sin modificar contratos de datos ni rutas. Los tests de composición y accesibilidad fijarán la jerarquía visual, el contenido prioritario y los límites responsive.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-home-visual-polish-design.md`

## Global Constraints

- Mantener filtros, URLs, datos, consultas y reglas de catálogo.
- No añadir gradientes, autoplay ni nuevas dependencias.
- Mantener controles de al menos 44 px, foco visible y navegación keyboard/touch.
- Mantener la etiqueta «Imagen ilustrativa» cuando la portada sea una ilustración o foto de stock de respaldo.

## Review Focus

- Textos largos de atajos a 375 px: deben conservar altura estable y no desbordar.
- Destacado sin imagen o con imagen ilustrativa: debe mantener fallback y etiqueta.
- Un solo evento destacado: no debe dejar controles vacíos o desalineados.
- Carrusel con varios eventos: controles y puntos deben seguir siendo accesibles.
- Metadata prioritaria: título, fecha/hora, modalidad y precio deben seguir visibles en la variante featured.

### Task 1: Atajos compactos

**Files:**
- Modify: `src/components/catalog/discovery-shortcuts.tsx`
- Test: `tests/unit/discovery-shortcuts.test.ts`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Mantener `discoveryShortcutLinks` con los mismos cuatro `href`, labels y descriptions.
- Mantener `DiscoveryShortcuts()` como componente sin props.

- [x] Escribir un test RED que fije clases/estructura compacta, altura estable y cuatro enlaces.
- [x] Ejecutar el test focalizado y confirmar el fallo.
- [x] Ajustar el markup a una presentación compacta, con altura uniforme y texto secundario limitado visualmente sin ocultarlo para lectores de pantalla.
- [x] Ejecutar tests unitarios y E2E responsive de Home.

### Task 2: Destacado editorial único

**Files:**
- Modify: `src/components/catalog/event-card.tsx`
- Modify: `src/components/catalog/featured-carousel.tsx`
- Modify: `src/components/catalog/featured-controls.tsx` si el posicionamiento lo requiere
- Modify: `src/app/page.tsx` para quitar el marco redundante del carrusel
- Test: `tests/unit/event-card-density.test.ts`
- Test: `tests/unit/featured-controls.test.ts`

**Interfaces:**
- Mantener `EventCard({ event, featured?: boolean })` y `FeaturedCarousel({ events })`.
- Mantener `featuredListId` y las etiquetas ARIA existentes.

- [x] Escribir expectativas RED para una variante featured sin marco exterior redundante, fecha equilibrada y metadata prioritaria.
- [x] Ejecutar los tests y confirmar el fallo esperado.
- [x] Implementar la composición editorial con una sola superficie y controles alineados a la misma pieza visual.
- [x] Ejecutar tests focalizados y comprobar el caso de un solo destacado y de varios.

### Task 3: Verificación y entrega

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/superpowers/plans/implementation-backlog.md`

- [x] Ejecutar tests focalizados y suite relevante.
- [x] Ejecutar lint, typecheck y build.
- [x] Ejecutar E2E a 375 px y 1280 px, sin scroll horizontal.
- [x] Ejecutar `npx impeccable detect --json` sobre las superficies modificadas.
- [x] Revisar diff, actualizar documentación, commit y push al PR abierto.
