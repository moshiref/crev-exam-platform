import { useMemo } from 'react'
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useStudents } from '../../hooks/useStudents.js'
import { useTeachers } from '../../hooks/useTeachers.js'
import { useClasses } from '../../hooks/useClasses.js'
import { useExamAttempts } from '../../hooks/useExamAttempts.js'
import { exportExcel } from '../../utils/exportUtils.js'

const TONE_COLORS = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-amber-500', 'bg-violet-500', 'bg-rose-400']

function ProgressBar({ label, count, total, tone }) {
  const ratio = total ? count / total : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">
          {count} <span className="text-xs font-semibold text-slate-400">({total ? Math.round(ratio * 100) : 0}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${tone}`}
        />
      </div>
    </div>
  )
}

/** Admin Reports — platform-wide analytics for management decisions, exportable. */
export default function Reports() {
  const { students } = useStudents()
  const { teachers } = useTeachers()
  const { classes } = useClasses()
  const { attempts } = useExamAttempts()

  const distributionByClass = useMemo(() => {
    const map = new Map()
    for (const s of students) map.set(s.grade, (map.get(s.grade) || 0) + 1)
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }))
  }, [students])

  const attemptsBySubject = useMemo(() => {
    const map = new Map()
    for (const a of attempts) map.set(a.subject, (map.get(a.subject) || 0) + 1)
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }))
  }, [attempts])

  const classRows = distributionByClass.length ? distributionByClass : classes.map((c) => ({ label: c.name, count: c.studentsCount }))
  // Only the classes actually rendered (up to 12) are included in the total,
  // so every displayed bar's percentage is consistent with the data shown.
  const leftCol = classRows.slice(0, 6)
  const rightCol = classRows.slice(6, 12)
  const total = [...leftCol, ...rightCol].reduce((s, r) => s + r.count, 0)

  const activeTeachers = teachers.filter((t) => t.status === 'Active').length
  const passed = attempts.filter((a) => a.passed).length
  const passRate = attempts.length ? passed / attempts.length : 0
  const activeStudents = students.filter((s) => s.status === 'Active').length

  const hasData = students.length + teachers.length + attempts.length > 0

  const KPI = [
    { label: 'إجمالي الطلاب', value: students.length, tone: 'text-primary' },
    { label: 'طلاب نشطون', value: activeStudents, tone: 'text-emerald-600' },
    { label: 'مدرسون نشطون', value: activeTeachers, tone: 'text-indigo-600' },
    { label: 'نسبة النجاح', value: attempts.length ? `${Math.round(passRate * 100)}%` : '—', tone: 'text-amber-600' },
  ]

  function handleExportExcel() {
    exportExcel({
      filename: 'report.xlsx',
      header: ['الفئة', 'العدد'],
      rows: classRows.map((r) => [r.label, r.count]),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">التقارير</h2>
          <p className="mt-1 text-sm text-slate-500">تحليلات شاملة لتقييم أداء المنصة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<HiOutlineArrowDownTray />} onClick={handleExportExcel}>
            تصدير Excel
          </Button>
          <Button variant="success" icon={<HiOutlinePrinter />} onClick={() => window.print()}>
            طباعة التقرير
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {KPI.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100"
          >
            <p className={`font-display text-2xl font-extrabold ${kpi.tone}`}>{kpi.value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {!hasData && (
        <EmptyState
          title="لا توجد بيانات لإنشاء التقارير"
          description="بمجرد إضافة الطلاب والمدرسين وتسجيل النتائج، ستظهر هنا التحليلات والتوزيعات تلقائيًا."
        />
      )}

      {/* Distribution bars */}
      <DashboardCard title="توزيع الطلاب حسب الصفوف" delay={0.1}>
        {classRows.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-slate-400">لا توجد بيانات لعرضها</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              {leftCol.map((row, i) => (
                <ProgressBar key={`L-${row.label}`} label={row.label} count={row.count} total={total} tone={TONE_COLORS[i % TONE_COLORS.length]} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {rightCol.map((row, i) => (
                <ProgressBar key={`R-${row.label}`} label={row.label} count={row.count} total={total} tone={TONE_COLORS[(i + 6) % TONE_COLORS.length]} />
              ))}
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Subject activity + exams */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard title="حجم الامتحانات حسب المادة" delay={0.15}>
          {attemptsBySubject.length === 0 ? (
            <p className="py-6 text-center text-sm font-semibold text-slate-400">لا توجد بيانات</p>
          ) : (
            <ul className="space-y-3">
              {attemptsBySubject.map((row, i) => (
                <li key={row.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${TONE_COLORS[i % TONE_COLORS.length]}`} />
                    <span className="text-sm font-semibold text-slate-600">{row.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="أداء الامتحانات" delay={0.18}>
          <div className="flex flex-col gap-4">
            <ProgressBar label="ناجح" count={passed} total={attempts.length} tone="bg-emerald-500" />
            <ProgressBar label="راسب" count={attempts.length - passed} total={attempts.length} tone="bg-rose-400" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-50 pt-4">
            <Badge tone="success">{passed} ناجح</Badge>
            <Badge tone="danger">{attempts.length - passed} راسب</Badge>
            <Badge tone="warning">نسبة النجاح {attempts.length ? Math.round(passRate * 100) : 0}%</Badge>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}