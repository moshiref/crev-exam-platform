import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineArrowDownTray, HiOutlineEye, HiOutlineTrash, HiOutlineChartPie } from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Modal from '../../components/ui/Modal.jsx'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useExamAttempts } from '../../hooks/useExamAttempts.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { exportExcel, percent } from '../../utils/exportUtils.js'
import { formatDateTime } from '../../utils/formatters.js'

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

/** Admin Results — platform-wide grading view plus per-exam rollup and export. */
export default function Results() {
  const {
    attempts,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    deleteAttempt,
  } = useExamAttempts()

  const detailModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)
  const [detailAttempt, setDetailAttempt] = useState(null)
  const [attemptToDelete, setAttemptToDelete] = useState(null)

  const passed = attempts.filter((a) => a.passed).length
  const passRate = attempts.length ? passed / attempts.length : 0
  const avgScore = attempts.length ? attempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / attempts.length : 0

  // Roll up per-exam summary for the manager view.
  const examRollup = useMemo(() => {
    const map = new Map()
    for (const a of attempts) {
      const key = a.examId || a.examName
      if (!map.has(key)) map.set(key, { name: a.examName, subject: a.subject, passed: 0, total: 0, sumScore: 0, sumTotal: 0 })
      const entry = map.get(key)
      entry.total += 1
      entry.sumScore += Number(a.score) || 0
      entry.sumTotal += Number(a.totalScore) || 0
      if (a.passed) entry.passed += 1
    }
    return Array.from(map.values())
  }, [attempts])

  function handleExportExcel() {
    exportExcel({
      filename: 'admin-results.xlsx',
      header: ['اسم الطالب', 'كود الطالب', 'الامتحان', 'المادة', 'الصف', 'النتيجة', 'الكلية', 'النسبة', 'الحالة', 'تاريخ التسليم'],
      rows: attempts.map((a) => [
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
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">النتائج</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة شاملة لنتائج جميع طلاب المنصة</p>
        </div>
        <Button variant="outline" icon={<HiOutlineArrowDownTray />} onClick={handleExportExcel}>
          تصدير Excel
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <SummaryTile label="إجمالي المحاولات" value={totalCount} tone="primary" />
        <SummaryTile label="ناجح" value={passed} tone="success" />
        <SummaryTile label="نسبة النجاح" value={attempts.length ? `${Math.round(passRate * 100)}%` : '—'} tone="warning" />
        <SummaryTile label="متوسط الدرجات" value={attempts.length ? avgScore.toFixed(1) : '—'} tone="secondary" />
      </div>

      {/* Per-exam rollup */}
      <DashboardCard title="ملخص النتائج حسب الامتحان" delay={0.1}>
        {/* Mobile card list */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {examRollup.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-slate-400">لا توجد نتائج بعد</p>
          ) : (
            examRollup.map((exam) => (
              <div key={exam.name} className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{exam.name}</p>
                  <p className="truncate text-xs text-slate-400">{exam.subject}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">المتقدمون</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{exam.total}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ناجح</p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-600">{exam.passed}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">متوسط النسبة</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {exam.sumTotal ? percent(exam.sumScore / exam.sumTotal, 1) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop / tablet table */}
        <div className="hidden scrollbar-thin overflow-x-auto sm:block">
          <table className="w-full min-w-[620px] border-collapse text-right">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الامتحان</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">المادة</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">المتقدمون</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">ناجح</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">متوسط النسبة</th>
              </tr>
            </thead>
            <tbody>
              {examRollup.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
                    لا توجد نتائج بعد
                  </td>
                </tr>
              ) : (
                examRollup.map((exam, index) => (
                  <motion.tr
                    key={exam.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="border-b border-slate-50 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-800">{exam.name}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{exam.subject}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-600">{exam.total}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-emerald-600">{exam.passed}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-600">
                      {exam.sumTotal ? percent(exam.sumScore / exam.sumTotal, 1) : '—'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث باسم الطالب أو الامتحان..." />
        <div className="flex items-center gap-2">
          <HiOutlineChartPie className="h-4 w-4 shrink-0 text-slate-400" />
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

      {/* Attempts table */}
      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        {attempts.length === 0 ? (
          <EmptyState
            icon={<HiOutlineChartPie />}
            title={totalCount === 0 ? 'لا توجد نتائج حتى الآن' : 'لا توجد نتائج مطابقة'}
            description={
              totalCount === 0
                ? 'بمجرد تسجيل الطلاب لامتحاناتهم، ستظهر النتائج والنسب تلقائيًا هنا.'
                : 'جرّب تعديل كلمة البحث أو الفلتر.'
            }
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {attempts.map((attempt) => (
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
                      title="عرض النتيجة"
                      onClick={() => { setDetailAttempt(attempt); detailModal.open() }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-blue-50 hover:text-primary"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      title="حذف"
                      onClick={() => { setAttemptToDelete(attempt); deleteDialog.open() }}
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
                {attempts.map((attempt, index) => (
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
                        <RowBtn title="عرض النتيجة" className="hover:bg-blue-50 hover:text-primary" onClick={() => { setDetailAttempt(attempt); detailModal.open() }}>
                          <HiOutlineEye className="h-4 w-4" />
                        </RowBtn>
                        <RowBtn title="حذف" className="hover:bg-red-50 hover:text-danger" onClick={() => { setAttemptToDelete(attempt); deleteDialog.open() }}>
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

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => attemptToDelete && deleteAttempt(attemptToDelete.id)}
        title="حذف النتيجة"
        description={attemptToDelete ? `هل أنت متأكد من حذف نتيجة "${attemptToDelete.studentName}"؟ لا يمكن التراجع عن هذا الإجراء.` : ''}
      />

      <DetailModal isOpen={detailModal.isOpen} onClose={detailModal.close} attempt={detailAttempt} />
    </div>
  )
}

function DetailModal({ isOpen, onClose, attempt }) {
  if (!attempt) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تفاصيل النتيجة" maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <div>
            <p className="font-display text-base font-extrabold text-slate-900">{attempt.studentName}</p>
            <p className="text-xs text-slate-400" dir="ltr">{attempt.studentId}</p>
          </div>
          <div className="text-left">
            <p className="font-display text-xl font-extrabold text-primary">
              {attempt.score}<span className="text-sm text-slate-400"> / {attempt.totalScore}</span>
            </p>
            <Badge tone={attempt.passed ? 'success' : 'danger'}>{attempt.passed ? 'ناجح' : 'راسب'}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-400">الامتحان</p>
            <p className="mt-1 font-bold text-slate-700">{attempt.examName}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-400">المادة / الصف</p>
            <p className="mt-1 font-bold text-slate-700">{attempt.subject} · {attempt.grade}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-400">النسبة</p>
            <p className="mt-1 font-bold text-slate-700">{attempt.totalScore ? percent(attempt.score / attempt.totalScore) : '—'}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-400">تاريخ التسليم</p>
            <p className="mt-1 font-bold text-slate-700" dir="ltr">{formatDateTime(attempt.submittedAt)}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}