/**
 * Wrappers de red hacia el backend FastAPI.
 *
 * Toda llamada HTTP pasa por aquí; ningún componente conoce la URL del backend.
 * La URL base sale de VITE_API_BASE_URL (ver .env.example).
 *
 * Estrategia de integración:
 * - Por defecto hablamos con el backend real.
 * - Si el backend no está disponible (se cae el fetch o responde con error de
 *   red), el cliente cae a datos mockeados con MOCK_FALLBACK=true. Esto deja el
 *   flujo de UI usable durante el hackathon sin esperar a que el backend
 *   publique todos los endpoints.
 * - La auditoría es INLINE en la respuesta de /generate-from-files (no hay
 *   endpoint /audit separado todavía). Si backend lo separa después, solo hay
 *   que añadir generateAppealAudit() aquí y llamarlo en useAppealFlow.
 */

import type { AppealResponse } from './types'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

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
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      /* cuerpo no JSON: ignorar */
    }
    throw new ApiError(detail, res.status)
  }
  return (await res.json()) as T
}

/** GET /health — útil para mostrar "backend no disponible" en vez de un error genérico. */
export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health')
}

/** POST /api/v1/appeal/generate-from-files — sube el PDF de denegación (y, opcionalmente, el expediente). */
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
  const patient = input.patientName || 'Paciente Reservado'
  const insurer = input.insurerName || '[Nombre de la aseguradora]'
  const withRecord = Boolean(input.medicalRecordFile)

  return {
    status: 'completed',
    codes_detected: {
      cpt: ['70551', '72148'],
      icd10: ['M54.5', 'G43.909'],
    },
    rag_citations: [
      {
        source: 'CMS Med NCD',
        text: 'Cobertura de resonancia lumbar cuando hay radiculopatía documentada y fallo del tratamiento conservador por al menos 6 semanas.',
      },
      {
        source: 'CMS LCD',
        text: 'La información que respalda la necesidad médica debe constar en el expediente del paciente.',
      },
    ],
    appeal_text: `Estimado departamento de apelaciones de ${insurer}:

La denegación de fecha reciente sobre la resonancia magnética lumbar solicitada para ${patient} es objeto de esta apelación formal.

El estudio fue ordenado por el médico tratante ante la presencia de radiculopatía lumbar izquierda persistente documentada, sin mejoría después de seis semanas de manejo conservador supervisado. El expediente clínico incluye la exploración neurológica y la escala de dolor que sustentan la solicitud, conforme a la guía de cobertura vigente de CMS que ampara estudios de imagen cuando consta evidencia de radiculopatía y fracaso del tratamiento conservador.

Las solicitudes fueron incorrectamente codificadas en la denegación original: el procedimiento solicitado es 70551 y el diagnóstico de base es M54.5. Ambas codificaciones concuerdan con la documentación del expediente. ${withRecord ? 'El expediente médico adjunto contiene todas las notas de consulta y estudios previos mencionados.' : 'Se adjunta la documentación de soporte para su revisión.'}

Solicito la reconsideración de esta denegación bajo los lineamientos de, siendo consistente con las guías clínicas citadas anteriormente.`,
    audit_flags: withRecord
      ? []
      : [
          {
            claim_text: 'siendo consistente con las guías clínicas citadas anteriormente',
            issue_type: 'UNVERIFIED_IN_RECORD',
            severity: 'MEDIUM',
            explanation:
              'Esta afirmación no tiene una cita textual verificable en el expediente. Reemplázala por la referencia concreta de la guía (CMS) con sección y fecha.',
          },
        ],
  }
}

export { ApiError, API_BASE_URL }