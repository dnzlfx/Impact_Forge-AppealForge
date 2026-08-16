/**
 * Contrato del backend real (FastAPI, rama develop).
 * Fuente de verdad: backend/app/schemas/appeal.py y backend/app/api/v1/appeal.py
 *
 * Si backend ajusta el contrato, este es el ÚNICO archivo que debe tocarse
 * (junto con lib/api.ts si cambian rutas o campos de request).
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
  /** Texto exacto dentro de appeal_text que no está respaldado en el expediente. */
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
  status: string
}

export interface ExtractedCode {
  type: 'CPT' | 'ICD-10'
  code: string
  status: 'verified'
}

/** Normalización de codes_detected a la lista plana que consume la UI. */
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