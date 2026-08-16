import { useState } from 'react'
import type { ExtractedCode, RagCitation } from '../lib/types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './ui'

interface ExtractedCodesPanelProps {
  codes: ExtractedCode[]
  citations?: RagCitation[]
  guidesUsed?: number
}

export default function ExtractedCodesPanel({
  codes,
  citations = [],
  guidesUsed,
}: ExtractedCodesPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const cptCodes = codes.filter((c) => c.type === 'CPT')
  const icd10Codes = codes.filter((c) => c.type === 'ICD-10')

  const copyCode = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      // Fallback
    }
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle>Clinical Evidence & Classification</CardTitle>
          <Badge variant="accent">Medicare LCD / NCD Grounding</Badge>
        </div>
        <CardDescription>
          Validated diagnostic codes, procedure classifications, and official CMS coverage determinations retrieved for this appeal.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="cpt">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="cpt">
              CPT Procedures ({cptCodes.length})
            </TabsTrigger>
            <TabsTrigger value="icd10">
              ICD-10 Diagnoses ({icd10Codes.length})
            </TabsTrigger>
            <TabsTrigger value="citations">
              CMS Citations ({citations.length || guidesUsed || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cpt" className="mt-4">
            {cptCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-mid rounded-[4px] border border-border bg-subtle/20">
                No specific CPT procedure codes extracted from the denial document.
              </div>
            ) : (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {cptCodes.map((code, idx) => {
                  const key = `cpt-${code.code}-${idx}`
                  const isCopied = copiedKey === key
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-[4px] border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-deep">{code.code}</span>
                          <Badge variant="success">CPT Verified</Badge>
                        </div>
                        <span className="text-xs text-mid truncate">Procedure / Intervention</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(key, code.code)}
                        aria-label={`Copy CPT code ${code.code}`}
                      >
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="icd10" className="mt-4">
            {icd10Codes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-mid rounded-[4px] border border-border bg-subtle/20">
                No ICD-10 diagnostic codes extracted from the denial document.
              </div>
            ) : (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {icd10Codes.map((code, idx) => {
                  const key = `icd-${code.code}-${idx}`
                  const isCopied = copiedKey === key
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-[4px] border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-deep">{code.code}</span>
                          <Badge variant="success">ICD-10 Verified</Badge>
                        </div>
                        <span className="text-xs text-mid truncate">Diagnosis / Clinical Condition</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(key, code.code)}
                        aria-label={`Copy ICD-10 code ${code.code}`}
                      >
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="citations" className="mt-4">
            {citations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-mid rounded-[4px] border border-border bg-subtle/20">
                {guidesUsed ? `${guidesUsed} official CMS guidelines referenced in appeal text.` : 'No external citations attached.'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {citations.map((citation, idx) => {
                  const key = `cit-${idx}`
                  const isCopied = copiedKey === key
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-2 rounded-[4px] border border-border bg-card p-3.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-deep">{citation.source}</span>
                          <Badge variant="accent">CMS Guideline</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(key, `${citation.source}: ${citation.text}`)}
                        >
                          {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                      <p className="text-mid leading-relaxed font-sans">{citation.text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
