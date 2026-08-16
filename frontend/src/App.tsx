import { useState } from 'react'
import DenialUpload from './components/DenialUpload'
import ProcessingStepper from './components/ProcessingStepper'
import AppealLetterViewer from './components/AppealLetterViewer'
import ExtractedCodesPanel from './components/ExtractedCodesPanel'
import { AppShell, StageProgress } from './components/layout'
import { Button } from './components/ui'
import { useAppealFlow, type AppealInput } from './hooks/useAppealFlow'
import { PROCESSING_STEPS } from './lib/steps'
import { normalizeCodes } from './lib/types'
import type { AppealResponse } from './lib/types'

function App() {
  const flow = useAppealFlow()
  const { state } = flow

  const [lastInput, setLastInput] = useState<AppealInput | null>(null)

  const handleSubmit = (input: AppealInput) => {
    setLastInput(input)
    flow.start(input)
  }

  const handleRetry = () => {
    if (lastInput) flow.start(lastInput)
  }

  const isProcessing = state.stage === 'processing' || state.stage === 'uploading'

  return (
    <AppShell
      currentStage={state.stage}
      onNewAppeal={state.stage !== 'idle' ? flow.reset : undefined}
      isProcessing={isProcessing}
    >
      <div className="flex flex-col gap-8">
        <StageProgress currentStage={state.stage} />

        <div className="w-full">
          {(state.stage === 'idle' || state.stage === 'uploading') && (
            <DenialUpload onSubmit={handleSubmit} />
          )}

          {state.stage === 'processing' && (
            <ProcessingStepper steps={PROCESSING_STEPS} activeStep={state.activeStep} />
          )}

          {state.stage === 'review' && state.result && (
            <ReviewView result={state.result} isMock={state.isMock} onReset={flow.reset} />
          )}

          {state.stage === 'error' && (
            <ErrorView
              message={state.error ?? 'An unexpected error occurred'}
              onRetry={handleRetry}
              onReset={flow.reset}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}

function ReviewView({ result, isMock, onReset }: { result: AppealResponse; isMock: boolean; onReset: () => void }) {
  const codes = normalizeCodes(result.codes_detected)
  const guidesUsed = result.rag_citations.length

  return (
    <section aria-labelledby="review-heading" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="review-heading" className="font-display text-2xl font-medium text-deep">
            Appeal Review & Audit
          </h2>
          <p className="mt-1 text-sm text-mid">
            {result.audit_flags.length === 0
              ? 'Your appeal letter is complete and cleared by the clinical audit.'
              : `${result.audit_flags.length} claim${result.audit_flags.length === 1 ? '' : 's'} require verification — review highlighted flags below.`}
          </p>
          {isMock && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-mid shadow-xs">
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Demo Mock Mode — Backend offline
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          }
        >
          Start New Appeal
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <AppealLetterViewer appealText={result.appeal_text} flags={result.audit_flags} />
        </div>
        <aside className="flex flex-col gap-6 border-border md:border-l md:pl-6">
          <ExtractedCodesPanel
            codes={codes}
            guidesUsed={guidesUsed}
          />
          {result.rag_citations.length > 0 && (
            <section aria-labelledby="citations-heading" className="flex flex-col gap-3">
              <h3 id="citations-heading" className="font-display text-lg font-medium text-deep">
                Referenced Guidelines
              </h3>
              <ul className="flex flex-col gap-2">
                {result.rag_citations.map((citation, i) => (
                  <li key={`${citation.source}-${i}`} className="rounded-[4px] border border-border bg-card px-3 py-2">
                    <p className="text-xs font-semibold text-deep">{citation.source}</p>
                    <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-mid">{citation.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </section>
  )
}

function ErrorView({
  message,
  onRetry,
  onReset,
}: {
  message: string
  onRetry: () => void
  onReset: () => void
}) {
  return (
    <section
      role="alert"
      aria-labelledby="error-heading"
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[6px] border border-flag-red/30 bg-flag-bg p-8 text-center"
    >
      <svg className="h-8 w-8 text-flag-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <h2 id="error-heading" className="font-display text-xl font-semibold text-deep">
        Unable to Generate Appeal Letter
      </h2>
      <p className="text-sm leading-relaxed text-mid">{message}</p>
      <p className="font-mono text-[11px] text-mid">
        Your uploaded documents are preserved: retry without re-uploading.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          onClick={onRetry}
        >
          Retry
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
        >
          Start New Appeal
        </Button>
      </div>
    </section>
  )
}

export default App