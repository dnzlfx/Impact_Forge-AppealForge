# AppealForge — Frontend Client

Web client for **AppealForge**: upload an insurance denial letter PDF (and optional clinical chart), receive an automated, evidence-backed appeal letter grounded in official CMS guidelines, and audit every claim with an independent fact-checking model.

---

## Features

- **Single-page state machine flow**: `idle → uploading → processing → review | error → (reset) → idle`
- **Synchronized processing stepper**: Real-time visualization of parsing, RAG retrieval, clinical auditing, and final rendering.
- **Interactive claim review**: Highlights unverified claims with accessible hover and focus tooltips.
- **CPT & ICD-10 Code extraction panel**: Displays detected codes alongside coverage guideline references.
- **Graceful mock fallback**: Seamless demo experience even when the backend is offline.

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested with Node 24)
- Backend running at `http://localhost:8000` (optional for local mock demo)

### Installation & Run

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Available Scripts

- `npm run dev`: Starts local Vite development server.
- `npm run build`: Type-checks with `tsc` and bundles production assets.
- `npm run lint`: Fast linting with `oxlint`.
- `npm run preview`: Previews the production build locally.

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AppealLetterViewer.tsx   # Appeal text renderer with flagged audit claims
│   │   ├── DenialUpload.tsx         # Drag & drop PDF upload zone + clinical chart
│   │   ├── ExtractedCodesPanel.tsx  # CPT / ICD-10 codes list and status
│   │   ├── ProcessingStepper.tsx    # Multi-step animated progress stepper
│   │   └── Skeleton.tsx             # Loading placeholders
│   ├── hooks/
│   │   └── useAppealFlow.ts         # Flow state machine (useReducer)
│   ├── lib/
│   │   ├── api.ts                   # Fetch API wrappers + mock fallback data
│   │   ├── highlight.ts             # Exact claim text highlighting logic
│   │   ├── steps.ts                 # Processing steps definitions
│   │   └── types.ts                 # Backend data contract types
│   ├── App.tsx                      # Main container & stage views
│   ├── main.tsx                     # React root mount
│   └── index.css                    # Tailwind CSS v4 design tokens
├── package.json
└── vite.config.ts
```
