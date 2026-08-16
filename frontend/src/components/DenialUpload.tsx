import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import type { AppealInput } from '../hooks/useAppealFlow'

interface DenialUploadProps {
  /** Se llama con el formulario completo cuando el usuario pulsa "Generar apelación". */
  onSubmit: (input: AppealInput) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Dropzone de un solo PDF (click + drag & drop) con validación de tipo,
 * y un expediente médico opcional + metadatos del paciente. Puramente
 * controlado por props: el único botón actúa como submit del formulario.
 */
export default function DenialUpload({ onSubmit }: DenialUploadProps) {
  const denialInputRef = useRef<HTMLInputElement>(null)
  const recordInputRef = useRef<HTMLInputElement>(null)

  const [denialFile, setDenialFile] = useState<File | null>(null)
  const [recordFile, setRecordFile] = useState<File | null>(null)
  const [patientName, setPatientName] = useState('')
  const [insurerName, setInsurerName] = useState('')
  const [notes, setNotes] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDenialChange = useCallback((file: File | undefined | null) => {
    if (!file) return
    if (!isPdf(file)) {
      setInvalid('El archivo debe ser un PDF.')
      return
    }
    setInvalid(null)
    setDenialFile(file)
  }, [])

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    handleDenialChange(file)
  }

  const onDenialInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleDenialChange(event.target.files?.[0])
  }

  const removeDenial = () => {
    setDenialFile(null)
    setInvalid(null)
  }

  const submit = () => {
    if (!denialFile) return
    onSubmit({
      denialFile,
      medicalRecordFile: recordFile,
      patientName: patientName.trim() || null,
      insurerName: insurerName.trim() || null,
      additionalNotes: notes.trim() || '',
    })
  }

  return (
    <section aria-labelledby="upload-heading" className="flex flex-col gap-6">
      <header>
        <h2 id="upload-heading" className="font-display text-2xl font-medium text-deep sm:text-3xl">
          Sube tu carta de denegación
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-mid">
          AppealForge lee el PDF, extrae el motivo del rechazo y los códigos médicos,
          redacta la carta de apelación con respaldo en guías de CMS y la audita con
          un modelo independiente antes de que la revises.
        </p>
      </header>

      <div
        role="button"
        tabIndex={0}
        aria-label="Subir PDF de la carta de denegación"
        onClick={() => denialInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            denialInputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`group flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-[3px] border-2 border-dashed bg-sky/40 px-6 py-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          dragOver ? 'border-accent bg-sky' : 'border-lilac'
        }`}
      >
        {denialFile ? (
          <>
            <span className="font-display text-lg font-medium text-deep">{denialFile.name}</span>
            <span className="font-mono text-xs text-mid">{formatBytes(denialFile.size)} · PDF</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                removeDenial()
              }}
              className="mt-1 rounded-[3px] border border-deep/20 px-3 py-1.5 text-xs font-medium text-deep transition-colors hover:bg-deep hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Quitar archivo
            </button>
          </>
        ) : (
          <>
            <svg
              className="h-10 w-10 text-mid transition-colors group-hover:text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <p className="text-sm font-medium text-deep">
              Haz clic o arrastra la carta de denegación aquí
            </p>
            <p className="text-xs text-mid">Solo un archivo PDF · sin límite de tamaño</p>
          </>
        )}

        <input
          ref={denialInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={onDenialInput}
          disabled={Boolean(denialFile)}
        />
      </div>

      {invalid && (
        <p role="alert" className="-mt-4 text-sm font-medium text-flag-red">
          {invalid}
        </p>
      )}

      <details className="group rounded-[3px] border border-lilac bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <svg className="h-4 w-4 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Expediente médico y contexto (opcional, mejora la auditoría)
          <span className="ml-auto font-mono text-xs text-mid transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-lilac/60 p-4">
          <button
            type="button"
            onClick={() => recordInputRef.current?.click()}
            className="flex items-center justify-between gap-3 rounded-[3px] border border-dashed border-lilac px-4 py-3 text-left text-sm text-mid transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {recordFile ? (
              <span className="font-medium text-deep">
                {recordFile.name}
                <span className="ml-2 font-mono text-xs text-mid">{formatBytes(recordFile.size)}</span>
              </span>
            ) : (
              <span>Agregar expediente médico (PDF opcional)</span>
            )}
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <input
            ref={recordInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              setRecordFile(file && isPdf(file) ? file : null)
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-mid">
              Nombre del paciente
              <input
                type="text"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                className="rounded-[3px] border border-lilac bg-white px-3 py-2 text-sm text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-mid">
              Aseguradora
              <input
                type="text"
                value={insurerName}
                onChange={(event) => setInsurerName(event.target.value)}
                className="rounded-[3px] border border-lilac bg-white px-3 py-2 text-sm text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-mid">
            Notas adicionales
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="rounded-[3px] border border-lilac bg-white px-3 py-2 text-sm text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        </div>
      </details>

      <button
        type="button"
        onClick={submit}
        disabled={!denialFile}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
      >
        Generar apelación
      </button>
    </section>
  )
}