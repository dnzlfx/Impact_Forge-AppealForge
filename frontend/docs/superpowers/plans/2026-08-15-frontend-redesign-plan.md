# AppealForge Frontend Redesign & Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the AppealForge frontend into a modern, accessible, high-trust healthcare denial appeal generation platform adhering to the Cashmere design system foundation with modular UI primitives, robust stage-based state management, comprehensive Playwright tests, and zero TypeScript/lint regressions.

**Architecture:** A React 19 + TypeScript + Vite SPA utilizing a stage-driven state machine (`useAppealFlow`), Tailwind CSS v4 design tokens, atomic UI primitives in `src/components/ui/`, responsive layout shell with real-time status badges, and side-by-side review workspace with interactive audit flags and medical code panels.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide/Icon primitives, Playwright, Oxlint.

## Global Constraints

- **Design System Foundation:** Cashmere warm paper palette (`--color-canvas: oklch(0.97 0.01 75)`), pure white elevated surfaces, soft ink text, accessible blue/amber accents, and WCAG AA contrast compliance (>= 4.5:1).
- **Backend API Compatibility:** Preserve contract with `POST /api/v1/appeal/generate-from-files`, `POST /api/v1/appeal/generate`, and `GET /health` (`backend/app/api/v1/appeal.py`).
- **Zero Regression:** All existing functional capabilities (drag & drop PDF upload, real-time simulated progress steps, highlighted audit flags, CPT/ICD-10 code extraction, RAG citations display, and text/PDF export) must continue functioning seamlessly.
- **Verification Standards:** Every phase must pass `npm run build` (`tsc -b && vite build`) and `npm run lint` (`oxlint`).

---

### Task 0: Fase 0 — Exploración y Diagnóstico Inicial

**Files:**
- Read/Inspect: `src/App.tsx`, `src/index.css`, `src/hooks/useAppealFlow.ts`, `src/lib/api.ts`, `src/components/*`

**Interfaces:**
- Consumes: Existing component tree and backend API endpoints
- Produces: Complete inventory of existing symbols, stage transitions, and style refactor targets

- [ ] **Step 1: Run Serena and Explorer analysis on components and hooks**

Use Serena `get_symbols_overview` and Explorer to document all exports and state transitions across `useAppealFlow.ts`, `App.tsx`, `DenialUpload.tsx`, `ProcessingStepper.tsx`, `AppealLetterViewer.tsx`, and `ExtractedCodesPanel.tsx`.

- [ ] **Step 2: Document API contract and fallback behaviour**

Verify input schema for `generateAppealFromFiles` (`denial_file`, `medical_record_file`, `patient_name`, `insurer_name`, `additional_notes`) and output payload structure (`AppealResponse`).

- [ ] **Step 3: Commit Phase 0 documentation check**

```bash
git add docs/superpowers/specs/2026-08-15-frontend-redesign-spec.md
git commit -m "docs: complete phase 0 initial diagnostic and spec"
```

---

### Task 1: Fase 1 — Sistema de Diseño, Tokens y Primitivas UI (`better-design` + `shadcn` + `ui-ux-pro-max`)

**Files:**
- Modify: `src/index.css`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/index.ts`

**Interfaces:**
- Consumes: OKLCH design tokens defined in `src/index.css`
- Produces: Accessible React 19 UI primitives exportable via `src/components/ui`

- [ ] **Step 1: Update design tokens in `src/index.css` with Cashmere palette**

Configure `@theme` with OKLCH variables for canvas, cards, text, accents, borders, and audit status.

- [ ] **Step 2: Implement UI Primitives**

Create atomic, accessible components (`Button`, `Card`, `Input`, `Badge`, `Tabs`, `Dialog`, `Skeleton`, `Alert`) with TypeScript typing and accessible ARIA attributes.

- [ ] **Step 3: Validate UI principles with `better-design`**

Call `better-design:get-ui-principle` and `get-review-rules` to ensure button sizes, font hierarchy, and color contrast meet WCAG AA standards.

- [ ] **Step 4: Verify build and type safety**

Run: `npm run build && npm run lint`
Expected: Build passes with zero errors.

- [ ] **Step 5: Commit Phase 1 UI primitives**

```bash
git add src/index.css src/components/ui/
git commit -m "feat(ui): implement Cashmere design tokens and modular UI primitives"
```

---

### Task 2: Fase 2 — Layout Global y Application Shell

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/StageProgress.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAppealFlow` hook and UI primitives (`Badge`, `Button`, `Card`)
- Produces: Responsive top navigation, stage progression banner, API health check indicator, and unified layout shell

- [ ] **Step 1: Create `Header.tsx` and `StageProgress.tsx`**

Implement top navbar with AppealForge brand typography, live backend health status indicator badge, and clear/reset workflow action.

- [ ] **Step 2: Implement `AppShell.tsx` and integrate into `App.tsx`**

Wrap application contents in a responsive, max-width container with consistent padding, subtle paper texture, and accessible landmark roles (`<header>`, `<main>`, `<footer>`).

- [ ] **Step 3: Verify build and layout rendering**

Run: `npm run build && npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Phase 2 Shell**

```bash
git add src/components/layout/ src/App.tsx
git commit -m "feat(layout): build responsive app shell and stage progress navigation"
```

---

### Task 3: Fase 3 — Refactor de Vistas Core y Formularios

**Files:**
- Modify: `src/components/DenialUpload.tsx`
- Modify: `src/components/ProcessingStepper.tsx`
- Modify: `src/components/AppealLetterViewer.tsx`
- Modify: `src/components/ExtractedCodesPanel.tsx`

**Interfaces:**
- Consumes: `AppealState`, `useAppealFlow` actions, and UI primitives (`Button`, `Card`, `Input`, `Badge`, `Tabs`, `Skeleton`)
- Produces: Enhanced, accessible stage views with polished microcopy, drag-and-drop feedback, animated progress indicators, interactive audit highlights, and structured code/citations tables

- [ ] **Step 1: Refactor `DenialUpload.tsx`**

Migrate upload cards to new `Card` and `Button` primitives, add accessible keyboard navigation to dropzones, enhance file selection badges, and add validation messaging.

- [ ] **Step 2: Refactor `ProcessingStepper.tsx`**

Implement step progress with status icons, elapsed time indicators, and animated loading skeletons matching Cashmere tones.

- [ ] **Step 3: Refactor `AppealLetterViewer.tsx` and `ExtractedCodesPanel.tsx`**

Build tabbed review interface, interactive audit flag list with jump-to-highlight functionality, inline text editing, copy-to-clipboard feedback, and download options.

- [ ] **Step 4: Run Comprehension and Review Rules**

Call `better-design:check-comprehension` and `get-review-rules` on UI copy and button labels across all views.

- [ ] **Step 5: Verify build**

Run: `npm run build && npm run lint`
Expected: 0 errors.

- [ ] **Step 6: Commit Phase 3 views**

```bash
git add src/components/
git commit -m "feat(views): refactor upload, processing, review letter, and code panels"
```

---

### Task 4: Fase 4 — Pre-mortem y Revisión Crítica (`critic`)

**Files:**
- Review: Entire `frontend/src` codebase

**Interfaces:**
- Consumes: Redesigned frontend code and backend API contracts
- Produces: Pre-mortem risk assessment identifying edge cases, mobile responsiveness issues, or API contract drifts

- [ ] **Step 1: Dispatch `critic` subagent for pre-mortem audit**

Audit state edge cases (e.g., backend error handling, large file drops, empty citations, network timeouts, screen reader compatibility).

- [ ] **Step 2: Implement remediations for any flagged critical/medium risks**

Apply fixes directly to components and hooks.

- [ ] **Step 3: Verify build**

Run: `npm run build && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit Phase 4 fixes**

```bash
git add src/
git commit -m "fix(quality): address pre-mortem findings and harden error states"
```

---

### Task 5: Fase 5 — Verificación y QA Visual (`playwright` + `verification-before-completion`)

**Files:**
- Create: `tests/e2e/appeal-flow.spec.ts`
- Create: `playwright.config.ts` (if needed)

**Interfaces:**
- Consumes: Running frontend dev server
- Produces: Automated E2E verification of the full upload, processing, review, and export cycle

- [ ] **Step 1: Create Playwright E2E test suite**

Write comprehensive test covering initial page load, file upload simulation, processing stage transition, appeal letter review, code extraction tabs, and copy-to-clipboard action.

- [ ] **Step 2: Run Playwright test suite and capture snapshots**

Execute Playwright tests and verify successful execution across desktop and mobile viewports.

- [ ] **Step 3: Run final verification commands**

Run `npm run build && npm run lint` to verify clean compilation.

- [ ] **Step 4: Commit Phase 5 test suite and final changes**

```bash
git add tests/ playwright.config.ts
git commit -m "test(e2e): add end-to-end Playwright tests for complete appeal workflow"
```
