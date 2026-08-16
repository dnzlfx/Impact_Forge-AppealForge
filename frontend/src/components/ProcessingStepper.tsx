import type { ProcessingStep } from '../lib/steps'
import type { StepperStepState } from '../lib/types'
import Skeleton from './Skeleton'

interface ProcessingStepperProps {
  steps: ProcessingStep[]
  /** Índice 0-based del paso que se está ejecutando. */
  activeStep: number
}

function stepState(index: number, activeStep: number): StepperStepState {
  if (index < activeStep) return 'done'
  if (index === activeStep) return 'active'
  return 'pending'
}

const STATE_ICON: Record<StepperStepState, string> = {
  done: 'border-deep bg-deep text-white',
  active: 'border-accent bg-accent text-white',
  pending: 'border-lilac bg-white text-mid',
}

/**
 * Visualiza los 4 sub-pasos del procesamiento. NO hace llamadas de red:
 * toda la lógica la inyecta el padre vía props (index del paso activo).
 */
export default function ProcessingStepper({
  steps,
  activeStep,
}: ProcessingStepperProps) {
  const progress = Math.min(100, Math.round(((activeStep + 1) / steps.length) * 100))

  return (
    <section aria-labelledby="processing-heading" className="flex flex-col gap-6">
      <header>
        <h2 id="processing-heading" className="font-display text-2xl font-medium text-deep">
          Generando tu apelación
        </h2>
        <p className="mt-1 text-sm text-mid">
          Procesamiento automático — no se requiere ninguna acción de tu parte.
        </p>
      </header>

      <ol className="relative flex flex-col gap-0" aria-live="polite">
        {steps.map((step, index) => {
          const state = stepState(index, activeStep)
          return (
            <li
              key={step.id}
              className={`relative flex gap-4 pb-8 last:pb-0 ${index < steps.length - 1 ? 'last:after:bottom-2' : ''}`}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${
                    state === 'done' ? 'bg-deep' : 'bg-lilac'
                  }`}
                />
              )}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-medium transition-colors ${STATE_ICON[state]} ${
                  state === 'active' ? 'animate-pulse' : ''
                }`}
              >
                {state === 'done' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <div className="flex flex-col gap-1 pt-0.5">
                <p
                  className={`text-sm font-semibold ${
                    state === 'active' ? 'text-accent' : state === 'done' ? 'text-deep' : 'text-mid'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-mid">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-col gap-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-sky"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progreso del procesamiento"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="font-mono text-xs text-mid">
          Paso {activeStep + 1} de {steps.length} · Procesando…
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-[3px] border border-lilac bg-white p-5 sm:p-8" aria-hidden="true">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </section>
  )
}