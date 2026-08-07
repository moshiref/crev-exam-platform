/** Formats an ISO date string (YYYY-MM-DD) into Arabic-localized form. */
export function formatDate(isoDate) {
  if (!isoDate) return ''
  // Parse date-only values as local midnight so the calendar day is never
  // shifted by the browser's timezone offset (new Date("YYYY-MM-DD") is UTC).
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * Formats a stored submission timestamp as "YYYY-MM-DD HH:MM" in the
 * browser's local time. Uses the same storage convention as
 * `parseStoredTimestamp` in statsUtils:
 *   - "YYYY-MM-DD"            → calendar date (local midnight)
 *   - "YYYY-MM-DD HH:MM[:SS]" → stored in UTC (produced by `toISOString()`)
 *   - ISO strings ("…Z")      → parsed as-is
 * Unparseable values are returned unchanged.
 */
export function formatDateTime(value) {
  if (!value) return ''
  const s = String(value).trim()
  let date
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    date = new Date(`${s}T00:00:00`)
  } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    date = new Date(`${s.slice(0, 10)}T${s.slice(11, 16)}:00Z`)
  } else {
    date = new Date(s)
  }
  if (Number.isNaN(date.getTime())) return s
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}
