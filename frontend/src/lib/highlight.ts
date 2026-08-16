import type { AuditFlag } from './types'

export interface Segment {
  text: string
  flag?: AuditFlag
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Divide un texto en fragmentos, marcando cada claim_text del auditor que
 * coincida como substring exacto o normalizado (case-insensitive).
 */
export function splitByFlags(text: string, flags: AuditFlag[]): Segment[] {
  const markers: Array<{ index: number; end: number; flag: AuditFlag }> = []

  for (const flag of flags) {
    const rawPhrase = flag.claim_text
    if (!rawPhrase) continue
    const phrase = normalizeWhitespace(rawPhrase)
    if (!phrase) continue

    // Primero intentamos match directo tolerando múltiples espacios
    const flexPattern = escapeRegExp(phrase).replace(/\\ /g, '\\s+')
    const regex = new RegExp(flexPattern, 'ig')
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      markers.push({ index: match.index, end: match.index + match[0].length, flag })
      if (match.index === regex.lastIndex) regex.lastIndex++
    }
  }

  if (markers.length === 0) return [{ text }]

  markers.sort((a, b) => a.index - b.index)

  const segments: Segment[] = []
  let cursor = 0
  for (const marker of markers) {
    if (marker.index < cursor) continue
    if (marker.index > cursor) {
      segments.push({ text: text.slice(cursor, marker.index) })
    }
    const matchedText = text.slice(marker.index, marker.end)
    segments.push({ text: matchedText, flag: marker.flag })
    cursor = marker.end
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) })
  }
  return segments
}

/** Separa el texto en párrafos y cada párrafo en segmentos marcados. */
export function segmentByParagraphs(
  text: string,
  flags: AuditFlag[],
): Array<Array<Segment>> {
  const paragraphs = text.split(/\n\n+/).map((p) => p.replace(/\n/g, ' ').trim())
  return paragraphs.filter(Boolean).map((paragraph) => splitByFlags(paragraph, flags))
}
