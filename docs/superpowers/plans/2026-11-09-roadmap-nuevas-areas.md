# Roadmap de nuevas áreas — Ticketera C3 (plan maestro)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each phase plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Este archivo es el índice y el tablero.** Cada fase tiene su propio plan; se entrega a un modelo implementador un archivo de fase a la vez.

**Goal:** Cerrar la brecha entre el PDF del proyecto y el sitio: iconos, compra refinada y simulada, cuentas de comprador, destacados por día, paquete empresas, contenido y SEO listo para indexar, check-in y entrega.

**Architecture:** Se extiende el monolito Next.js + Supabase existente. Toda regla de dinero, cupo, rol o vigencia vive en funciones SQL o en el servidor; el navegador solo muestra totales provisionales. Los pagos y envíos son simulados detrás de las mismas interfaces (`PaymentDecision`, tabla `notification_outbox`), así que sustituirlos después no reescribe el flujo.

**Tech Stack:** Next.js 16.4.4 (App Router), React 19.3, TypeScript estricto, Tailwind 4, Supabase (Postgres, Auth, RLS), `lucide-react`, Vitest (unit y PGlite), Playwright.

**Spec:** [docs/analisis/2026-11-09-brechas-y-requerimientos.md](../../analisis/2026-11-09-brechas-y-requerimientos.md) (requerimientos R-01 a R-11, decisiones DP-01 a DP-21, tareas por área).

## Global Constraints

Valen para todas las fases. Cada plan de fase repite el resumen.

- **Next.js distinto al que conoces:** antes de escribir código de rutas, caché, `proxy` o metadatos, leer la guía correspondiente en `node_modules/next/dist/docs/` (AGENTS.md).
- Idioma español; moneda USD guardada en **centavos enteros**; sitio y pagos etiquetados **DEMO**; sin datos de tarjeta.
- Precios, comisiones, cupos, vigencias y roles se validan **en servidor o en SQL**; nunca se confía en el total del navegador.
- RLS habilitado en toda tabla nueva; `service_role` nunca llega al cliente, al repositorio ni a la documentación.
- Migraciones nuevas empiezan **después de `20261106100000`** y cada una lleva pruebas en `tests/db`. **Ninguna migración se aplica a producción sin confirmación explícita del responsable.**
- Tokens de diseño y reglas de `docs/design/DESIGN.md` (D-33: acción violeta `#6548c7`, sin gradientes, sin emojis, iconos con texto, foco visible, áreas táctiles de 44 px, sin scroll horizontal a 375 px).
- No inventar eventos reales, métricas, entrevistas, precios ni afiliaciones. Datos ficticios llevan marca DEMO. Montos pendientes (tarifa diaria, precio del paquete) viven en `site_settings` y, si faltan, la función se muestra como «Tarifa por definir».
- Una rama y un PR por fase. Verificación mínima antes de cerrar una tarea: `npm run lint`, `npm run typecheck`, `npx vitest run <archivo>`; al cerrar la fase: `npm test`, `npm run build` y el E2E de la fase.
- Mensajes de commit en español con prefijo convencional (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Review Focus

Condiciones que el análisis implica y que ninguna tarea aislada ejercita; cada línea tiene su prueba en la tarea indicada.

1. Un doble clic o reintento en checkout no crea dos órdenes ni dos pagos (Fase 2, tarea 2.6).
2. Un organizador no puede destacar un evento ajeno, ni fijar su propio precio o días gratis (Fase 4, tarea 4.2).
3. Un comprador no puede ver boletos ni órdenes de otra cuenta, ni elevar su rol por metadatos de registro (Fase 3, tareas 3.1 y 3.4).
4. Con el interruptor de indexación apagado, ninguna ruta se anuncia en `sitemap.xml` ni sin `noindex` (Fase 5, tarea 5.1).
5. Texto de administrador con `<script>` o enlace `javascript:` nunca llega al HTML como marcado (Fase 5, tarea 5.4).

---

## Fases y orden de ejecución

| Fase | Plan | Contenido | Rama sugerida | Depende de |
|---|---|---|---|---|
| 0 | [Fundamentos y documentación](2026-11-09-fase-0-fundamentos.md) | Decisiones en DECISIONS.md, docs base, correcciones rápidas, Impeccable, privacidad, organizador Copa | `codex/fase-0-fundamentos` | — |
| 1 | [Diseño, iconos, imágenes y wireframes](2026-11-09-fase-1-diseno-iconos.md) | Iconos `lucide-react` en todo componente, imágenes propias y de stock, wireframes | `codex/fase-1-diseno` | 0 |
| 2 | [Compra refinada y post-compra simulada](2026-11-09-fase-2-compra.md) | Ficha con ponentes, checkout en una pantalla, pago simulado completo, outbox, calendario, compartir | `codex/fase-2-compra` | 0, 1 (iconos) |
| 3 | [Cuentas de comprador y alta de organizadores](2026-11-09-fase-3-cuentas.md) | Perfiles, registro, «Mis boletos», precarga, recuperación de contraseña | `codex/fase-3-cuentas` | 2 |
| 4 | [Ingresos: destacados por día y paquete empresas](2026-11-09-fase-4-ingresos.md) | `site_settings`, destacados pagados y manuales, panel admin, bloque por categoría, paquete | `codex/fase-4-ingresos` | 2, 3 |
| 5 | [Contenido, SEO, indexación y analítica](2026-11-09-fase-5-contenido-seo.md) | Interruptor de indexación, metadatos y JSON-LD, editor y blog, página Copa, consentimiento y métricas | `codex/fase-5-contenido-seo` | 4 (`site_settings`) |
| 6 | [Check-in y post-evento](2026-11-09-fase-6-checkin.md) | Check-in con QR, reporte, reporte superior de paquete, encuesta simulada | `codex/fase-6-checkin` | 3, 4 |
| 7 | [Cierre y entrega](2026-11-09-fase-7-cierre.md) | Auditorías, E2E final, UX, marketing, costos, capturas, presentación | `codex/fase-7-cierre` | 1 a 6 |

**Paralelismo seguro:** Fase 0 primero y sola. Después, Fase 1 y Fase 2 pueden avanzar a la vez si no editan los mismos archivos (la Fase 2 solo consume el componente `Icon` de la tarea 1.1; hacer 1.1 antes). Fases 5 y 6 son independientes entre sí. Las tareas de equipo (`Equipo`) corren en paralelo a cualquier fase.

## Decisiones del plan (revisar antes de ejecutar)

Estas decisiones las tomó el plan para poder escribir tareas exactas; el análisis no las fijaba. Cada una indica qué cambia si se rechaza.

| # | Decisión del plan | Si se rechaza |
|---|---|---|
| P-1 | La página de la Copa vive en **`/copa/`** (slug del Excel y del PDF), no en `/organizadores/copa/` como decía CT-06 del análisis | Cambiar la ruta en 0.7 y 5.7. En este punto el plan supera a CT-06 del análisis |
| P-2 | Cuentas de comprador: el token de checkout se **deriva** con HMAC del `request_id` y un secreto de servidor `CHECKOUT_TOKEN_SECRET`, para recuperar QR en «Mis boletos» sin guardar tokens en claro | Mantener tokens aleatorios; «Mis boletos» mostraría órdenes sin QR (solo enlace) |
| P-3 | Analítica propia mínima en Supabase (`analytics_events`), sin proveedor externo | Sustituir `trackEvent` por un proveedor; el consentimiento no cambia |
| P-4 | El interruptor `indexing_enabled` (tabla `site_settings`) **reemplaza** a `NEXT_PUBLIC_IS_DEMO` como control de robots, sitemap y `noindex` (enmienda de D-25). `IS_DEMO` solo controla la etiqueta DEMO | Mantener la variable de entorno; la activación exigiría redeploy |
| P-5 | `event_featured` (D-35) se reemplaza por `featured_placements` (pagados y manuales, con vigencia en fechas) | Mantener ambas tablas; se duplican consultas |
| P-6 | Valores del paquete (días de destacado incluidos, descuento, eventos incluidos) son **supuestos DEMO** configurables en `site_settings`; precio anual y tarifa diaria quedan vacíos hasta que el responsable los fije | Cambiar claves en 4.1 |
| P-7 | Alta de organizadores (CP-09): el administrador crea el organizador y lo vincula por correo desde `/admin/organizadores/` | Autoservicio con aprobación; añadir una tarea a la Fase 3 |
| P-8 | Contenido editorial con un **subconjunto de markdown** propio (títulos, párrafos, listas, negrita, enlaces https), sin HTML crudo ni dependencia nueva | Añadir una librería de markdown con sanitizador |
| P-9 | Impeccable (tarea 0.5): el método de instalación se confirma con el README de `pbakaus/impeccable`; el plan no lo adivina | — |

## Tablero de tareas próximas, por área

Marcar al terminar; registrar evidencia en el plan de la fase. IDs de tarea del análisis entre paréntesis.

### Diseño, iconos e imágenes
- [ ] 0.5 Instalar Impeccable (DI-00) · 0.6 Documentar guías de diseño (DI-01)
- [ ] 1.1 Componente `Icon` y mapa de iconos (DI-02) · 1.2 Migrar SVG a mano (DI-07) · 1.3 Iconos de color por tipo (DI-03) · 1.4 Iconos en todos los componentes (DI-04)
- [ ] 1.5 Imágenes de stock con créditos (IM-01, equipo) · 1.6 Ilustraciones propias (IM-02) · 1.7 Revisión visual (DI-05)

### Wireframes
- [ ] 1.8 Cinco pantallas (WF-01) · 1.9 Flujo móvil (WF-02) · 1.10 Pantallas nuevas (WF-03)
- [ ] 7.5 Capturas «wireframe al sitio» (WF-04) · 7.6 Documento de pantallas (WF-05)

### Compra
- [ ] 2.1 Auditoría del flujo (CO-01) · 2.2 Ponentes y agenda (CO-02, parte de datos) · 2.3 Ficha con caja de compra visible (CO-02) · 2.4 Checkout en una pantalla (CO-03)
- [ ] 2.5 Panel de pago simulado reutilizable (CO-13) · 2.6 Orden idempotente y teléfono (CO-11) · 2.7 Outbox y boleto simulado (CO-04) · 2.8 Recordatorio (CO-07)
- [ ] 2.9 Calendario `.ics` (CO-05) · 2.10 Compartir por WhatsApp (CO-06) · 2.11 Estados de error (CO-08) · 2.12 E2E y documentos (CO-09, CO-10, CO-12)

### Cuentas
- [ ] 3.1 Migración de perfiles (CP-02, CP-07) · 3.2 Auth: registro, recuperación (CP-08) · 3.3 Control de acceso por rol · 3.4 «Mis boletos» y cuenta (CP-03, CP-05)
- [ ] 3.5 Checkout con sesión y reclamo de compras (CP-04) · 3.6 Alta de organizadores (CP-09) · 3.7 Docs (CP-06). Preferencias de correo (CP-05) van dentro de 3.4

### Ingresos
- [ ] 4.1 `site_settings` · 4.2 Destacados: tabla y funciones (BM-02) · 4.3 Panel admin de destacados (BM-08) · 4.4 Flujo del organizador por días (BM-03, BM-06)
- [ ] 4.5 Portada y bloque por categoría (BM-04, BM-09) · 4.6 Paquete empresas: modelo (BM-05) · 4.7 Página y compra del paquete (BM-05) · 4.8 Docs (BM-07)

### Contenido y SEO
- [ ] 5.1 Interruptor de indexación (SEO-15, SEO-02) · 5.2 Metadatos y datos estructurados (SEO-04, SEO-05, SEO-13, SEO-14) · 5.3 Sitemap y robots completos (SEO-03, SEO-12 resto)
- [ ] 5.4 Contenido: modelo y markdown seguro (CT-02) · 5.5 Editor de administrador (CT-03) · 5.6 Blog público y textos por categoría (CT-04, SEO-06) · 5.7 Página Copa (CT-06)
- [ ] 5.8 Enlazado interno y rendimiento (SEO-07, SEO-08) · 5.9 Consentimiento y analítica (LG-02, MK-01, MK-02) · 5.10 Contenido inicial (CT-05, equipo)

### Operación del organizador
- [ ] 6.1 Check-in (CI-01) · 6.2 Reporte (CI-02) · 6.3 Reporte superior del paquete · 6.4 Encuesta simulada (CI-03)

### Documentación, equipo y entrega
- [ ] 0.1 Registrar decisiones (DOC-06) · 0.2 Docs base (DOC-01, DOC-02) · 0.3 Seed sin caracteres rotos (TX-05) · 0.4 `robots` rutas reales (SEO-12) · 0.7 Organizador Copa (TX-03) · 0.8 Privacidad y términos (LG-01, LG-03)
- [ ] 7.1 Auditoría SEO (SEO-09) · 7.2 Verificación de URLs y rendimiento (SEO-08, SEO-10) · 7.3 E2E final (CO-09) · 7.4 Docs finales (DOC-03, DOC-04, DOC-08)
- [ ] 7.7 Investigación UX (UX-01 a UX-05, equipo) · 7.8 Marketing (MK-03, MK-04) · 7.9 Dominio y costos (DM-01 a DM-04, SEO-11) · 7.10 Presentación (DOC-05, IM-03)

## Cómo entregar una fase a un modelo implementador

1. Abrir una rama nueva desde `master` (nombre en la tabla).
2. Pasar al modelo el archivo de la fase, este archivo y el análisis. Indicar: «implementa tarea por tarea, en orden, marcando los pasos».
3. Al cerrar cada tarea: pruebas de la tarea verdes y commit. Al cerrar la fase: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, E2E de la fase y PR.
4. Registrar evidencia en el backlog (`implementation-backlog.md`) y las decisiones nuevas en `docs/DECISIONS.md`.
