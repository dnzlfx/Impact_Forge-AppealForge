import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import type { AppealInput } from '../hooks/useAppealFlow'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
} from './ui'

interface DenialUploadProps {
  /** Called with full form payload when user clicks "Generate Appeal". */
  onSubmit: (input: AppealInput) => void
  isLoading?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export default function DenialUpload({ onSubmit, isLoading = false }: DenialUploadProps) {
  const denialInputRef = useRef<HTMLInputElement>(null)
  const recordInputRef = useRef<HTMLInputElement>(null)

  const [denialFile, setDenialFile] = useState<File | null>(null)
  const [recordFile, setRecordFile] = useState<File | null>(null)
  const [patientName, setPatientName] = useState('')
  const [insurerName, setInsurerName] = useState('')
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [recordDragOver, setRecordDragOver] = useState(false)

  const handleDenialChange = useCallback((file: File | undefined | null) => {
    if (!file) return
    if (!isPdf(file)) {
      setValidationError('Denial letter must be a valid PDF document.')
      return
    }
    setValidationError(null)
    setDenialFile(file)
  }, [])

  const handleRecordChange = useCallback((file: File | undefined | null) => {
    if (!file) return
    if (!isPdf(file)) {
      setValidationError('Clinical chart must be a valid PDF document.')
      return
    }
    setValidationError(null)
    setRecordFile(file)
  }, [])

  const onDenialDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    handleDenialChange(file)
  }

  const onRecordDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setRecordDragOver(false)
    const file = event.dataTransfer.files?.[0]
    handleRecordChange(file)
  }

  const onDenialKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      denialInputRef.current?.click()
    }
  }

  const onRecordKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      recordInputRef.current?.click()
    }
  }

  const removeDenial = () => {
    setDenialFile(null)
    setValidationError(null)
    if (denialInputRef.current) denialInputRef.current.value = ''
  }

  const removeRecord = () => {
    setRecordFile(null)
    if (recordInputRef.current) recordInputRef.current.value = ''
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!denialFile) {
      setValidationError('Please upload your insurance denial letter before continuing.')
      return
    }

    setValidationError(null)
    onSubmit({
      denialFile,
      medicalRecordFile: recordFile,
      patientName: patientName.trim() || null,
      insurerName: insurerName.trim() || null,
      additionalNotes: notes.trim() || '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>Insurance Denial Upload</CardTitle>
            <Badge variant="accent">CMS Evidence Pipeline</Badge>
          </div>
          <CardDescription>
            Upload your denial letter to extract clinical denial codes, search Medicare coverage guidelines, and generate an audited appeal.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {validationError && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Upload notice</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="denial-file-zone" className="text-xs font-semibold text-deep">
                Denial letter PDF <span className="text-flag-red">*</span>
              </label>
              {denialFile && (
                <Badge variant="success">Ready for analysis</Badge>
              )}
            </div>

            <div
              id="denial-file-zone"
              role="button"
              tabIndex={0}
              aria-label="Upload denial letter PDF"
              aria-describedby="denial-file-help"
              onClick={() => denialInputRef.current?.click()}
              onKeyDown={onDenialKeyDown}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDenialDrop}
              className={`group flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-[6px] border-2 border-dashed p-6 text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                dragOver
                  ? 'border-accent bg-accent-subtle/50 shadow-inner'
                  : denialFile
                    ? 'border-border bg-card shadow-xs'
                    : 'border-border bg-subtle/30 hover:border-mid hover:bg-card'
              }`}
            >
              {denialFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-display text-base font-medium text-deep break-all">{denialFile.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{formatBytes(denialFile.size)}</Badge>
                    <Badge variant="outline">PDF Document</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeDenial()
                    }}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-mid group-hover:bg-accent-subtle group-hover:text-accent transition-colors">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-deep">
                    Drag and drop your denial letter PDF here, or <span className="text-accent underline font-semibold">browse</span>
                  </p>
                  <p id="denial-file-help" className="text-xs text-mid">
                    Standard PDF files up to 25MB supported
                  </p>
                </>
              )}

              <input
                ref={denialInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(event: ChangeEvent<HTMLInputElement>) => handleDenialChange(event.target.files?.[0])}
              />
            </div>
          </div>

          <details className="group rounded-[6px] border border-border bg-card overflow-hidden transition-colors">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-xs font-semibold text-deep hover:bg-subtle/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent select-none">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Clinical Chart & Patient Context (Optional)
              </span>
              <span className="font-mono text-xs text-mid group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>

            <div className="flex flex-col gap-4 border-t border-border p-4 bg-canvas/30">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="record-file-zone" className="text-xs font-semibold text-deep">
                  Medical record / Clinical notes (Optional PDF)
                </label>
                <div
                  id="record-file-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Attach patient medical chart PDF"
                  onClick={() => recordInputRef.current?.click()}
                  onKeyDown={onRecordKeyDown}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setRecordDragOver(true)
                  }}
                  onDragLeave={() => setRecordDragOver(false)}
                  onDrop={onRecordDrop}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[4px] border border-dashed p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    recordDragOver
                      ? 'border-accent bg-accent-subtle/40'
                      : recordFile
                        ? 'border-border bg-card'
                        : 'border-border bg-card hover:border-mid hover:bg-subtle/30'
                  }`}
                >
                  {recordFile ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-xs text-deep truncate">{recordFile.name}</span>
                        <Badge variant="secondary">{formatBytes(recordFile.size)}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          removeRecord()
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-mid">Click or drop patient clinical chart PDF</span>
                      <svg className="h-4 w-4 text-mid shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </>
                  )}
                  <input
                    ref={recordInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleRecordChange(event.target.files?.[0])}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Patient Name"
                  placeholder="e.g. Jane Doe"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  helperText="Included in appeal header"
                />
                <Input
                  label="Insurance Provider"
                  placeholder="e.g. Aetna / UnitedHealthcare"
                  value={insurerName}
                  onChange={(event) => setInsurerName(event.target.value)}
                  helperText="Identifies relevant LCD/NCD jurisdiction"
                />
              </div>

              <Textarea
                label="Clinical Directives & Context"
                placeholder="e.g. Patient failed conservative physical therapy over 8 weeks; pain score 8/10 persisted..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                helperText="Specific medical arguments for the appeal letter"
                rows={3}
              />
            </div>
          </details>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-mid">
            {denialFile ? 'Ready to analyze denial reasons' : 'Attach denial letter PDF to continue'}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!denialFile}
            isLoading={isLoading}
            className="w-full sm:w-auto"
            rightIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            }
          >
            Generate Appeal Letter
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
