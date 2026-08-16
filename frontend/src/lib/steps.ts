/** Los 4 sub-pasos visuales del estado "processing". */
export interface ProcessingStep {
  id: string
  label: string
  description: string
}

export const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: 'reading',
    label: 'Leyendo la denegación',
    description: 'Extrayendo motivo de rechazo y códigos CPT / ICD-10 del PDF.',
  },
  {
    id: 'rag',
    label: 'Consultando guías oficiales (RAG)',
    description: 'Buscando cobertura en guías clínicas de CMS.',
  },
  {
    id: 'audit',
    label: 'Auditando con modelo independiente',
    description: 'Verificando que cada afirmación tenga respaldo real.',
  },
  {
    id: 'render',
    label: 'Preparando visor de revisión',
    description: 'Renderizando la carta con las frases marcadas.',
  },
]