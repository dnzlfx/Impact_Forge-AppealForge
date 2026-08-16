import { useEffect, useMemo, useState } from 'react'
import type { AuditFlag } from '../lib/types'
import { segmentByParagraphs } from '../lib/highlight'

interface AppealLetterViewerProps {
  appealText: string
  flags: AuditFlag[]
}

function downloadAppealText(text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'appealforge-apelacion.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Viewer de la carta de apelación. Marca cada frase auditada sin respaldo con
 * estilo de flag y un tooltip accesible por hover Y por teclado (tabindex).
 */
export default function AppealLetterViewer({ appealText, flags }: AppealLetterViewerProps) {
  const paragraphs = useMemo(
    () => segmentByParagraphs(appealText, flags),
    [appealText, flags],
  )

  const [openTooltip, setOpenTooltip] = useState<string | null>(null)

  useEffect(() => {
    if (!openTooltip) return
    const close = () => setOpenTooltip(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openTooltip])

  return (
    <article aria-label="Carta de apelación generada" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-medium text-deep">Borrador de la apelación</h2>
        <button
          type="button"
          onClick={() => downloadAppealText(appealText)}
          className="flex h-11 items-center gap-2 rounded-[3px] bg-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar (.txt)
        </button>
      </div>

      <div className="flex flex-col gap-5 rounded-[3px] border border-lilac bg-white p-5 sm:p-8">
        {paragraphs.map((segments, paragraphIndex) => (
          <p key={paragraphIndex} className="text-[15px] leading-[1.75] text-deep">
            {segments.map((segment, segmentIndex) =>
              segment.flag ? (
                <mark
                  key={segmentIndex}
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation()
                    const id = `${paragraphIndex}-${segmentIndex}`
                    setOpenTooltip(openTooltip === id ? null : id)
                  }}
                  className="group relative box-decoration-clone cursor-pointer rounded-[2px] bg-flag-bg px-0.5 text-[inherit] font-medium text-flag-red focus:outline-none focus-visible:ring-2 focus-visible:ring-flag-red focus-visible:ring-offset-1"
                >
                  {segment.text}
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full left-0 z-40 mb-2 w-64 max-w-[280px] rounded-[3px] bg-deep p-3 text-left text-xs leading-snug text-white opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
                      openTooltip === `${paragraphIndex}-${segmentIndex}` ? 'visible opacity-100' : 'invisible'
                    }`}
                  >
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-sky">
                      {segment.flag.issue_type} · {segment.flag.severity}
                    </span>
                    {segment.flag.explanation}
                  </span>
                </mark>
              ) : (
                <span key={segmentIndex}>{segment.text}</span>
              ),
            )}
          </p>
        ))}

        {flags.length === 0 && (
          <p className="rounded-[3px] border border-lilac bg-sky/40 px-4 py-3 text-sm text-mid">
            Sin marcas de auditoría: todas las afirmaciones tienen respaldo en el expediente.
          </p>
        )}
      </div>
    </article>
  )
}