# Account Panel Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add role-appropriate panel links to Mi cuenta and make the existing organizer event list clearer and more compact.

**Architecture:** Use the server-verified role from `requireRole` in the account page to render allowed destinations. Keep the existing organizer list and actions, improving only spacing, icon affordances and accessible labels.

**Tech Stack:** Next.js App Router, TypeScript, React, existing `Icon`, Tailwind and Vitest/Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-account-panel-access-design.md`.

## Global Constraints

- Role comes only from server-verified `requireRole`, never browser input.
- `buyer` sees `/mis-boletos/`; `organizer` sees `/panel/`; `admin` sees `/admin/` and `/panel/`.
- Keep the current grouped list, event rows, routes and business behavior; do not convert to a table.
- Icons must have visible text or an accessible name; preserve responsive usability.

## Review Focus

- Buyer role must not receive organizer/admin navigation (account page unit/E2E test).
- Admin is allowed into both panels by role hierarchy (account navigation test).
- Narrow viewport must retain readable rows and usable actions (panel E2E/layout check).

---

### Task 1: Role-based links in Mi cuenta

**Files:**
- Modify: `src/app/cuenta/page.tsx`
- Test: `tests/e2e/account.spec.ts` and/or focused unit tests for a pure role-link helper if needed.

**Interfaces:** Consumes `SignedInAccount.role` (`buyer | organizer | admin`) returned by `requireRole`; routes use existing constants from `src/lib/auth/access.ts`.

- [ ] Add assertions for buyer, organizer and admin destinations; run the focused test and confirm the role-link behavior is covered.
- [ ] Render role-specific links using existing `Icon` and `buttonVariants`; buyer retains «Mis boletos», organizer gets «Panel del organizador», admin gets both «Panel de administración» and «Panel del organizador».
- [ ] Run focused tests: `npx vitest run tests/unit/auth-access.test.ts` and `npm run test:e2e -- tests/e2e/account.spec.ts`; expect all relevant tests to pass.

### Task 2: Compact organizer event rows

**Files:**
- Modify: `src/app/panel/page.tsx`
- Test: `tests/e2e/account.spec.ts` or a new focused panel E2E only if existing coverage cannot check accessible action labels.

**Interfaces:** Reuse current `Icon`, `IconName`, `buttonVariants`, `ArchiveEventForm`, links and row data. Do not change the page query or action routes.

- [ ] Add or update assertions that event rows still show status/date/count and expose Editar, Archivar, Check-in, Reporte and Destacar only under their current conditions.
- [ ] Reduce excess row padding/gaps; align event metadata and compact actions; add the existing corresponding icons while preserving visible action text and accessible names. Keep responsive wrapping on mobile.
- [ ] Run focused panel E2E and inspect at desktop and narrow viewport; expect no horizontal overflow and every action usable.

### Task 3: Verification and PR

**Files:**
- Modify: `docs/superpowers/plans/implementation-backlog.md` only if it has an applicable entry; otherwise no backlog change.

- [ ] Run `npm run lint`, `npm run typecheck`, relevant unit/E2E tests, `npm run build`, and `git diff --check`; record exact outcomes.
- [ ] Commit on `feat/account-panel-entry-points`, push, and open a PR targeting `master` with a concise description and validation results.
