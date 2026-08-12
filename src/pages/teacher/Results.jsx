import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineFunnel, HiOutlineArrowDownTray, HiOutlinePrinter, HiOutlineEye, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useExamAttempts } from '../../hooks/useExamAttempts.js'
import { useExams } from '../../hooks/useExams.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { useToast } from '../../components/teacher/Toast.jsx'
import { getCurrentTeacher } from '../../services/auth.js'
import { exportExcel, percent } from '../../utils/exportUtils.js'
import { formatDateTime } from '../../utils/formatters.js'
import { cn } from '../../utils/cn.js'

const OPTIONS_LABELS = ['أ', 'ب', 'ج', 'د']

export default function Results() {
  const {
    attempts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    deleteAttempt,
  } = useExamAttempts()
  const toast = useToast()

  const currentTeacher = getCurrentTeacher()
  const { exams } = useExams({ ownerId: currentTeacher?.id, ownerSubject: currentTeacher?.subject })
  const myExamIds = new Set(exams.map((e) => e.id))
  const myAttempts = attempts.filter((a) => myExamIds.has(a.examId))

  const detailModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)
  const [detailAttempt, setDetailAttempt] = useState(null)
  const [attemptToDelete, setAttemptToDelete] = useState(null)
  const [pdfOpen, setPdfOpen] = useState(false)

  const passed = myAttempts.filter((a) => a.passed).length
  const passRate = myAttempts.length ? passed / myAttempts.length : 0
  const avgScore = myAttempts.length ? myAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / myAttempts.length : 0

  useEffect(() => {
    if (!pdfOpen) return
    const timer = setTimeout(() => window.print(), 150)
    return () => {
      clearTimeout(timer)
      setPdfOpen(false)
    }
  }, [pdfOpen])

  function handleAction(action, attempt) {
    if (action === 'view') {
      setDetailAttempt(attempt)
      detailModal.open()
    } else {
      setAttemptToDelete(attempt)
      deleteDialog.open()
    }
  }

  function handleExportExcel() {
    exportExcel({
      filename: 'results.xlsx',
      header: ['اسم الطالب', 'كود الطالب', 'الامتحان', 'المادة', 'الصف', 'النتيجة', 'الكلية', 'النسبة', 'الحالة', 'تاريخ التسليم'],
      rows: myAttempts.map((a) => [
        a.studentName,
        a.studentId,
        a.examName,
        a.subject,
        a.grade,
        a.score,
        a.totalScore,
        a.totalScore ? percent(a.score / a.totalScore, 1) : '—',
        a.passed ? 'ناجح' : 'راسب',
        formatDateTime(a.submittedAt),
      ]),
    })
    toast('تم تصدير النتائج', 'success')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">النتائج</h2>
          <p className="mt-1 text-sm text-slate-500">{myAttempts.length} نتيجة سُجلت على امتحاناتك</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none" icon={<HiOutlineArrowDownTray />} onClick={handleExportExcel}>
            تصدير Excel
          </Button>
          <Button variant="success" className="flex-1 sm:flex-none" icon={<HiOutlinePrinter />} onClick={() => setPdfOpen(true)}>
            PDF / طباعة
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <SummaryTile label="إجمالي المحاولات" value={myAttempts.length} tone="primary" />
        <SummaryTile label="ناجح" value={passed} tone="success" />
        <SummaryTile label="نسبة النجاح" value={myAttempts.length ? `${Math.round(passRate * 100)}%` : '—'} tone="warning" />
        <SummaryTile label="متوسط الدرجات" value={myAttempts.length ? avgScore.toFixed(1) : '—'} tone="secondary" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث باسم الطالب أو الامتحان..." />
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="h-4 w-4 shrink-0 text-slate-400" />
          <Select
            options={[
              { value: 'All', label: 'كل النتائج' },
              { value: 'Passed', label: 'ناجح' },
              { value: 'Failed', label: 'راسب' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:w-40 sm:flex-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        {myAttempts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-semibold text-slate-500">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {myAttempts.map((attempt) => (
                <div key={attempt.id} className="flex min-w-0 flex-col gap-3 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                        {attempt.studentName.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{attempt.studentName}</p>
                        <p className="truncate font-mono text-xs text-slate-400" dir="ltr">{attempt.studentId}</p>
                      </div>
                    </div>
                    <Badge tone={attempt.passed ? 'success' : 'danger'}>
                      {attempt.passed ? 'ناجح' : 'راسب'}
                    </Badge>
                  </div>

                  <div className="rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
                    <p className="truncate text-sm font-bold text-slate-800">{attempt.examName}</p>
                    <p className="truncate text-xs text-slate-400">{attempt.subject} · {attempt.grade}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">النتيجة</p>
                      <p className="mt-0.5 text-sm font-bold text-primary">
                        {attempt.score}<span className="text-slate-400"> / {attempt.totalScore}</span>
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">النسبة</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">{attempt.totalScore ? percent(attempt.score / attempt.totalScore) : '—'}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">تاريخ التسليم</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800" dir="ltr">{formatDateTime(attempt.submittedAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="تفاصيل الإجابات"
                      onClick={() => handleAction('view', attempt)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-blue-50 hover:text-primary"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      title="حذف"
                      onClick={() => handleAction('delete', attempt)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-danger"
                    >
                      <HiOutlineTrash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden scrollbar-thin overflow-x-auto sm:block">
              <table className="w-full min-w-[860px] border-collapse text-right">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الطالب</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الامتحان</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">النتيجة</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">النسبة</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الحالة</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">تاريخ التسليم</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {myAttempts.map((attempt, index) => (
                  <motion.tr
                    key={attempt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                          {attempt.studentName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{attempt.studentName}</p>
                          <p className="font-mono text-xs text-slate-400" dir="ltr">{attempt.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-slate-700">{attempt.examName}</p>
                      <p className="text-xs text-slate-400">{attempt.subject} · {attempt.grade}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-primary">
                      {attempt.score}<span className="text-slate-400"> / {attempt.totalScore}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-600">
                      {attempt.totalScore ? percent(attempt.score / attempt.totalScore) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={attempt.passed ? 'success' : 'danger'}>
                        {attempt.passed ? 'ناجح' : 'راسب'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-500" dir="ltr">{formatDateTime(attempt.submittedAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <RowBtn title="تفاصيل الإجابات" className="hover:bg-blue-50 hover:text-primary" onClick={() => handleAction('view', attempt)}>
                          <HiOutlineEye className="h-4 w-4" />
                        </RowBtn>
                        <RowBtn title="حذف" className="hover:bg-red-50 hover:text-danger" onClick={() => handleAction('delete', attempt)}>
                          <HiOutlineTrash className="h-4 w-4" />
                        </RowBtn>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      <AttemptDetailModal isOpen={detailModal.isOpen} onClose={detailModal.close} attempt={detailAttempt} />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => {
          if (attemptToDelete) {
            deleteAttempt(attemptToDelete.id)
            toast('تم حذف النتيجة', 'info')
          }
        }}
        title="حذف النتيجة"
        description={attemptToDelete ? `هل أنت متأكد من حذف نتيجة "${attemptToDelete.studentName}"؟ لا يمكن التراجع عن هذا الإجراء.` : ''}
      />

      {/* Printable PDF result (mounted only while printing) */}
      {pdfOpen && (
        <div className="fixed -left-[9999px] top-0">
          <ResultsPrintList attempts={myAttempts} />
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value, tone }) {
  const tones = {
    primary: 'bg-blue-50 text-primary',
    success: 'bg-green-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    secondary: 'bg-indigo-50 text-indigo-600',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100"
    >
      <p className={`inline-flex h-10 min-w-10 items-center justify-center rounded-2xl px-2 text-lg ${tones[tone]}`}>{value}</p>
      <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
    </motion.div>
  )
}

function RowBtn({ title, className, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 ${className}`}
    >
      {children}
    </button>
  )
}

function AttemptDetailModal({ isOpen, onClose, attempt }) {
  if (!attempt) return null
  const correctCount = attempt.answers.filter((a) => a.correct).length
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تفاصيل إجابات الطالب" maxWidth="max-w-3xl">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div>
            <p className="font-display text-base font-extrabold text-slate-900">{attempt.studentName}</p>
            <p className="text-xs text-slate-400" dir="ltr">{attempt.studentId} · {attempt.examName}</p>
          </div>
          <div className="text-left">
            <p className="font-display text-xl font-extrabold text-primary">
              {attempt.score}<span className="text-sm text-slate-400"> / {attempt.totalScore}</span>
            </p>
            <Badge tone={attempt.passed ? 'success' : 'danger'}>{attempt.passed ? 'ناجح' : 'راسب'}</Badge>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400">عدد الإجابات الصحيحة: {correctCount} من {attempt.answers.length}</p>

        <div className="flex flex-col gap-4">
          {attempt.answers.map((answer, index) => (
            <div key={answer.questionId || index} className={cn('rounded-xl p-4 ring-1', answer.correct ? 'bg-green-50/70 ring-emerald-100' : 'bg-red-50/70 ring-red-100')}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-slate-800">
                  <span className="ml-1 text-slate-400">{index + 1}.</span>{answer.text}
                </p>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
                  {answer.earned}/{answer.score}
                </span>
              </div>
              {answer.type === 'MCQ' ? (
                <div className="mt-3 space-y-1.5">
                  {answer.options.map((option, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white',
                        i === answer.correctIndex && 'bg-emerald-600',
                        i === answer.selected && i !== answer.correctIndex && 'bg-red-500',
                        i !== answer.correctIndex && i !== answer.selected && 'bg-slate-200 text-slate-400'
                      )}>
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
                  <span className={cn('rounded-full px-3 py-1', answer.correctAnswer === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400')}>صح</span>
                  <span className={cn('rounded-full px-3 py-1', answer.correctAnswer === false ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400')}>خطأ</span>
                  {answer.selected !== null && answer.selected !== answer.correctAnswer && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-danger">إجابة الطالب خاطئة</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

function ResultsPrintList({ attempts }) {
  return (
    <div data-print-area className="bg-white p-6">
      <h2 className="mb-4 font-display text-xl font-extrabold">تقرير نتائج الامتحانات</h2>
      <table className="w-full border-collapse text-right text-xs">
        <thead>
          <tr className="border-b-2 border-slate-300">
            <th className="px-2 py-2">الطالب</th>
            <th className="px-2 py-2">الامتحان</th>
            <th className="px-2 py-2">النتيجة</th>
            <th className="px-2 py-2">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-b border-slate-200">
              <td className="px-2 py-1.5">{a.studentName}</td>
              <td className="px-2 py-1.5">{a.examName}</td>
              <td className="px-2 py-1.5">{a.score} / {a.totalScore}</td>
              <td className="px-2 py-1.5">{a.passed ? 'ناجح' : 'راسب'}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
  )
}