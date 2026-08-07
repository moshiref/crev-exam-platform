// ============================================================================
// Export helpers for the teacher dashboard Results page.
//
// Excel: a CSV (utf-8 with BOM, comma-separated) — Excel opens these with the
// Arabic text intact and no library is required. The filename still uses the
// .xlsx extension so it reads as an Excel export.
//
// PDF: browser print dialog triggered against a printable results node
// (marked `data-print-area`), mirroring the existing student-card print flow.
// ============================================================================

/** Triggers a client-side download of `text` with the given filename. */
export function downloadText(text, filename) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Escapes a single CSV cell (quotes, commas, newlines). */
function csvCell(value) {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Serializes a header + row array into a CSV string. */
export function toCsv(header, rows) {
  const lines = [header.map(csvCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','))
  }
  return lines.join('\r\n')
}

/** Downloads an array of columns + rows as an Excel-compatible file. */
export function exportExcel({ filename, header, rows }) {
  downloadText(toCsv(header, rows), filename)
}

/** Opens the browser print dialog for the given results node (rendered PDF). */
export function exportPdf() {
  window.print()
}

/** Formats a numeric percentage value (0–100). */
export function percent(fraction, digits = 0) {
  if (fraction == null || !Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(digits)}%`
}