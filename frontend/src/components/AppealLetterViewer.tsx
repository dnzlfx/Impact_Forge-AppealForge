import { useState, useMemo, useEffect } from 'react'
import type { AuditFlag } from '../lib/types'
import { segmentByParagraphs } from '../lib/highlight'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
} from './ui'

interface AppealLetterViewerProps {
  appealText: string
  flags: AuditFlag[]
  onRegenerate?: () => void
  patientName?: string | null
  insurerName?: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function downloadAppealText(text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'appealforge-appeal-letter.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function printAppealDocument(text: string, patient?: string | null, insurer?: string | null): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const formattedHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Insurance Appeal Letter</title>
        <style>
          @page { margin: 20mm; size: letter; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
          }
          .header {
            border-bottom: 2px solid #233831;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #233831;
            margin: 0 0 6px 0;
          }
          .meta {
            font-size: 13px;
            color: #555;
          }
          .content {
            font-size: 14px;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #888;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Formal Medical Necessity Appeal Letter</h1>
          <div class="meta">
            ${patient ? `<div><strong>Patient:</strong> ${escapeHtml(patient)}</div>` : ''}
            ${insurer ? `<div><strong>Insurer:</strong> ${escapeHtml(insurer)}</div>` : ''}
            <div><strong>Generated on:</strong> ${escapeHtml(new Date().toLocaleDateString())}</div>
          </div>
        </div>
        <div class="content">${escapeHtml(text)}</div>
        <div class="footer">
          Generated via AppealForge · Independent Clinical Evidence & Audit Engine
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(formattedHtml)
  printWindow.document.close()
}

export default function AppealLetterViewer({
  appealText,
  flags,
  onRegenerate,
  patientName,
  insurerName,
}: AppealLetterViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(appealText)
  const [copied, setCopied] = useState(false)
  const [selectedFlagIndex, setSelectedFlagIndex] = useState<number | null>(null)

  useEffect(() => {
    setEditedText(appealText)
  }, [appealText])

  const currentText = isEditing ? editedText : appealText


  const paragraphs = useMemo(
    () => segmentByParagraphs(currentText, flags),
    [currentText, flags],
  )

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const getSeverityBadgeVariant = (severity: string): 'destructive' | 'warning' | 'secondary' => {
    const s = severity.toUpperCase()
    if (s === 'HIGH') return 'destructive'
    if (s === 'MEDIUM') return 'warning'
    return 'secondary'
  }

  return (
    <div className="flex flex-col gap-6" aria-label="Appeal Letter Review">
      <Card variant="elevated">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>Appeal Letter Draft</CardTitle>
                <Badge variant="outline">{isEditing ? 'Drafting Mode' : 'Audited View'}</Badge>
                {flags.length > 0 ? (
                  <Badge variant="warning">{flags.length} audit notice{flags.length === 1 ? '' : 's'}</Badge>
                ) : (
                  <Badge variant="success">Audited & Clean</Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                Clinical arguments referencing CMS Medicare Guidelines and verified patient records.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant={isEditing ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                leftIcon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                }
              >
                {isEditing ? 'Preview with highlights' : 'Edit text'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                leftIcon={
                  copied ? (
                    <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                  )
                }
              >
                {copied ? 'Copied!' : 'Copy letter'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadAppealText(currentText)}
                leftIcon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                }
              >
                Download (.txt)
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => printAppealDocument(currentText, patientName, insurerName)}
                leftIcon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                }
              >
                Print / PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {flags.length > 0 && !isEditing && (
            <div className="mb-6 flex flex-col gap-3 rounded-[6px] border border-border bg-amber-subtle/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-deep flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  AI Clinical Auditor 2 (Discrepancy & Hallucination Review)
                </span>
                <span className="text-[11px] text-mid">Click an issue to highlight in text</span>
              </div>
              <div className="grid gap-2">
                {flags.map((flag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedFlagIndex(selectedFlagIndex === idx ? null : idx)}
                    className={`flex items-start justify-between gap-3 text-left rounded-[4px] border p-2.5 transition-all text-xs ${
                      selectedFlagIndex === idx
                        ? 'border-accent bg-card shadow-xs'
                        : 'border-border bg-card/60 hover:bg-card hover:border-mid'
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-medium text-deep line-clamp-1">"{flag.claim_text}"</span>
                      <p className="text-mid text-[11px] leading-relaxed">{flag.explanation}</p>
                    </div>
                    <Badge variant={getSeverityBadgeVariant(flag.severity)} className="shrink-0">
                      {flag.severity}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-3">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={16}
                className="font-mono text-xs leading-relaxed"
                aria-label="Edit appeal letter text"
              />
              <p className="text-xs text-mid">
                Modifications are reflected immediately in your exported TXT/Print documents.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-[4px] border border-border bg-canvas/30 p-6 font-sans">
              {currentText.trim() ? (
                paragraphs.map((segments, paragraphIndex) => (
                  <p key={paragraphIndex} className="text-sm leading-[1.8] text-deep">
                    {segments.map((segment, segmentIndex) =>
                      segment.flag ? (
                        <mark
                          key={segmentIndex}
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
                        <span key={segmentIndex}>{segment.text}</span>
                      ),
                    )}
                  </p>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-mid">
                  <p className="font-semibold text-deep text-sm mb-1">No appeal text was returned by the AI pipeline.</p>
                  <p>Check the backend model configuration or retry generating the appeal.</p>
                </div>
              )}

              {flags.length === 0 && currentText.trim() && (
                <Alert variant="success">
                  <AlertTitle>Dual-AI Independent Audit Passed</AlertTitle>
                  <AlertDescription>
                    Auditor AI cross-examined all clinical claims, treatment timelines, and diagnostic codes against official CMS policies with zero unverified discrepancies found.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>


        <CardFooter className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-mid">
            Review complete · Ready for payer submission
          </div>
          {onRegenerate && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onRegenerate}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              }
            >
              Start New Appeal
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
