# AppealForge

> **AI-Powered Clinical Appeals System** that automatically reverses health insurance medical denials through RAG-augmented clinical guideline retrieval, verified medical drafting, and independent LLM fact-checking audit.

---

## Overview

Over **60% of legitimate healthcare insurance denials** go unappealed due to administrative friction, complex medical coding, and aggressive insurer review processes. **AppealForge** bridges this gap by transforming insurance denial letters into rigorous, legally sound, and clinically substantiated appeal packages in seconds.

### Key Capabilities

1. **Intelligent Document Ingestion**: Parses denial letters and clinical records from PDF format, automatically extracting rejection rationale and clinical codes (CPT, ICD-10).
2. **RAG-Augmented Coverage Grounding**: Retrieves authoritative National and Local Coverage Determinations (**CMS NCD / LCD**) to substantiate medical necessity.
3. **Dual-Model Architecture (Drafting + Clinical Audit)**:
   - **Lead Drafter (`DeepSeek-V4-Flash`)**: Formats an authoritative legal appeal tailored to insurer standards.
   - **Clinical Auditor (`Qwen3.8-27B`)**: Cross-examines every fact, conservative therapy duration, and symptom in the draft against the raw patient medical records to prevent hallucinations.
4. **Interactive Flagging & Verification**: Visualizes unbacked claims directly in the UI with severity metrics and source-tethered explanations.
5. **Multi-Format Export**: Generates submission-ready Markdown and PDF appeal letters.

---

## Architecture & System Flow

```
[ FRONTEND (React 19 + TypeScript + Tailwind) ]
      |
      | 1. Upload Denial PDF & Patient Medical Record
      v
[ FASTAPI BACKEND API ]
      |
      +---> 2. PDF Parsing & Medical Code Extraction (CPT / ICD-10)
      |
      +---> 3. RAG Engine: CMS Coverage Guidelines Retrieval (NCD/LCD)
      |
      +---> 4. Appeal Drafter LLM (Structured Legal-Medical Appeal)
      |
      +---> 5. Independent Clinical Auditor LLM (Cross-Examination)
      |
      v
[ JSON Appeal Response with Audit Flags & Citations ]
      |
      v
[ INTERACTIVE REVIEW VIEWER & EXPORT ]
```

---

## Quickstart Guide

### Option A: Run with Docker Compose (Recommended)

The easiest way to run the entire system (Frontend + Backend + RAG Engine) is using Docker Compose:

```bash
docker compose up -d --build
```

- **Web App**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8000/docs`

> **Note on Initial Setup & API Key Security**:
> When opening the web app for the first time, an interactive configuration modal will prompt for your **Featherless API Key**. 
> - **Privacy & Local Storage**: Your API key is stored strictly on your local machine (`.env` volume). It is **never** uploaded to any external database, cloud telemetry, or third-party service.
> - **No Manual File Edits**: You do not need to create or edit `.env` files manually via terminal or code editor.

To stop the containers:
```bash
docker compose down
```

---

### Option B: Run Locally (Without Docker)

#### Prerequisites
- **Python 3.11+**
- **Node.js 18+** / npm
- **Featherless AI API Key**

#### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger UI): `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

#### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Launch Vite development server
npm run dev
```

- Web Interface: `http://localhost:5173`

---

## Security & Data Privacy

- **Local-First Configuration**: All API keys and environment variables reside exclusively in your local environment.
- **Zero Remote Storage**: No credentials, patient data, or documents are persisted to external databases.
- **HIPAA-Conscious Architecture**: Ingestion and RAG search are performed in memory and local vector storage.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, IBM Plex Sans & Mono, Fraunces |
| **Backend** | FastAPI, Pydantic v2, Uvicorn, Python 3.11+ |
| **AI / LLMs** | DeepSeek-V4-Flash (Drafter), Qwen 3.8 27B (Auditor), Featherless AI |
| **Clinical RAG** | Vector embeddings, CMS Coverage Determinations (NCD/LCD) |
| **Document Processing** | PyMuPDF / pdfplumber, Pandoc, ReportLab |

---

## Team & Hackathon

Built with pride for **Impact Forge Hackathon 2026**.
