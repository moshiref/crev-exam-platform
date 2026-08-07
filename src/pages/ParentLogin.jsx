import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineUserGroup,
  HiOutlineIdentification,
  HiOutlineArrowLongLeft,
  HiOutlineArrowRightOnRectangle,
  HiOutlineAcademicCap,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineChartPie,
  HiOutlineTrophy,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
} from 'react-icons/hi2'
import AuthBackground from '../components/auth/AuthBackground.jsx'
import TextField from '../components/auth/TextField.jsx'
import Divider from '../components/auth/Divider.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatsCard from '../components/ui/StatsCard.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import { isSupabaseConfigured, supabase } from '../services/supabase.js'
import * as repo from '../services/repository.js'
import { useStudents } from '../hooks/useStudents.js'
import { useExams } from '../hooks/useExams.js'
import { useExamAttempts } from '../hooks/useExamAttempts.js'
import { formatDate, formatDateTime } from '../utils/formatters.js'

const SESSION_KEY = 'crev-parent-auth'

const EXAM_STATUS = {
  submitted: { tone: 'success', label: 'تم التسليم' },
  ongoing: { tone: 'warning', label: 'جارٍ الآن' },
  upcoming: { tone: 'primary', label: 'لم يبدأ' },
  ended: { tone: 'danger', label: 'منتهٍ' },
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

/** Builds a local-time Date from a calendar day "YYYY-MM-DD" + wall-clock "HH:MM". */
function localDateFromParts(dateStr, timeStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  let hh = 0
  let mm = 0
  if (timeStr) {
    const [th, tm] = timeStr.split(':').map(Number)
    hh = th || 0
    mm = tm || 0
  }
  return new Date(y, (m || 1) - 1, d || 1, hh, mm)
}

/** Derives the exam status from real data: a saved attempt, or the scheduled window. */
function examStatus(exam, attempt, now) {
  if (attempt) return 'submitted'
  const start = localDateFromParts(exam.scheduledDate, exam.startTime)
  const end = localDateFromParts(exam.scheduledDate, exam.endTime)
  if (start && end) {
    if (now < start) return 'upcoming'
    if (now <= end) return 'ongoing'
    return 'ended'
  }
  return 'upcoming'
}

function percentage(score, total) {
  return Number(total) > 0 ? Math.round((Number(score) / Number(total)) * 100) : 0
}

/**
 * Parent portal — /parent
 *
 * A parent signs in with the 4-digit PIN printed on the student card (the
 * students table's `parent_pin`). The account is bound to exactly one active
 * student, so the portal only ever reads that child's data — a Student ID is
 * never typed or editable on the page. Everything shown is derived from the
 * shared repository: exams, attempts and the child's own profile.
 */
export default function ParentLogin() {
  const navigate = useNavigate()
  const [session, setSession] = useState(readSession)

  const [pin, setPin] = useState('')
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  async function authenticate(code) {
    if (isSupabaseConfigured) {
      // The PIN check runs in a SECURITY DEFINER RPC (so the anon key never
      // reads `parent_pin` directly). Fall back to the legacy direct table
      // match only while the RPC hasn't been deployed yet.
      const { data, error } = await supabase.rpc('parent_login', { p_pin: code })
      if (!error) return data && data.length === 1 ? data[0] : null
      if (error.code === 'PGRST202' || error.code === '42883') {
        const { data: legacy } = await supabase
          .from('students')
          .select('id, name, stage, grade, status, parent_phone, parent_pin')
          .eq('parent_pin', code)
          .eq('status', 'Active')
        if (legacy && legacy.length === 1) return legacy[0]
        return null
      }
      return null
    }
    const matches = repo.listStudents().filter((s) => s.status === 'Active' && String(s.parentPin) === code)
    return matches.length === 1 ? matches[0] : null
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!pin.trim()) nextErrors.pin = 'رمز ولي الأمر مطلوب'
    else if (!/^\d{4}$/.test(pin.trim())) nextErrors.pin = 'رمز ولي الأمر يتكون من 4 أرقام'

    setErrors(nextErrors)
    setLoginError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const student = await authenticate(pin.trim())
      if (!student) {
        setLoginError('رمز ولي الأمر غير صحيح.')
        return
      }
      const payload = {
        id: student.id,
        name: student.name,
        stage: student.stage,
        grade: student.grade,
        status: student.status,
        parentPhone: student.parentPhone ?? student.parent_phone,
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
      setSession(payload)
    } finally {
      setSubmitting(false)
    }
  }

  if (session) return <ParentPortal session={session} onLogout={logout} />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-12 sm:px-8">
      <AuthBackground />

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-secondary text-4xl text-white shadow-soft-lg"
          >
            <HiOutlineUserGroup />
          </motion.div>

          <h1 className="mt-6 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            بوابة ولي الأمر
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 sm:text-base">
            سجل الدخول برمز ولي الأمر المخصص لك لمتابعة امتحانات ابنك ونتائجه.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          className="rounded-auth border border-white/60 bg-white/70 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-300 hover:shadow-soft-lg sm:p-9"
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <TextField
              id="parentPin"
              label="رمز ولي الأمر"
              icon={<HiOutlineIdentification />}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="أدخل رمز ولي الأمر — 4 أرقام"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              error={errors.pin}
            />

            {loginError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600 ring-1 ring-red-100">
                {loginError}
              </p>
            )}

            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="mt-1 w-full rounded-2xl bg-gradient-to-l from-primary to-secondary py-4 text-sm font-bold text-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {submitting ? 'جارٍ التحقق...' : 'دخول بوابة ولي الأمر'}
            </motion.button>
          </form>

          <div className="my-6">
            <Divider />
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 transition-colors duration-300 hover:border-primary hover:text-primary sm:text-base"
          >
            <HiOutlineArrowLongLeft className="h-5 w-5 rotate-180" />
            العودة للرئيسية
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7 text-center text-xs font-medium text-slate-400 sm:text-sm"
        >
          إذا لم تحصل على رمز ولي الأمر، تواصل مع إدارة السنتر.
        </motion.p>
      </div>
    </div>
  )
}

function ParentPortal({ session, onLogout }) {
  const { students: studentRoster, loading: studentsLoading } = useStudents()
  const { exams: allExams, loading: examsLoading } = useExams()
  const { attempts: allAttempts, loading: attemptsLoading } = useExamAttempts()

  const loading = studentsLoading || examsLoading || attemptsLoading
  const student = studentRoster.find((s) => s.id === session.id) || session
  const studentId = student.id
  const isActive = student.status === 'Active'

  const exams = allExams.filter(
    (e) =>
      e.status === 'Published' &&
      (!student.stage || !e.stage || e.stage === student.stage) &&
      (!student.grade || !e.grade || e.grade === student.grade)
  )
  const attempts = allAttempts.filter((a) => a.studentId === studentId)
  const attemptFor = (examId) => attempts.find((a) => a.examId === examId)
  const now = new Date()

  const sortedAttempts = [...attempts].sort((a, b) =>
    String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''))
  )
  const lastAttempt = sortedAttempts[0] || null

  const pcts = attempts.map((a) => percentage(a.score, a.totalScore))
  const solved = attempts.length
  const passedCount = attempts.filter((a) => a.passed).length
  const stats = {
    total: exams.length,
    solved,
    unsolved: Math.max(exams.length - solved, 0),
    avg: solved ? Math.round(pcts.reduce((sum, v) => sum + v, 0) / solved) : null,
    passRate: solved ? Math.round((passedCount / solved) * 100) : null,
    best: solved ? Math.max(...pcts) : null,
  }

  return (
    <MainLayout>
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-card bg-gradient-to-l from-primary to-secondary p-6 text-white shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div>
            <p className="text-xs font-bold text-blue-100">بوابة ولي الأمر</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
              أهلًا بك، ولي أمر {student.name} 👋
            </h1>
            <p className="mt-2 text-sm text-blue-100">تابع هنا كل ما يخص أداء ابنك من امتحانات ونتائج.</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 transition-colors hover:bg-white/25"
          >
            <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </motion.div>

        <div className="mt-6 flex flex-col gap-4 rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-3xl text-primary ring-1 ring-primary/10">
            <HiOutlineAcademicCap />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-400">بيانات الطالب</p>
            <h2 className="mt-0.5 font-display text-lg font-extrabold text-slate-900">{student.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span dir="ltr" className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                {student.id}
              </span>
              <Badge tone="primary">{student.stage}</Badge>
              <Badge tone="neutral">{student.grade}</Badge>
            </div>
          </div>
          <Badge tone={isActive ? 'success' : 'neutral'} className="shrink-0">
            {isActive ? 'نشط' : 'غير نشط'}
          </Badge>
        </div>

{loading ? (
          <div className="mt-10 flex items-center justify-center gap-3 rounded-card bg-card p-10 text-sm font-bold text-slate-500 ring-1 ring-slate-100">
            <HiOutlineClock className="h-5 w-5 animate-spin" />
            جارٍ تحميل بيانات ابنك...
          </div>
        ) : (
          <>
            <h2 className="mt-10 font-display text-xl font-extrabold text-slate-900">ملخص أداء الطالب</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatsCard icon={<HiOutlineClipboardDocumentList />} label="إجمالي الامتحانات" value={stats.total} tone="primary" />
              <StatsCard icon={<HiOutlineCheckCircle />} label="الامتحانات المحلولة" value={stats.solved} tone="success" />
              <StatsCard icon={<HiOutlineClock />} label="الامتحانات غير المحلولة" value={stats.unsolved} tone="warning" />
              <StatsCard icon={<HiOutlineChartPie />} label="متوسط النسبة" value={stats.avg === null ? '—' : `${stats.avg}%`} tone="secondary" />
              <StatsCard icon={<HiOutlineTrophy />} label="أعلى نسبة" value={stats.best === null ? '—' : `${stats.best}%`} tone="primary" />
              <StatsCard icon={<HiOutlineChartBar />} label="نسبة النجاح" value={stats.passRate === null ? '—' : `${stats.passRate}%`} tone="success" />
            </div>

            <div className="mt-4 flex flex-col gap-1.5 rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <p className="text-sm font-bold text-slate-500">آخر امتحان تم حله</p>
              {lastAttempt ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-extrabold text-slate-900">{lastAttempt.examName}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {lastAttempt.subject} · {lastAttempt.grade}
                  </span>
                  <span dir="ltr" className="text-xs font-bold text-slate-500">
                    {formatDateTime(lastAttempt.submittedAt)}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400">لم يقم الطالب بحل أي امتحان بعد.</p>
              )}
            </div>

            <h2 className="mt-10 font-display text-xl font-extrabold text-slate-900">امتحانات ابني</h2>
            {exams.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<HiOutlineClipboardDocumentList />}
                  title="لا توجد امتحانات"
                  description="لا توجد امتحانات منشورة تناسب مرحلة ابنك حاليًا."
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => {
                  const attempt = attemptFor(exam.id)
                  return <ExamCard key={exam.id} exam={exam} attempt={attempt} status={examStatus(exam, attempt, now)} />
                })}
              </div>
            )}

            <h2 className="mt-10 font-display text-xl font-extrabold text-slate-900">نتائج ابني</h2>
            {sortedAttempts.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<HiOutlineDocumentText />}
                  title="لا توجد نتائج بعد"
                  description="عندما يسلم ابنك أول امتحان، ستظهر نتيجته هنا مع تاريخ ووقت التسليم."
                />
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {sortedAttempts.map((attempt) => (
                  <ResultRow key={attempt.id} attempt={attempt} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </MainLayout>
  )
}

function ExamStatusBadge({ status }) {
  const meta = EXAM_STATUS[status] || EXAM_STATUS.upcoming
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

function ExamCard({ exam, attempt, status }) {
  const pct = attempt ? percentage(attempt.score, attempt.totalScore) : 0
  return (
    <div className="flex flex-col rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">{exam.name}</p>
          <p className="mt-1 text-xs text-slate-500">{exam.subject} · {exam.grade}</p>
        </div>
        <ExamStatusBadge status={status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
          <HiOutlineCalendarDays className="h-3.5 w-3.5" />
          {exam.scheduledDate ? formatDate(exam.scheduledDate) : 'بدون موعد محدد'}
        </span>
        {exam.startTime && (
          <span dir="ltr" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 font-mono ring-1 ring-slate-100">
            <HiOutlineClock className="h-3.5 w-3.5" />
            {exam.startTime} → {exam.endTime || '—'}
          </span>
        )}
      </div>

      {attempt && (
        <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3 ring-1 ring-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary">النتيجة</span>
            <span className="font-display text-lg font-extrabold text-slate-900">
              {attempt.score} <span className="text-sm font-bold text-slate-500">/ {attempt.totalScore}</span>
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs font-semibold">
            <span className={attempt.passed ? 'text-emerald-600' : 'text-danger'}>
              {attempt.passed ? 'ناجح' : 'راسب'}
            </span>
            <span className="text-slate-500">النسبة {pct}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            تم التسليم: <span dir="ltr" className="font-semibold">{formatDateTime(attempt.submittedAt)}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function ResultRow({ attempt }) {
  const pct = percentage(attempt.score, attempt.totalScore)
  return (
    <div className="flex flex-col gap-3 rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-primary">
          <HiOutlineDocumentText />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900">{attempt.examName}</p>
          <p className="text-xs text-slate-500">{attempt.subject} · {attempt.grade}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-display text-lg font-extrabold text-slate-900">
          {attempt.score} <span className="text-xs font-bold text-slate-400">/ {attempt.totalScore}</span>
        </span>
        <span className="text-xs font-bold text-slate-500">{pct}%</span>
        <Badge tone={attempt.passed ? 'success' : 'danger'}>{attempt.passed ? 'ناجح' : 'راسب'}</Badge>
        <span className="text-xs font-semibold text-slate-400">
          التسليم: <span dir="ltr" className="font-bold">{formatDateTime(attempt.submittedAt)}</span>
        </span>
      </div>
    </div>
  )
}
