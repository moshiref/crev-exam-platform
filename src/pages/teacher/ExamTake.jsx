import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlinePlay,
} from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useExams } from '../../hooks/useExams.js'
import { useStudents } from '../../hooks/useStudents.js'
import { useExamAttempts } from '../../hooks/useExamAttempts.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { gradeAttempt, calcTotalScore } from '../../utils/examUtils.js'
import { cn } from '../../utils/cn.js'

const OPTIONS_LABELS = ['أ', 'ب', 'ج', 'د']
const STORAGE_KEY = 'crev-in-progress-exam'

function formatMs(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Live exam-taking (teacher-side "simulate as student" + grading).
 * Big countdown timer, auto-save to a localStorage draft, auto-submit when
 * time expires, and a graded result with a full per-question review. The
 * attempt is recorded through the results repository.
 */
export default function ExamTake() {
  const { examId } = useParams()
  const { exams } = useExams()
  const { students } = useStudents()
  const { recordAttempt } = useExamAttempts()

  const exam = exams.find((e) => e.id === examId)

  const [studentId, setStudentId] = useState('')
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const submitDialog = useDisclosure(false)

  const activeStudent = students.find((s) => s.id === studentId) || students[0]
  const totalSeconds = useMemo(() => (exam ? Number(exam.durationMinutes || 0) * 60 : 0), [exam])
  const totalScore = exam ? calcTotalScore(exam.questions) : 0

  // Restore any in-progress draft for this exam.
  useEffect(() => {
    if (!exam || started) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft.examId === exam.id) {
          setAnswers(draft.answers || {})
          setRemaining(draft.remaining || totalSeconds)
        }
      }
    } catch {
      /* ignore corrupt drafts */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, started])

  // Countdown ticker once started.
  useEffect(() => {
    if (!started || result) return
    const id = window.setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [started, result])

  // Auto-save draft every 15s.
  useEffect(() => {
    if (!started || result) return
    const id = window.setInterval(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ examId: exam?.id, answers, remaining }))
      setSavedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }))
    }, 15000)
    return () => window.clearInterval(id)
  }, [started, result, exam, answers, remaining])

  function startExam() {
    setStudentId((prev) => prev || activeStudent?.id || '')
    setRemaining(totalSeconds)
    setStarted(true)
  }

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    if (submitting || result) return
    setSubmitting(true)

    window.localStorage.removeItem(STORAGE_KEY)

    const graded = gradeAttempt(exam, answers)
    const passScore = Number(exam.passScore) || 0
    const passed = passScore > 0 ? graded.score >= passScore : graded.score === graded.totalScore

    await recordAttempt({
      examId: exam.id,
      examName: exam.name,
      subject: exam.subject,
      grade: exam.grade,
      studentId: activeStudent?.id || '—',
      studentName: activeStudent?.name || 'طالب تجريبي',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      score: graded.score,
      totalScore: graded.totalScore,
      passScore,
      passed,
      answers: graded.answers,
    })

    setResult({ ...graded, passScore, passed, studentName: activeStudent?.name || 'طالب تجريبي' })
    setSubmitting(false)
    submitDialog.close()
  }

  // Auto-submit when the timer reaches zero.
  useEffect(() => {
    if (started && remaining === 0) handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, remaining])

  if (!exam) {
    return (
      <div className="mx-auto max-w-lg rounded-card bg-card p-10 text-center shadow-soft ring-1 ring-slate-100">
        <p className="text-sm font-bold text-slate-700">لم يتم العثور على هذا الامتحان.</p>
        <Link to="/teacher/exams" className="mt-4 inline-block text-sm font-bold text-primary">
          العودة لإدارة الامتحانات
        </Link>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== '').length

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {result ? (
        <ResultView result={result} exam={exam} />
      ) : started ? (
        <>
          <div className="sticky top-20 z-20 flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">{exam.name} · {exam.subject}</p>
              <p className="text-xs text-slate-400">
                {activeStudent?.name || 'طالب تجريبي'} · أجبت على {answeredCount}/{exam.questions.length}
                {savedAt && <span className="mr-1 text-emerald-600">· حفظ {savedAt}</span>}
              </p>
            </div>
            <div className={cn('flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-extrabold', remaining < 60 ? 'animate-pulse bg-red-50 text-danger' : 'bg-blue-50 text-primary')}>
              <HiOutlineClock className="h-5 w-5" />
              {formatMs(remaining)}
            </div>
          </div>

          {exam.instructions && (
            <div className="rounded-card bg-amber-50/70 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700 ring-1 ring-amber-100">
              📌 {exam.instructions}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {exam.questions.map((question, index) => (
              <div key={question.id} className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-sm font-bold leading-relaxed text-slate-800">{question.text}</p>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
                    {question.score} درجة
                  </span>
                </div>

                <div className="mt-4 grid gap-2">
                  {question.type === 'MCQ'
                    ? question.options.map((option, i) => {
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
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold ring-1 ring-slate-200">
                              {OPTIONS_LABELS[i]}
                            </span>
                            <span className="flex-1">{option}</span>
                            <span className={cn('flex h-5 w-5 items-center justify-center rounded-full ring-2 transition-colors', selected ? 'bg-primary ring-primary' : 'ring-slate-300')}>
                              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                            </span>
                          </label>
                        )
                      })
                    : (
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

          <div className="flex flex-col-reverse gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setAnswers({})
                setRemaining(totalSeconds)
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-danger"
            >
              <HiOutlineTrash className="h-4 w-4" />
              إعادة تعيين الإجابات
            </button>
            <Button variant="success" icon={<HiOutlineCheckCircle />} disabled={submitting} onClick={submitDialog.open}>
              {submitting ? 'جارٍ الحفظ...' : 'تسليم الامتحان'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-card bg-gradient-to-l from-primary to-secondary p-6 text-white shadow-soft sm:p-8">
            <p className="text-xs font-bold text-blue-100">{exam.subject} · {exam.grade}</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold">{exam.name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <MetaChip label={`${exam.durationMinutes} دقيقة`} icon={<HiOutlineClock className="h-4 w-4" />} />
              <MetaChip label={`${totalScore} درجة`} icon={<HiOutlineCheckCircle className="h-4 w-4" />} />
              <MetaChip label={`${exam.questions.length} سؤال`} icon={<HiOutlinePencilSquare className="h-4 w-4" />} />
            </div>
            {exam.passScore > 0 && <p className="mt-4 text-sm text-blue-100">درجة النجاح: {exam.passScore}</p>}
          </div>

          <div className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:p-6">
            <h3 className="font-display text-base font-bold text-slate-900">اختر الطالب</h3>
            <p className="mt-1 text-xs text-slate-400">سيتم حفظ النتيجة النهائية على هذا الطالب.</p>
            <div className="mt-4 max-w-md">
              <Select
                options={students.map((s) => ({ value: s.id, label: `${s.name} — ${s.id}` }))}
                value={studentId || activeStudent?.id || ''}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
          </div>

          {exam.instructions && (
            <div className="rounded-card bg-amber-50/70 p-5 ring-1 ring-amber-100">
              <p className="text-sm font-bold text-amber-700">تعليمات الامتحان</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{exam.instructions}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Link to="/teacher/exams">
              <Button variant="outline" icon={<HiOutlineArrowRight />}>
                العودة
              </Button>
            </Link>
            <Button size="lg" icon={<HiOutlinePlay className="h-4 w-4" />} onClick={startExam}>
              بدء الامتحان
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={submitDialog.isOpen}
        onClose={submitDialog.close}
        onConfirm={handleSubmit}
        title="تسليم الامتحان"
        description={`أجبت على ${answeredCount} من ${exam.questions.length} سؤال. سيتم تصحيح النتيجة وحفظها فورًا.`}
      />
    </div>
  )
}

function ResultView({ result, exam }) {
  const correctCount = result.answers.filter((a) => a.correct).length
  const pct = result.totalScore ? Math.round((result.score / result.totalScore) * 100) : 0
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className={cn('rounded-card p-6 text-center text-white shadow-soft sm:p-8', result.passed ? 'bg-gradient-to-l from-emerald-600 to-accent' : 'bg-gradient-to-l from-danger to-rose-500')}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl">
          {result.passed ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
        </div>
        <h2 className="mt-4 font-display text-2xl font-extrabold">{result.passed ? 'رائع! الطالب ناجح' : 'الطالب غير ناجح'}</h2>
        <p className="mt-1 text-sm text-white/90">{result.studentName} · {exam.name}</p>
        <p className="mt-4 font-display text-4xl font-extrabold">
          {result.score} <span className="text-lg font-bold text-white/80">/ {result.totalScore}</span>
        </p>
        <p className="mt-1 text-sm text-white/90">درجة النجاح: {result.passScore || '—'}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="الأسئلة" value={exam.questions.length} />
        <MiniStat label="الإجابات الصحيحة" value={correctCount} />
        <MiniStat label="النسبة المئوية" value={`${pct}%`} />
      </div>

      <div className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:p-6">
        <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">مراجعة الإجابات</h3>
        <div className="mt-4 flex flex-col gap-4">
          {result.answers.map((answer, index) => (
            <ReviewItem key={answer.questionId} answer={answer} index={index} />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Link to="/teacher/exams">
          <Button variant="outline" icon={<HiOutlineArrowRight />}>
            العودة للامتحانات
          </Button>
        </Link>
        <Link to={`/teacher/exams/take/${exam.id}`}>
          <Button icon={<HiOutlinePlay className="h-4 w-4" />}>إعادة الامتحان</Button>
        </Link>
      </div>
    </motion.div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-card bg-card p-4 text-center shadow-soft ring-1 ring-slate-100">
      <p className="font-display text-xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{label}</p>
    </div>
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

function ReviewItem({ answer, index }) {
  return (
    <div className={cn('rounded-xl p-4 ring-1', answer.correct ? 'bg-green-50/70 ring-emerald-100' : 'bg-red-50/70 ring-red-100')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-800">
          <span className="ml-1 text-slate-400">{index + 1}.</span>
          {answer.text}
        </p>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
          {answer.earned}/{answer.score}
        </span>
      </div>
      {answer.type === 'MCQ' ? (
        <div className="mt-3 space-y-1.5">
          {answer.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white',
                  i === answer.correctIndex && 'bg-emerald-600',
                  i === answer.selected && i !== answer.correctIndex && 'bg-red-500',
                  i !== answer.correctIndex && i !== answer.selected && 'bg-slate-200 text-slate-400'
                )}
              >
                {OPTIONS_LABELS[i]}
              </span>
              <span className={cn(
                'font-medium',
                i === answer.correctIndex && 'font-bold text-emerald-700',
                i === answer.selected && i !== answer.correctIndex && 'text-danger line-through'
              )}>
                {option}
              </span>
              {i === answer.correctIndex && <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className={cn('rounded-full px-3 py-1', answer.correctAnswer === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400')}>
            صح
          </span>
          <span className={cn('rounded-full px-3 py-1', answer.correctAnswer === false ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400')}>
            خطأ
          </span>
          {answer.selected !== null && answer.selected !== answer.correctAnswer && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-danger">إجابة الطالب خاطئة</span>
          )}
        </div>
      )}
    </div>
  )
}