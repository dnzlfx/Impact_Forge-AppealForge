/**
 * Network wrappers for the FastAPI backend.
 *
 * All HTTP calls route through here; components remain agnostic of backend endpoints.
 * Base URL is defined by VITE_API_BASE_URL (see .env.example).
 *
 * Integration strategy:
 * - Real backend requests by default.
 * - If the backend is unavailable (network error or connection refused),
 *   the client gracefully falls back to realistic mock data when MOCK_FALLBACK=true.
 * - Clinical audit is processed inline in the /generate-from-files response.
 */

import type { AppealResponse } from './types'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

const MOCK_FALLBACK =
  ((import.meta.env.VITE_MOCK_FALLBACK as string | undefined) ?? 'true') === 'true'



class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init)
  } catch {
    throw new ApiError('Unable to connect to the backend server', 0)
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      /* non-JSON response body */
    }
    throw new ApiError(detail, res.status)
  }
  return (await res.json()) as T
}

/** GET /health — checks backend availability */
export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health')
}

/** POST /api/v1/appeal/generate-from-files — uploads denial letter PDF (and optional medical records) */
export interface AppealResult {
  data: AppealResponse
  isMock: boolean
}

export async function generateAppeal(input: {
  denialFile: File
  medicalRecordFile?: File | null
  patientName?: string | null
  insurerName?: string | null
  additionalNotes?: string
}): Promise<AppealResult> {
  const form = new FormData()
  form.append('denial_file', input.denialFile)
  if (input.medicalRecordFile) form.append('medical_record_file', input.medicalRecordFile)
  if (input.patientName) form.append('patient_name', input.patientName)
  if (input.insurerName) form.append('insurer_name', input.insurerName)
  if (input.additionalNotes) form.append('additional_notes', input.additionalNotes)

  try {
    const data = await request<AppealResponse>('/api/v1/appeal/generate-from-files', {
      method: 'POST',
      body: form,
    })
    return { data, isMock: false }
  } catch (err) {
    if (err instanceof ApiError && MOCK_FALLBACK) {
      await delay(1800)
      return { data: buildMockResponse(input), isMock: true }
    }
    throw err
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildMockResponse(input: {
  denialFile: File
  medicalRecordFile?: File | null
  patientName?: string | null
  insurerName?: string | null
}): AppealResponse {
  const patient = input.patientName || 'Jane Doe'
  const insurer = input.insurerName || 'Aetna Health Management'
  const withRecord = Boolean(input.medicalRecordFile)

  return {
    status: 'completed',
    codes_detected: {
      cpt: ['70551', '72148'],
      icd10: ['M54.5', 'G43.909'],
    },
    rag_citations: [
      {
        source: 'CMS NCD 220.4',
        text: 'Coverage of lumbar MRI is indicated when documented radiculopathy persists after at least 6 weeks of supervised conservative therapy.',
      },
      {
        source: 'CMS LCD L34212',
        text: 'Clinical documentation establishing medical necessity and objective neurological deficits must be substantiated in the patient medical record.',
      },
    ],
    appeal_text: `Attn: Appeals and Grievances Department
${insurer}

RE: Formal Appeal of Medical Coverage Denial
Patient: ${patient}
Procedure: Lumbar Spine MRI (CPT: 72148 / 70551)
Diagnosis: Low Back Pain with Left Lumbar Radiculopathy (ICD-10: M54.5, G43.909)

Dear Appeals Committee,

This letter serves as a formal expedited appeal regarding the recent denial of coverage for the physician-ordered Lumbar Spine MRI for ${patient}.

The requested diagnostic imaging was prescribed by the attending physician due to persistent, documented left lumbar radiculopathy with progressive lower extremity paresthesia, which has failed to resolve following six weeks of supervised physical therapy and conservative multimodal management. The attached clinical chart contains full physical examination findings, neurological motor/sensory assessments, and pain scoring meeting all criteria established under CMS National Coverage Determination (NCD 220.4) and Local Coverage Determination (LCD L34212).

The requested procedure (CPT 72148) directly corresponds to the documented ICD-10 diagnostic coding (M54.5). ${withRecord ? 'The accompanying medical record contains all progress notes, physical therapy logs, and clinical assessments supporting this claim.' : 'Supporting medical documentation is available upon request.'}

We respectfully request immediate reconsideration and overturn of this denial. Failure to approve may warrant submission for independent external medical review pursuant to federal guidelines.`,
    audit_flags: withRecord
      ? []
      : [
          {
            claim_text: 'which has failed to resolve following six weeks of supervised physical therapy',
            issue_type: 'UNVERIFIED_IN_RECORD',
            severity: 'MEDIUM',
            explanation:
              'No physical therapy logs were uploaded in the medical record to substantiate the 6-week duration claim. Attach physical therapy records or cite physician notes.',
          },
        ],
    generation_logs: [
      `[Pipeline] Received denial document "${input.denialFile.name}" (${input.denialFile.size} bytes)`,
      `[Extraction] Extracted clinical procedure codes CPT: 70551, 72148 | ICD-10: M54.5, G43.909`,
      `[RAG Engine] Queried CMS National Coverage Determinations (NCD 220.4, LCD L34212)`,
      `[AI Writer] Generated formal appeal letter draft adhering to CMS medical necessity criteria`,
      `[AI Auditor] Cross-examined draft against clinical record (${withRecord ? 'Verified with patient record' : '1 discrepancy flagged: unverified therapy timeline'})`,
      `[Pipeline] Synthesis complete and ready for payer submission`,
    ],
  }
}


export { ApiError, API_BASE_URL }