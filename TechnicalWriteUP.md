# Appeal Forge

### Technical Writeup & Architecture

---

### **1. What Problem We Are Solving**

Over 60% of legitimate healthcare insurance denials go unappealed due to administrative friction,
complex medical coding, and aggressive insurer review processes. AppealForge bridges this gap by
transforming insurance denial letters into rigorous, legally sound, and clinically substantiated appeal
packages in seconds.

### 2. The Tech Stack

<aside>
🛠

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, IBM Plex Sans & Mono, Fraunces.
- Backend & Data Pipeline: FastAPI, Pydantic v2, Uvicorn, Python 3.11+, and PyMuPDF.
- Clinical RAG: ChromaDB persistent local vector embeddings with 22+ CMS Coverage
Determinations (NCD/LCD).
- AI / LLM Infrastructure: Hosted via Featherless AI, utilizing a Dual-Model Architecture:
    - Lead Drafter: DeepSeek-V4-Pro (formats authoritative legal appeals).
    - Clinical Auditor: Qwen 2.5 32B (cross-examines facts against raw medical records)
</aside>

### 3. What Was Hard

- **Mitigating Clinical Hallucinations:** We engineered a Dual-Model Architecture where DeepSeek-
V4-Pro drafts the appeal, but Qwen 2.5 32B acts as an adversarial auditor—cross-examining every
extracted symptom and conservative therapy duration against the raw patient records.
- **Deterministic RAG Grounding:** We integrated ChromaDB as a local vector store containing 22+
CMS NCD/LCD guidelines. Ensuring the AI cited authoritative National and Local Coverage
Determinations required meticulous tuning of our FastAPI retrieval pipeline.
- **HIPAA-Conscious Architecture & Privacy:** Handling medical records required a zero remote
storage approach. All document ingestion and RAG searches are performed in-memory or via local
vector storage. No credentials, patient data, or documents are persisted to external databases.
- **Interactive Verification:** We built an interactive React 19 workspace that visualizes unbacked
claims with severity metrics and source-tethered explanations, providing multi-format export
(Markdown/PDF) and a mock fallback for offline resilience