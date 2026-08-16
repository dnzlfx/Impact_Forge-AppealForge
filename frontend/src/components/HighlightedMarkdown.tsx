import { useMemo, Children, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { AuditFlag } from '../lib/types'
import { splitByFlags } from '../lib/highlight'

/**
 * Recorre los children ya renderizados por react-markdown (strings sueltos
 * y elementos anidados como <strong>/<em>) y envuelve en <mark> los
 * fragmentos que coincidan con algún audit_flag, igual que antes con
 * splitByFlags pero ahora operando dentro de cada nodo de markdown.
 */
function highlightChildren(
  children: ReactNode,
  flags: AuditFlag[],
  selectedFlagIndex: number | null,
): ReactNode {
  return Children.map(children, (child, i) => {
    if (typeof child !== 'string') return child

    const segments = splitByFlags(child, flags)
    if (segments.length === 1 && !segments[0].flag) return child

    return segments.map((segment, j) =>
      segment.flag ? (
        <mark
          key={`${i}-${j}`}
          tabIndex={0}
          className={`box-decoration-clone rounded-[2px] px-1 py-0.5 font-medium transition-all ${
            selectedFlagIndex !== null && flags[selectedFlagIndex]?.claim_text === segment.flag.claim_text
              ? 'bg-flag-red text-white ring-2 ring-flag-red'
              : 'bg-flag-bg text-flag-red hover:bg-flag-red/20'
          }`}
          title={`${segment.flag.issue_type} (${segment.flag.severity}): ${segment.flag.explanation}`}
        >
          {segment.text}
        </mark>
      ) : (
        <span key={`${i}-${j}`}>{segment.text}</span>
      ),
    )
  })
}

/** Construye el mapa de components de react-markdown, cada tag envuelto
 * con el resaltado de flags y con las clases de estilo del diseño actual. */
function buildMarkdownComponents(flags: AuditFlag[], selectedFlagIndex: number | null): Components {
  return {
    p: ({ children }) => (
      <p className="text-sm leading-[1.8] text-deep mb-4 last:mb-0">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="font-display text-lg font-semibold text-deep mt-6 mb-2 first:mt-0">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-base font-semibold text-deep mt-6 mb-2 first:mt-0">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display text-sm font-semibold text-deep mt-4 mb-1.5">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-deep">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic">{highlightChildren(children, flags, selectedFlagIndex)}</em>
    ),
    li: ({ children }) => (
      <li className="text-sm leading-[1.7] text-deep">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </li>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-4">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-border pl-4 italic text-mid mb-4">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-border" />,
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-border text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border bg-canvas/50 px-2 py-1 text-left font-semibold text-deep">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-2 py-1 text-deep">
        {highlightChildren(children, flags, selectedFlagIndex)}
      </td>
    ),
  }
}

interface HighlightedMarkdownProps {
  /** Texto en markdown crudo devuelto por la IA. */
  text: string
  /** Hallazgos del auditor a resaltar dentro del texto. */
  flags: AuditFlag[]
  /** Índice del flag seleccionado actualmente (para el resaltado activo). */
  selectedFlagIndex: number | null
}

/** Renderiza texto markdown con los audit_flags resaltados como <mark>,
 * reutilizable en cualquier vista que necesite mostrar la carta de apelación. */
export default function HighlightedMarkdown({ text, flags, selectedFlagIndex }: HighlightedMarkdownProps) {
  const components = useMemo(
    () => buildMarkdownComponents(flags, selectedFlagIndex),
    [flags, selectedFlagIndex],
  )

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  )
}
