import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { renderToStaticMarkup } from 'react-dom/server'

export function escapeHtml(str: string): string {
  return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
}

export function downloadAppealText(text: string): void {
  const cleanText = markdownToPlainText(text)
  const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'appealforge-appeal-letter.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Convierte el markdown crudo de la IA a HTML real, reutilizado tanto por
 * la impresión/PDF como por el copiado enriquecido al portapapeles. */
export function renderMarkdownToHtml(text: string): string {
  return renderToStaticMarkup(
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>,
  )
}

const SEPARATOR_WIDTH = 70

function renderTableAsText(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll('tr')).map((tr) =>
      Array.from(tr.children).map((cell) => (cell.textContent ?? '').trim()),
  )
  if (rows.length === 0) return ''

  const colCount = Math.max(...rows.map((row) => row.length))
  const widths = Array.from({ length: colCount }, (_, i) =>
      Math.max(...rows.map((row) => (row[i] ?? '').length)),
  )

  const formatRow = (row: string[]) =>
      Array.from({ length: colCount }, (_, i) => (row[i] ?? '').padEnd(widths[i])).join('  |  ')

  const lines: string[] = []
  rows.forEach((row, i) => {
    lines.push(formatRow(row))
    if (i === 0) {
      lines.push(widths.map((w) => '-'.repeat(w)).join('--+--'))
    }
  })
  return lines.join('\n') + '\n\n'
}

/** Recorre el HTML ya renderizado desde markdown y produce texto plano
 * legible: sin `**`, `#` ni `|---|---|` — negritas simplemente como texto,
 * headers como líneas subrayadas, tablas alineadas con espacios. */
function nodeToPlainText(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const childText = () => Array.from(el.childNodes).map(nodeToPlainText).join('')

  switch (tag) {
    case 'h1':
    case 'h2':
    case 'h3': {
      const text = childText().trim()
      return `\n${text}\n${'-'.repeat(Math.min(text.length, SEPARATOR_WIDTH))}\n\n`
    }
    case 'p':
      return `${childText().trim()}\n\n`
    case 'li':
      return `- ${childText().trim()}\n`
    case 'ul':
    case 'ol':
      return `${childText()}\n`
    case 'hr':
      return `${'-'.repeat(SEPARATOR_WIDTH)}\n\n`
    case 'blockquote':
      return (
          childText()
              .trim()
              .split('\n')
              .map((line) => `> ${line}`)
              .join('\n') + '\n\n'
      )
    case 'table':
      return renderTableAsText(el)
    default:
      return childText()
  }
}

/** Convierte markdown crudo a texto plano limpio para el archivo .txt
 * descargable: mismo parser que la vista previa, pero sin símbolos de
 * markdown (sirve para abrir en terminal, Notepad, o cualquier editor). */
export function markdownToPlainText(markdown: string): string {
  const html = renderMarkdownToHtml(markdown)
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const text = Array.from(doc.body.childNodes).map(nodeToPlainText).join('')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export function printAppealDocument(text: string, patient?: string | null, insurer?: string | null): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  // El texto viene en markdown crudo de la IA: lo convertimos a HTML real
  // (mismo parser que la vista previa) en vez de volcarlo como texto plano.
  const contentHtml = renderMarkdownToHtml(text)

  const formattedHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
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
          }
          .content h1, .content h2, .content h3 {
            color: #233831;
            font-weight: 700;
            margin: 20px 0 8px 0;
            page-break-after: avoid;
          }
          .content h1 { font-size: 18px; }
          .content h2 { font-size: 16px; }
          .content h3 { font-size: 14px; }
          .content p {
            margin: 0 0 12px 0;
          }
          .content ul, .content ol {
            margin: 0 0 12px 0;
            padding-left: 20px;
          }
          .content li {
            margin-bottom: 4px;
          }
          .content strong {
            font-weight: 700;
          }
          .content hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 16px 0;
          }
          .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 16px 0;
            font-size: 13px;
          }
          .content th, .content td {
            border: 1px solid #ccc;
            padding: 6px 8px;
            text-align: left;
          }
          .content th {
            background: #f2f2f2;
            font-weight: 700;
          }
          .content blockquote {
            border-left: 3px solid #ccc;
            margin: 0 0 12px 0;
            padding-left: 12px;
            color: #555;
            font-style: italic;
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
        <div class="content">${contentHtml}</div>
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