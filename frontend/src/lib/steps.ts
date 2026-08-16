/** The 4 visual sub-steps of the "processing" state. */
export interface ProcessingStep {
  id: string
  label: string
  description: string
}

export const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: 'reading',
    label: 'Parsing Denial Letter',
    description: 'Extracting denial reasons, clinical findings, and CPT/ICD-10 codes from PDF.',
  },
  {
    id: 'rag',
    label: 'Querying Official Guidelines (RAG)',
    description: 'Retrieving relevant CMS National and Local Coverage Determinations (NCD/LCD).',
  },
  {
    id: 'audit',
    label: 'Auditing with Independent Model',
    description: 'Cross-examining each claim against the original patient medical records.',
  },
  {
    id: 'render',
    label: 'Preparing Interactive Review',
    description: 'Rendering verified appeal letter with highlight flags and clinical citations.',
  },
]