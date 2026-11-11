# Home buyer-first Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la portada y navegación en una experiencia buyer-first, con búsqueda y atajos útiles arriba, evento destacado más jerárquico, tarjetas más escaneables y publicación relegada al bloque de organizadores.

**Architecture:** Se conservarán las rutas y componentes existentes, extendiendo el filtrado GET para que `/buscar/` entienda los mismos filtros que el catálogo. El Home compondrá una búsqueda prominente, atajos reutilizables y el carrusel actual; `EventCard` recibirá solo ajustes visuales y de densidad para no duplicar lógica.

**Tech Stack:** Next.js 16 App Router, TypeScript estricto, Tailwind CSS, Supabase queries existentes, Vitest y Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-home-buyer-first-design.md`

## Global Constraints

- El comprador es la prioridad del navbar y del primer pliegue; “Publicar evento” solo queda como CTA inferior para organizadores.
- Mantener las 12 categorías, rutas SEO, checkout, permisos y datos reales del catálogo.
- “Cerca de mí” no solicita geolocalización; apunta explícitamente a San Salvador, la ubicación primaria disponible en el catálogo DEMO.
- “Este fin de semana” debe filtrar el sábado y domingo próximos, no solo mostrar una ventana arbitraria de siete días.
- Mantener accesibilidad: enlaces normales, foco visible, controles de al menos 44 px y sin scroll horizontal a 375 px.
- No inventar disponibilidad, precios, métricas ni promociones.

## Review Focus

- Un atajo se puede abrir sin JavaScript y produce resultados filtrados; test de URL/filtros y E2E de navegación.
- “Este fin de semana” no incluye lunes ni eventos pasados; test de ventana calendario.
- Búsqueda con filtros conserva el texto `q` al aplicar el formulario; test de query string/UI.
- Navbar anónimo y autenticado no muestran “Publicar evento”; test de navegación, mientras el CTA inferior sí existe en Home.
- Cards featured y normales conservan enlaces, foco, precio y fecha sin scroll horizontal; tests unitarios/E2E y revisión visual.

---

### Task 1: Atajos y filtros buyer-first

**Files:**
- Create: `src/components/catalog/discovery-shortcuts.tsx`
- Modify: `src/features/catalog/filters.ts`
- Modify: `src/app/buscar/page.tsx`
- Modify: `src/components/catalog/catalog-filters.tsx`
- Test: `tests/unit/filters.test.ts`
- Test: `tests/unit/discovery-shortcuts.test.ts`

**Interfaces:**
- `discoveryShortcutLinks` expone cuatro enlaces: `fecha=fin-de-semana`, `precio=gratis`, `modalidad=virtual` y `ciudad=san-salvador`.
- `filterCatalogEventsByFilters(events, filters, now)` filtra un catálogo sin requerir un scope SEO.
- `DateFilter` acepta `fin-de-semana` además de `semana` y `mes`.

- [x] Escribir tests RED para el filtro de fin de semana, filtrado general, preservación de `q` y los cuatro destinos.
- [x] Ejecutar los tests focalizados y observar los fallos esperados.
- [x] Implementar ventana sábado-domingo próxima usando la zona horaria de El Salvador y conectar `/buscar/` con `parseCatalogFilters` + `filterCatalogEventsByFilters`.
- [x] Añadir `query` opcional al formulario de filtros para conservar la búsqueda actual.
- [x] Implementar el componente de atajos con enlaces accesibles y texto secundario para San Salvador.
- [x] Ejecutar tests focalizados y confirmar GREEN.

### Task 2: Navbar y composición del Home

**Files:**
- Modify: `src/lib/navigation.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/site-header.tsx` si el ajuste visual lo requiere
- Modify: `tests/unit/navigation.test.ts`
- Modify: `tests/unit/wireframes.test.ts` si sus expectativas de Home cambian

**Interfaces:**
- `accountLinks` y `accountLinksFor` mantienen ingreso, boletos y cuenta, pero ya no incluyen publicación.
- Home importa `SiteSearch` y `DiscoveryShortcuts`; el CTA de publicación queda solo en el bloque inferior.

- [x] Escribir tests RED para navbar sin publicación y Home con atajos/search antes de próximos eventos.
- [x] Ejecutar los tests focalizados y observar los fallos.
- [x] Quitar `publishLink` de la navegación superior sin eliminar la ruta ni el CTA inferior.
- [x] Reorganizar el hero: título de descubrimiento, búsqueda prominente, atajos y carrusel destacado al lado; retirar el botón de publicar del hero.
- [x] Mantener “Próximos eventos” como la sección inmediatamente siguiente al hero.
- [x] Ejecutar tests focalizados y confirmar GREEN.

### Task 3: Jerarquía visual del destacado y densidad de cards

**Files:**
- Modify: `src/components/catalog/event-card.tsx`
- Modify: `src/components/catalog/featured-carousel.tsx` si hace falta el encabezado/label
- Test: `tests/unit/images.test.ts` o test de UI existente, según la superficie afectada
- Test: `tests/e2e/icons.spec.ts` si cambia la aserción de metadata visible

- [x] Añadir una expectativa que preserve título, fecha, precio y enlace del evento al reducir metadata secundaria.
- [x] Ejecutar el test RED si la expectativa refleja el comportamiento actual incompatible.
- [x] Reducir la línea de organizador en cards, reforzar el precio y la separación visual del featured con tokens existentes, y mantener la etiqueta de imagen ilustrativa.
- [x] Ejecutar tests focalizados y revisar el estado de featured/normal.

### Task 4: Verificación, revisión visual y entrega

**Files:**
- Modify: `docs/DECISIONS.md`
- Modify: `docs/README.md`
- Modify: `docs/superpowers/plans/implementation-backlog.md`
- Modify: `.superpowers/sdd/2026-11-11-home-buyer-first-plan/progress.md`

- [x] Ejecutar `npm.cmd exec -- vitest run tests/unit/filters.test.ts tests/unit/discovery-shortcuts.test.ts tests/unit/navigation.test.ts tests/unit/wireframes.test.ts`.
- [x] Ejecutar `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build` y `npm.cmd test -- --run`.
- [x] Ejecutar E2E buyer-first relevante y revisar Home a 1280 px y 375 px; no debe haber scroll horizontal.
- [x] Ejecutar `npx impeccable detect --json` sobre archivos UI modificados y revisar el resultado.
- [x] Hacer revisión independiente, actualizar documentación y ledger, commit y push de la rama que alimenta el PR abierto.
