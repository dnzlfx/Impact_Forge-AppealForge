/**
 * Real backend contract (FastAPI develop branch).
 * Single source of truth: backend/app/schemas/appeal.py & backend/app/api/v1/appeal.py
 */

export interface AppealCreate {
  denial_letter_text?: string
  medical_record_text?: string
  patient_name?: string | null
  insurer_name?: string | null
  additional_notes?: string
}

export interface RagCitation {
  source: string
  text: string
}

export type AuditIssueType =
  | 'UNVERIFIED_IN_RECORD'
  | 'MISSING_CITATION'
  | 'STALE_DIAGNOSIS'
  | string

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | string

export interface AuditFlag {
  /** Exact text in appeal_text unbacked by clinical record. */
  claim_text: string
  issue_type: AuditIssueType
  severity: AuditSeverity
  explanation: string
}

export interface CodesDetected {
  cpt: string[]
  icd10: string[]
}

export interface AppealResponse {
  appeal_text: string
  codes_detected: CodesDetected
  rag_citations: RagCitation[]
  audit_flags: AuditFlag[]
  generation_logs?: string[]
  status: string
}


export interface ExtractedCode {
  type: 'CPT' | 'ICD-10'
  code: string
  status: 'verified'
}

/** Normalizes detected codes map into flat list for the UI. */
export function normalizeCodes(codes: CodesDetected): ExtractedCode[] {
  const cpt = (codes.cpt ?? []).map((code) => ({
    type: 'CPT' as const,
    code,
    status: 'verified' as const,
  }))
  const icd10 = (codes.icd10 ?? []).map((code) => ({
    type: 'ICD-10' as const,
    code,
    status: 'verified' as const,
  }))
  return [...cpt, ...icd10]
}

export type Stage = 'idle' | 'uploading' | 'processing' | 'review' | 'error'

export type StepperStepState = 'pending' | 'active' | 'done'