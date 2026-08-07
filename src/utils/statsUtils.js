// ============================================================================
// Pure statistics helpers used by dashboards. Every value here is computed
// from the actual dataset — no hard-coded numbers anywhere.
// ============================================================================

// `getDay()` → 0=Sunday … 6=Saturday, so the Arabic labels must line up with
// the JS weekday index (previous version was shifted by one day).
const DAY_LABELS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

const pad = (n) => String(n).padStart(2, '0')

/**
 * Parses a stored timestamp into a Date, normalizing the whole platform to a
 * single timezone convention:
 *   - "YYYY-MM-DD"            → calendar date (local midnight)
 *   - "YYYY-MM-DD HH:MM[:SS]" → stored in UTC (produced by `toISOString()`),
 *                               parsed as UTC
 *   - ISO strings ("…Z")      → parsed as-is
 * Returns null when unparseable.
 */
export function parseStoredTimestamp(str) {
  if (!str) return null
  const s = String(str).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`)
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return new Date(`${s.slice(0, 10)}T${s.slice(11, 16)}:00Z`)
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Local calendar-day key "MM-DD" for a Date — matches the weekly chart buckets. */
function localDayKey(date) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today's local date as "YYYY-MM-DD" (used for "scheduled today" filters). */
export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Builds the last-7-days submission series from exam attempts' `submittedAt`.
 * Stored UTC timestamps are converted to the local calendar day before
 * bucketing, so a submission always lands on the day the user sees.
 * Days without submissions are 0 — the chart reflects only real data.
 */
export function computeWeeklyActivity(attempts) {
  const today = new Date()
  const buckets = new Map()
  const dayNames = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = localDayKey(d)
    buckets.set(key, 0)
    dayNames.push({ key, label: DAY_LABELS[d.getDay()] })
  }

  for (const attempt of attempts) {
    const date = parseStoredTimestamp(attempt.submittedAt)
    if (!date) continue
    const key = localDayKey(date)
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1)
  }

  return dayNames.map(({ key, label }) => ({ label, value: buckets.get(key) }))
}

/**
 * Compiles a single "recent activity" feed from the actual data:
 * newest students, exams and attempts, newest first.
 * Returns [{ key, text, time, type }] where `time` is a human label.
 */
export function computeRecentActivity({ students, exams, attempts }, limit = 6) {
  const items = []

  students.forEach((s) =>
    items.push({ key: `st-${s.id}`, text: `تمت إضافة الطالب "${s.name}"`, date: s.createdAt, type: 'student' })
  )
  exams.forEach((e) =>
    items.push({ key: `ex-${e.id}`, text: `تم إنشاء امتحان "${e.name}" (${e.subject})`, date: e.createdAt, type: 'exam' })
  )
  attempts.forEach((a) =>
    items.push({ key: `at-${a.id}`, text: `تقدّم "${a.studentName}" لامتحان "${a.examName}"`, date: a.submittedAt, type: 'attempt' })
  )

  const toMillis = (d) => {
    const t = parseStoredTimestamp(d)
    return t ? t.getTime() : 0
  }
  items.sort((a, b) => toMillis(b.date) - toMillis(a.date))
  return items.slice(0, limit)
}

/** Arabic "x منذ" label from a stored ISO date or datetime string. */
export function timeAgo(str) {
  const target = parseStoredTimestamp(str)
  if (!target) return '—'
  const diff = Math.max(0, Date.now() - target.getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`
}