import type { ProcessingStep } from '../lib/steps'
import type { StepperStepState } from '../lib/types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Skeleton,
} from './ui'

interface ProcessingStepperProps {
  steps: ProcessingStep[]
  /** 0-based index of the active executing step. */
  activeStep: number
}

function stepState(index: number, activeStep: number): StepperStepState {
  if (index < activeStep) return 'done'
  if (index === activeStep) return 'active'
  return 'pending'
}

export default function ProcessingStepper({
  steps,
  activeStep,
}: ProcessingStepperProps) {
  const currentStep = steps[activeStep] || steps[steps.length - 1]
  const progress = Math.min(100, Math.round(((activeStep + 1) / steps.length) * 100))

  return (
    <div className="flex flex-col gap-6" aria-live="polite" aria-busy="true">
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>Synthesizing Appeal Dossier</CardTitle>
            <Badge variant="accent">Automated Generation</Badge>
          </div>
          <CardDescription>
            Extracting codes, cross-referencing CMS policies, auditing claim veracity, and drafting legal arguments.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-deep">
                Step {activeStep + 1} of {steps.length}: {currentStep.label}
              </span>
              <span className="font-mono text-mid">{progress}% complete</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-subtle"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Appeal generation progress"
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ol className="relative flex flex-col gap-0 border-t border-border pt-4">
            {steps.map((step, index) => {
              const state = stepState(index, activeStep)
              const isLast = index === steps.length - 1

              return (
                <li
                  key={step.id}
                  className={`relative flex gap-4 pb-6 ${isLast ? 'pb-0' : ''}`}
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[15px] top-8 h-[calc(100%-1.75rem)] w-px transition-colors duration-300 ${
                        state === 'done' ? 'bg-deep' : 'bg-border'
                      }`}
                    />
                  )}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-all duration-200 ${
                      state === 'done'
                        ? 'border-deep bg-deep text-white shadow-xs'
                        : state === 'active'
                          ? 'border-accent bg-accent text-white shadow-sm ring-4 ring-accent-subtle animate-pulse'
                          : 'border-border bg-card text-mid'
                    }`}
                  >
                    {state === 'done' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          state === 'active' ? 'text-accent' : state === 'done' ? 'text-deep' : 'text-mid'
                        }`}
                      >
                        {step.label}
                      </p>
                      {state === 'active' && (
                        <Badge variant="accent" className="animate-pulse">In Progress</Badge>
                      )}
                      {state === 'done' && (
                        <Badge variant="secondary">Verified</Badge>
                      )}
                    </div>
                    <p className="text-xs text-mid leading-relaxed">{step.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="flex flex-col gap-3 rounded-[6px] border border-border bg-subtle/30 p-4 sm:p-5" aria-hidden="true">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
