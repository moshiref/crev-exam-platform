import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowLongLeft,
  HiOutlineHome,
  HiOutlineListBullet,
} from 'react-icons/hi2'
import AuthBackground from '../components/auth/AuthBackground.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import { useExams } from '../hooks/useExams.js'
import * as repo from '../services/repository.js'
import { notify } from '../services/notifications.js'
import { gradeAttempt, calcTotalScore } from '../utils/examUtils.js'
import { cn } from '../utils/cn.js'

const OPTIONS_LABELS = ['أ', 'ب', 'ج', 'د']

/** Formats remaining seconds as HH:MM:SS (e.g. 01:30:25). */
function formatMs(total) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Student exam-taking page — /student/exam/:examId
 *
 * The authenticated student answers the published exam's questions; on submit
 * (or time-up) the answers are graded and the attempt is saved to
 * `exam_attempts`. Correct answers are never revealed on this page.
 */
export default function StudentExamPage() {
  const { examId } = useParams()
  const { exams } = useExams()

  const current = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('crev-student-auth') || '{}')
    } catch {
      return {}
    }
  }, [])
  const studentId = current.id || ''
  const studentName = current.name || ''

  const exam = exams.find((e) => e.id === examId)

  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const [confirmMode, setConfirmMode] = useState(null) // null | 'manual' | 'timeout'
  const [autoCountdown, setAutoCountdown] = useState(30)
  const submittedRef = useRef(false)

  const totalSeconds = useMemo(() => (exam ? Number(exam.durationMinutes || 0) * 60 : 0), [exam])
  const totalScore = exam ? calcTotalScore(exam.questions) : 0

  // Countdown while the exam runs (stops when time is up).
  useEffect(() => {
    if (!started || result || timeExpired) return
    const id = window.setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [started, result, timeExpired])

  // When the timer reaches zero: hold it at 00:00, stop the countdown, and
  // open the timeout confirmation modal (no automatic silent submit yet).
  useEffect(() => {
    if (started && !result && !timeExpired && remaining === 0) {
      setTimeExpired(true)
      setConfirmMode('timeout')
    }
  }, [started, result, timeExpired, remaining])

  // Once time is up, if the student doesn't submit within 30 seconds,
  // submit automatically through the exact same handleSubmit.
  useEffect(() => {
    if (!timeExpired || result || submittedRef.current) return
    if (autoCountdown <= 0) {
      handleSubmit()
      return
    }
    const id = window.setTimeout(() => setAutoCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeExpired, result, autoCountdown])

  function startExam() {
    setRemaining(totalSeconds)
    setStarted(true)
    notify({ type: 'exam_started', text: `بدأ الطالب "${studentName || 'طالب'}" حل امتحان "${exam.name}"` })
  }

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    // Never submit twice — even if the timer keeps firing or a re-render occurs.
    if (submittedRef.current || submitting || result) return
    submittedRef.current = true
    setSubmitting(true)

    const graded = gradeAttempt(exam, answers)
    const passScore = Number(exam.passScore) || 0
    const passed = passScore > 0 ? graded.score >= passScore : graded.score === graded.totalScore

    await repo.createExamAttempt({
      examId: exam.id,
      examName: exam.name,
      subject: exam.subject,
      grade: exam.grade,
      studentId: studentId || '—',
      studentName: studentName || 'طالب',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      score: graded.score,
      totalScore: graded.totalScore,
      passScore,
      passed,
      answers: graded.answers,
    })

    setResult({ score: graded.score, totalScore: graded.totalScore, passScore, passed })
    setSubmitting(false)
    setConfirmMode(null)
  }

  if (!exam) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-12">
        <AuthBackground />
        <div className="rounded-card bg-card p-10 text-center shadow-soft ring-1 ring-slate-100">
          <p className="text-sm font-bold text-slate-700">لم يتم العثور على هذا الامتحان.</p>
          <Link to="/student/dashboard" className="mt-4 inline-block text-sm font-bold text-primary">
            العودة للوحة الطالب
          </Link>
        </div>
      </div>
    )
  }

  if (exam.questions.length === 0 && started) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-12">
        <AuthBackground />
        <div className="rounded-card bg-card p-10 text-center shadow-soft ring-1 ring-slate-100">
          <p className="text-sm font-bold text-slate-700">لا توجد أسئلة في هذا الامتحان حاليًا.</p>
          <Link to="/student/dashboard" className="mt-4 inline-block text-sm font-bold text-primary">
            العودة إلى لوحة الطالب
          </Link>
        </div>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== '').length

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <AuthBackground />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
        {result ? (
          <ResultView result={result} exam={exam} />
        ) : started ? (
          <>
            <div className="sticky top-5 z-20 flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">{exam.name} · {exam.subject}</p>
                <p className="text-xs text-slate-400">أجبت على {answeredCount}/{exam.questions.length} سؤال</p>
              </div>
              <div className={cn('flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-extrabold', remaining < 60 ? 'animate-pulse bg-red-50 text-danger' : remaining < 300 ? 'bg-red-50 text-danger' : 'bg-blue-50 text-primary')}>
                <HiOutlineClock className="h-5 w-5" />
                {formatMs(remaining)}
              </div>
            </div>

            {exam.instructions && (
              <div className="rounded-card bg-amber-50/70 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700 ring-1 ring-amber-100">
                📌 {exam.instructions}
              </div>
            )}

            {exam.questions.length === 0 && (
              <div className="rounded-card bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                لا توجد أسئلة في هذا الامتحان بعد
              </div>
            )}

            <div className="flex flex-col gap-4">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm font-bold leading-relaxed text-slate-800">{question.text}</p>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
                      {question.score} درجة
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {question.type === 'MCQ' ? (
                      question.options.map((option, i) => {
                        const selected = answers[question.id] === i
                        return (
                          <label
                            key={i}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition-colors',
                              selected ? 'bg-blue-50 text-primary ring-primary' : 'bg-slate-50/60 text-slate-600 ring-slate-100 hover:ring-slate-300'
                            )}
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              checked={selected}
                              onChange={() => setAnswer(question.id, i)}
                              className="sr-only"
                            />
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold ring-1 ring-slate-200">
                              {OPTIONS_LABELS[i]}
                            </span>
                            <span className="flex-1">{option}</span>
                            <span className={cn('flex h-5 w-5 flex-1 shrink-0 items-center justify-center rounded-full ring-2 transition-colors', selected ? 'bg-primary ring-primary' : 'ring-slate-300')}>
                              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                            </span>
                          </label>
                        )
                      })
                    ) : (
                      <div className="flex gap-3">
                        {[{ value: true, label: 'صح' }, { value: false, label: 'خطأ' }].map((choice) => (
                          <label
                            key={String(choice.value)}
                            className={cn(
                              'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-colors',
                              answers[question.id] === choice.value
                                ? 'border-primary bg-blue-50 text-primary'
                                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
                            )}
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              checked={answers[question.id] === choice.value}
                              onChange={() => setAnswer(question.id, choice.value)}
                              className="sr-only"
                            />
                            {choice.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100">
              <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
                <HiOutlineHome className="h-4 w-4" />
                <Link to="/student/dashboard">الخروج من الامتحان</Link>
              </div>
              <Button variant="success" icon={<HiOutlineCheckCircle />} disabled={submitting} onClick={() => setConfirmMode('manual')} className="ml-auto">
                {submitting ? 'جارٍ الحفظ...' : 'تسليم الامتحان'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-card bg-gradient-to-l from-primary to-secondary p-6 text-white shadow-soft sm:p-8">
              <p className="text-xs font-bold text-blue-100">{exam.subject} · {exam.stage} · {exam.grade}</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold">{exam.name}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <MetaChip label={`${exam.durationMinutes} دقيقة`} icon={<HiOutlineClock className="h-4 w-4" />} />
                <MetaChip label={`${totalScore} درجة`} icon={<HiOutlineCheckCircle className="h-4 w-4" />} />
                <MetaChip label={`${exam.questions.length} سؤال`} icon={<HiOutlineListBullet className="h-4 w-4" />} />
              </div>
              {exam.passScore > 0 && <p className="mt-4 text-sm text-blue-100">درجة النجاح: {exam.passScore}</p>}
            </div>

            {exam.instructions && (
              <div className="rounded-card bg-amber-50/70 p-5 ring-1 ring-amber-100">
                <p className="text-sm font-bold text-amber-700">تعليمات الامتحان</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{exam.instructions}</p>
              </div>
            )}

            {exam.questions.length === 0 ? (
              <div className="rounded-card bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                لا توجد أسئلة في هذا الامتحان حاليًا.
              </div>
            ) : null}

            <div className="flex justify-between">
              <Link to="/student/dashboard">
                <Button variant="outline" icon={<HiOutlineArrowLongLeft />}>
                  العودة للوحة الطالب
                </Button>
              </Link>
              <Button size="lg" icon={<HiOutlineCheckCircle className="h-4 w-4" />} onClick={startExam}>
                بدء الامتحان
              </Button>
            </div>
          </>
        )}

<SubmitConfirmModal
        mode={confirmMode}
        countdown={autoCountdown}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleSubmit}
      />
    </div>
    </div>
  )
}

/**
 * Confirmation modal shown before submitting the exam. Two modes:
 *  - 'manual'  → the student pressed "تسليم الامتحان".
 *  - 'timeout' → time ran out; auto-submit countdown is shown.
 * Keeps the answers/timer untouched; only a deliberate confirm submits.
 */
function SubmitConfirmModal({ mode, countdown, onClose, onConfirm }) {
  const isTimeout = mode === 'timeout'
  return (
    <Modal isOpen={mode !== null} onClose={onClose} title={isTimeout ? 'انتهى وقت الامتحان' : 'تأكيد تسليم الامتحان'} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl',
            isTimeout ? 'bg-red-50 text-danger' : 'bg-amber-50 text-amber-600'
          )}
        >
          <HiOutlineClock />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {isTimeout
            ? 'انتهى وقت الامتحان. هل تريد إرسال الإجابات الآن؟'
            : 'هل تريد تسليم الامتحان؟ بعد التسليم لن تتمكن من تعديل إجاباتك أو إعادة دخول الامتحان.'}
        </p>

        {isTimeout && countdown > 0 && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-danger ring-1 ring-red-100">
            سيتم الإرسال تلقائيًا خلال {countdown} ثانية
          </p>
        )}

        <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onClose}
          >
            {isTimeout ? '❌ مراجعة الإجابات' : '❌ لا، الرجوع للامتحان'}
          </Button>
          <Button
            variant={isTimeout ? 'danger' : 'success'}
            size="md"
            className="flex-1"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {isTimeout ? '✅ إرسال الامتحان الآن' : '✅ نعم، تسليم الامتحان'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ResultView({ result, exam }) {
  const pct = result.totalScore ? Math.round((result.score / result.totalScore) * 100) : 0
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 rounded-card bg-card p-8 shadow-soft ring-1 ring-slate-100">
      <div className={cn('rounded-card p-6 text-center text-white shadow-soft sm:p-8', result.passed ? 'bg-gradient-to-l from-emerald-600 to-accent' : 'bg-gradient-to-l from-danger to-rose-500')}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl">
          {result.passed ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
        </div>
        <h2 className="mt-4 font-display text-2xl font-extrabold">{result.passed ? 'رائع! لقد نجحت' : 'لم تنجح هذه المرة'}</h2>
        <p className="mt-1 text-sm text-white/90">{exam.name}</p>
        <p className="mt-4 font-display text-4xl font-extrabold">
          {result.score} <span className="text-lg font-bold text-white/80">/ {result.totalScore}</span>
        </p>
        {result.totalScore > 0 && <p className="mt-1 text-sm text-white/90">النسبة: {pct}% · درجة النجاح: {result.passScore || '—'}</p>}
      </div>

      <p className="text-center text-sm leading-relaxed text-slate-500">
        تم تسليم امتحانك بنجاح، وستعرض درجتك في نتائجك. حظًا سعيدًا في الامتحانات القادمة!
      </p>

      <div className="flex justify-center gap-3">
        <Link to="/student/dashboard">
          <Button variant="outline" icon={<HiOutlineHome />}>
            العودة للوحة الطالب
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

function MetaChip({ label, icon }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
      {icon}
      {label}
    </span>
  )
}