# T01 — Inicializar proyecto Next.js — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Montar la base ejecutable de Ticketera C3 sobre la carpeta documental existente, sin sobrescribir la documentación aprobada.

**Architecture:** Se usará Next.js con App Router y Server Components como base, TypeScript estricto, Tailwind CSS y la configuración inicial de shadcn/ui. El código vivirá en `src/`; las carpetas de dominio quedarán preparadas para las tareas posteriores. Vitest cubrirá la prueba unitaria mínima de configuración y Playwright quedará configurado para las pruebas E2E futuras.

**Tech Stack:** Next.js (versión estable disponible vía `create-next-app@latest`), React, TypeScript, Tailwind CSS, shadcn/ui, ESLint, Vitest y Playwright.

**Spec:** `docs/superpowers/specs/2026-11-02-ticketera-design.md`, `docs/superpowers/plans/implementation-backlog.md` y `AGENTS.md`.

## Global Constraints

- Mantener la documentación existente en la raíz; no reemplazar `README.md`, `AGENTS.md` ni `docs/`.
- Usar Next.js App Router, TypeScript estricto, Tailwind CSS y shadcn/ui.
- Mantener la estructura esperada bajo `src/app/`, `src/components/`, `src/features/`, `src/lib/`, `supabase/` y `tests/`.
- No agregar secretos; solo incluir nombres de variables en `.env.example`.
- La interfaz y la documentación funcional del proyecto están en español; el sitio debe estar marcado como `DEMO / Proyecto académico`.
- T01 no implementa catálogo, Supabase, checkout, pagos ni datos demo; deja sus límites preparados para T02 y T03.

## Review Focus

- La inicialización en una carpeta no vacía debe conservar todos los documentos existentes y no generar un README de Next.js que los sustituya; se comprueba con una lista de archivos y `git diff`.
- El script `typecheck` debe ejecutar TypeScript estricto sin depender de un archivo `tsconfig` incompleto; se comprueba con `npm run typecheck`.
- El script `test` debe ejecutar una prueba real sobre configuración del proyecto y no una orden vacía; se comprueba con Vitest.
- El script `test:e2e` debe tener configuración reproducible para el App Router; se comprueba con `playwright test --list` y una prueba smoke ejecutable cuando el servidor esté disponible.
- Los valores públicos del sitio deben tener un origen único y no incluir secretos; se comprueba en la prueba de configuración y en `.env.example`.

## Task 1: Scaffold, tooling and project structure

**Files:**

- Create: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `playwright.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/lib/site-config.ts`, `tests/unit/site-config.test.ts`, `tests/e2e/home.spec.ts`
- Create: `.env.example`, `.gitignore`
- Create: `.gitkeep` files under `src/components/`, `src/features/*/`, `src/lib/supabase/`, `src/lib/seo/`, `supabase/migrations/` where the generated scaffold cannot represent empty directories
- Modify: `docs/superpowers/plans/implementation-backlog.md` to mark T01 complete with evidence

**Interfaces:**

- Consumes: existing documents and the exact root layout described by `AGENTS.md`.
- Produces: an npm project with scripts `dev`, `build`, `lint`, `typecheck`, `test`, and `test:e2e`; a working `/` route; `siteConfig` exported from `src/lib/site-config.ts`; and directories ready for later tasks.

- [ ] **Step 1: Define the test contract first**

  Add `tests/unit/site-config.test.ts` with assertions that the configuration exposes the academic/demo label, USD currency, and the expected twelve category slugs in documented order.

- [ ] **Step 2: Run the focused test and confirm the expected RED failure**

  Run: `npm test -- --run tests/unit/site-config.test.ts`

  Expected: the command fails because `src/lib/site-config.ts` and the npm project/test runner do not exist yet.

- [ ] **Step 3: Generate the Next.js base in the current root**

  Use the official generator with App Router, TypeScript, Tailwind, ESLint, `src/`, npm and the `@/*` alias. Preserve existing root documentation and inspect any generated conflict before accepting it.

- [ ] **Step 4: Add shadcn/ui and project configuration**

  Initialize shadcn/ui with the generated Tailwind setup and add the minimal `siteConfig` module. Configure Vitest through the scoped npm script and Playwright through its config without adding product behavior beyond the home smoke route.

- [ ] **Step 5: Add the required structure and environment contract**

  Create the expected feature/library/Supabase/test directories, `.env.example` with public Supabase URL/key placeholders and demo commission placeholder names only, and ensure `.gitignore` excludes secrets, build output, test artifacts, and local environment files.

- [ ] **Step 6: Add the home route and smoke test**

  Keep the generated home route intentionally minimal but render the Spanish academic/demo identity and a heading that can be verified by Playwright. The E2E test must target `/` and assert the page title/heading without depending on Supabase.

- [ ] **Step 7: Run the RED-to-GREEN verification cycle**

  Run, in order:

  - `npm test -- --run tests/unit/site-config.test.ts` — expected PASS.
  - `npm run lint` — expected exit code 0.
  - `npm run typecheck` — expected exit code 0.
  - `npm run build` — expected exit code 0.
  - `npm run test:e2e -- --list` — expected to list the smoke test.

- [ ] **Step 8: Update the backlog with evidence**

  Change only T01 from `Pendiente` to `Terminado` and add the executed commands/results to the execution table. Leave all later tasks unchanged.

- [ ] **Step 9: Initialize Git and create the first local commit**

  After verification, initialize Git in the project root if it is still absent, inspect the staged file list to confirm no secrets or unrelated generated files are included, and commit T01 with message `feat: initialize Ticketera Next.js project`.

