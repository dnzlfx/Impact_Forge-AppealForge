import { useState } from 'react'
import DenialUpload from './components/DenialUpload'
import ProcessingStepper from './components/ProcessingStepper'
import AppealLetterViewer from './components/AppealLetterViewer'
import ExtractedCodesPanel from './components/ExtractedCodesPanel'
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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-lilac/60 bg-white/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5" aria-label="AppealForge — Home">
            <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="6" className="fill-deep" />
              <path
                d="M9 15.5 13.5 20l4.5-5-4.5-5-4.5 5.5Z"
                className="stroke-sky"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M17 19.5h6" className="stroke-accent" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="font-display text-xl font-semibold text-deep">AppealForge</span>
          </a>
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-mid sm:block">
            Healthcare Insurance Appeals AI
          </span>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl">
          {(state.stage === 'idle' || state.stage === 'uploading') && (
            <DenialUpload onSubmit={handleSubmit} />
          )}

          {state.stage === 'processing' && (
            <ProcessingStepper steps={PROCESSING_STEPS} activeStep={state.activeStep} />
          )}

          {state.stage === 'review' && state.result && <ReviewView result={state.result} isMock={state.isMock} onReset={flow.reset} />}

          {state.stage === 'error' && (
            <ErrorView
              message={state.error ?? 'An unexpected error occurred'}
              onRetry={handleRetry}
              onReset={flow.reset}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-lilac/60 py-6">
        <p className="mx-auto max-w-5xl px-4 font-mono text-[11px] text-mid sm:px-6">
          Impact Forge Hackathon · AppealForge · Clinical citations must be verified against official CMS guidelines.
        </p>
      </footer>
    </div>
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
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-[3px] border border-lilac bg-sky/40 px-3 py-1.5 font-mono text-[11px] text-mid">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Demo Mock Mode — Backend offline
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex h-11 items-center gap-2 rounded-[3px] border border-lilac bg-white px-4 text-sm font-medium text-mid transition-colors hover:border-deep hover:text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Start New Appeal
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <AppealLetterViewer appealText={result.appeal_text} flags={result.audit_flags} />
        </div>
        <aside className="flex flex-col gap-6 border-lilac/60 md:border-l md:pl-6">
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
                  <li key={`${citation.source}-${i}`} className="rounded-[3px] border border-lilac bg-white px-3 py-2">
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
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[3px] border border-flag-red/40 bg-flag-bg p-8 text-center"
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
        <button
          type="button"
          onClick={onRetry}
          className="flex h-11 items-center justify-center rounded-[3px] bg-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex h-11 items-center justify-center rounded-[3px] border border-deep/30 px-6 text-sm font-medium text-deep transition-colors hover:border-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Start New Appeal
        </button>
      </div>
    </section>
  )
}

export default App