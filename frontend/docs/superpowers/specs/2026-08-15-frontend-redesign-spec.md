# AppealForge Frontend Design Specification

## Overview & Goals
AppealForge is an AI-powered healthcare denial appeal generation platform. The redesign establishes a warm, accessible, high-trust user interface inspired by the **Cashmere** design system foundation, featuring modular UI primitives (`shadcn`/Tailwind CSS v4) and robust stage-driven state management.

## Visual Design & Design Tokens
- **Theme Philosophy:** Warm paper aesthetic, lifted white surface cards, soft ink text, and high-contrast accessible accents for status and flags.
- **Palette (OKLCH Tokens):**
  - Surface/Canvas: Warm cream paper background (`oklch(0.97 0.01 75)`)
  - Elevated Card: Pure white with soft diffused shadows (`oklch(1 0 0)`)
  - Primary Action / Text: Deep ink (`oklch(0.20 0.02 260)`)
  - Accent / Highlights: Friendly blue (`oklch(0.55 0.16 250)`) & warm amber/orange (`oklch(0.68 0.18 55)`)
  - Audit & Alert Flags: Red flag warning background and borders with WCAG AA compliance (>= 4.5:1 text contrast)
- **Typography:**
  - Display/Headings: `Fraunces` / High-legibility serif or medium geometric sans
  - Body/Interface: `IBM Plex Sans` / Clean sans-serif
  - Metadata & Medical Codes: `IBM Plex Mono`

## Component Architecture & UI Primitives
Modular UI primitives located in `src/components/ui/`:
- `Button`: Primary, secondary, outline, ghost, destructive variants with loading spinners.
- `Card`: Header, Title, Description, Content, Footer with subtle border and squircle radii.
- `Input` & `Textarea`: Accessible form inputs with label associations and focus rings.
- `Badge`: Status badges for stages, extraction confidence, and audit severity.
- `Dialog` / `Modal`: Accessible overlays for settings, confirmation, and raw payload review.
- `Tabs`: Accessible tab navigation for switching between Appeal Letter, CPT/ICD-10 codes, and RAG citations.
- `Skeleton`: Content placeholders during generation and file uploads.
- `Toast` / `Alert`: Accessible announcements and error banners.

## Layout & View Flow
1. **Application Shell:**
   - Top Navigation: Logo, product title, live API connection status indicator, theme toggle / clear session action.
   - Stage Stepper: Step indicator showing current progression (`Upload` -> `Processing` -> `Review & Audit`).
2. **Stage Views:**
   - **Upload Stage (`DenialUpload.tsx`):** Drag-and-drop file inputs for denial PDF and optional clinical records, metadata inputs (patient, insurer, notes), validation indicators.
   - **Processing Stage (`ProcessingStepper.tsx`):** Stepwise animated progress indicator displaying extraction, citations retrieval, and letter synthesis status.
   - **Review Stage (`AppealLetterViewer.tsx` & `ExtractedCodesPanel.tsx`):**
     - Side-by-side or tabbed workspace.
     - Interactive appeal letter viewer with highlighted audit flags, editable letter body, copy to clipboard, and PDF/text export.
     - Structured codes panel grouping CPT and ICD-10 items with descriptions and supporting RAG citations.
   - **Error Boundary / Empty States:** Contextual fallback messaging with recovery actions.

## Verification & QA
- **Accessibility:** WCAG 2.1 AA compliance across all components, visible keyboard focus indicators, explicit ARIA labels.
- **Visual Regression & E2E Testing:** Playwright tests validating the full upload, processing, and review flow.
- **Type Safety & Build:** Zero TypeScript errors with `tsc -b` and clean linting via `oxlint`.
