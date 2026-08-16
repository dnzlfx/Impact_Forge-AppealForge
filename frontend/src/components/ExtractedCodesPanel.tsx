import type { ExtractedCode } from '../lib/types'

interface ExtractedCodesPanelProps {
  codes: ExtractedCode[]
  guidesUsed?: number
}

/**
 * Displays detected CPT / ICD-10 clinical codes with their verification status,
 * alongside official clinical coverage citations count (RAG).
 */
export default function ExtractedCodesPanel({ codes, guidesUsed }: ExtractedCodesPanelProps) {
  const cpt = codes.filter((code) => code.type === 'CPT')
  const icd10 = codes.filter((code) => code.type === 'ICD-10')

  return (
    <section aria-labelledby="codes-heading" className="flex flex-col gap-4">
      <h3 id="codes-heading" className="flex items-center gap-2 font-display text-lg font-medium text-deep">
        Detected Clinical Codes
        <span className="font-mono text-xs font-normal text-mid">
          {codes.length} total
        </span>
      </h3>

      <div className="flex flex-col gap-3">
        {renderGroup('CPT', cpt)}
        {renderGroup('ICD-10', icd10)}
      </div>

      {guidesUsed !== undefined && (
        <p className="font-mono text-xs text-mid">
          {guidesUsed} official guideline{guidesUsed === 1 ? '' : 's'} referenced (RAG)
        </p>
      )}
    </section>
  )
}

function renderGroup(type: 'CPT' | 'ICD-10', codes: ExtractedCode[]) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-mid">{type}</p>
      {codes.length === 0 ? (
        <p className="text-xs text-mid">No {type} codes detected.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {codes.map((code) => (
            <li
              key={`${type}-${code.code}`}
              className="flex items-center gap-2 rounded-[3px] border border-lilac bg-white px-3 py-1.5"
            >
              <span className="font-mono text-sm text-deep">{code.code}</span>
              <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-accent">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {code.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}