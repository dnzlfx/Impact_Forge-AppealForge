import { useReducer } from 'react'
import type { AppealResponse, Stage } from '../lib/types'
import { generateAppeal } from '../lib/api'

/** Entrada que el usuario puede aportar además del PDF de denegación. */
export interface AppealInput {
  denialFile: File
  medicalRecordFile?: File | null
  patientName?: string | null
  insurerName?: string | null
  additionalNotes?: string
}

export interface FlowState {
  stage: Stage
  /** Índice del paso activo del stepper (0-based) durante "processing". */
  activeStep: number
  error: string | null
  result: AppealResponse | null
  /** true cuando el resultado viene del fallback mock (backend no disponible). */
  isMock: boolean
}

type FlowAction =
  | { type: 'SELECT_FILE' }
  | { type: 'GENERATE_START' }
  | { type: 'STEP_ADVANCE'; next: number }
  | { type: 'SUCCESS'; result: AppealResponse; isMock: boolean }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const initialState: FlowState = {
  stage: 'idle',
  activeStep: 0,
  error: null,
  result: null,
  isMock: false,
}

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SELECT_FILE':
      return { ...state, stage: 'uploading', error: null }
    case 'GENERATE_START':
      return { ...state, stage: 'processing', activeStep: 0, error: null, result: null }
    case 'STEP_ADVANCE':
      return { ...state, activeStep: action.next }
    case 'SUCCESS':
      return { ...state, stage: 'review', activeStep: 3, result: action.result, isMock: action.isMock }
    case 'ERROR':
      return { ...state, stage: 'error', error: action.message }
    case 'RESET':
      return initialState
    default:
      return state
  }
}


/**
 * Orquesta el flujo de la apelación como una máquina de estados simple.
 *
 * idle → uploading → processing → review | error → (RESET) → idle
 *
 * Los 4 sub-pasos del stepper se animan en orden en paralelo a la/s llamada/s
 * reales. Mientras no exista un endpoint separado de auditoría, los pasos
 * avanzan por tiempo; el paso "audit" se completa cuando llega la respuesta
 * con audit_flags (la auditoría es inline en /generate-from-files).
 */
export function useAppealFlow() {
  const [state, dispatch] = useReducer(flowReducer, initialState)

  const selectFile = () => dispatch({ type: 'SELECT_FILE' })

  const start = async (input: AppealInput) => {
    dispatch({ type: 'GENERATE_START' })
    let timer: ReturnType<typeof setInterval> | undefined

    try {
      const resultPromise = generateAppeal(input)

      let currentStep = 0
      timer = setInterval(() => {
        if (currentStep < 2) {
          currentStep += 1
          dispatch({ type: 'STEP_ADVANCE', next: currentStep })
        }
      }, 700)

      const result = await resultPromise
      if (timer) clearInterval(timer)

      dispatch({ type: 'STEP_ADVANCE', next: 3 })
      dispatch({ type: 'SUCCESS', result: result.data, isMock: result.isMock })
    } catch (err) {
      if (timer) clearInterval(timer)
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred during processing',
      })
    }
  }



  const reset = () => dispatch({ type: 'RESET' })

  return { state, selectFile, start, reset }
}