import type { AuditFlag } from './types'

export interface Segment {
  text: string
  flag?: AuditFlag
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Divide un texto en fragmentos, marcando cada claim_text del auditor que
 * coincida como substring exacto (case-insensitive). Si el backend llega a
 * devolver offsets en vez de substring, este es el único sitio a tocar.
 */
export function splitByFlags(text: string, flags: AuditFlag[]): Segment[] {
  const markers: Array<{ index: number; end: number }> = []

  for (const flag of flags) {
    const phrase = flag.claim_text
    if (!phrase) continue
    const regex = new RegExp(escapeRegExp(phrase), 'ig')
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      markers.push({ index: match.index, end: match.index + phrase.length })
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
    const phrase = text.slice(marker.index, marker.end)
    const flag = flags.find((f) => f.claim_text.toLowerCase() === phrase.toLowerCase())
    segments.push({ text: phrase, flag })
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