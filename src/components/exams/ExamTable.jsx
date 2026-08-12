import { motion } from 'framer-motion'
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineDocumentDuplicate,
  HiOutlineInboxStack,
} from 'react-icons/hi2'
import Badge from '../ui/Badge.jsx'
import { EXAM_STATUSES } from '../../data/mockData.js'
import { calcTotalScore } from '../../utils/examUtils.js'
import { formatDate } from '../../utils/formatters.js'

const ACTIONS = [
  { key: 'view', icon: HiOutlineEye, label: 'عرض', hoverClass: 'hover:bg-blue-50 hover:text-primary' },
  { key: 'edit', icon: HiOutlinePencilSquare, label: 'تعديل', hoverClass: 'hover:bg-amber-50 hover:text-amber-600' },
  { key: 'copy', icon: HiOutlineDocumentDuplicate, label: 'نسخ الامتحان', hoverClass: 'hover:bg-indigo-50 hover:text-indigo-600' },
  { key: 'delete', icon: HiOutlineTrash, label: 'حذف', hoverClass: 'hover:bg-red-50 hover:text-danger' },
]

const STATUS_TONE = { Published: 'success', Draft: 'neutral' }

/**
 * Exam roster table.
 * Columns: name, subject, stage, grade, question count, total marks,
 * duration, status, created date, actions.
 * Mobile (<sm): a stacked card list so phones never have to swipe
 * horizontally; each card surfaces the same info and actions.
 * Desktop / tablet (sm+): the full table kept horizontally scrollable
 * inside its own card on narrow widths — matching the Stripe/Linear-style
 * tables used across the dashboard.
 *
 * When `readOnly` is set (admin), the create-owning edit/copy actions are
 * hidden so the admin can only view or delete.
 */
export default function ExamTable({ exams, onAction, readOnly = false }) {
  const effectiveActions = readOnly
    ? ACTIONS.filter((a) => a.key !== 'edit' && a.key !== 'copy')
    : ACTIONS

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
          <HiOutlineInboxStack />
        </div>
        <p className="text-sm font-semibold text-slate-500">لا توجد امتحانات مطابقة لبحثك</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {exams.map((exam) => (
          <div key={exam.id} className="flex min-w-0 flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                  {exam.subject.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{exam.name}</p>
                  <p className="truncate text-xs text-slate-400">{exam.subject} · {exam.stage} · {exam.grade}</p>
                </div>
              </div>
              <Badge tone={STATUS_TONE[exam.status] ?? 'neutral'}>
                {EXAM_STATUSES[exam.status] ?? exam.status}
              </Badge>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">المدرس</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{exam.teacherName || '—'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">عدد الأسئلة</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">{exam.questions.length}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">إجمالي الدرجات</p>
                <p className="mt-0.5 text-sm font-bold text-primary">{calcTotalScore(exam.questions)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">مدة الامتحان</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800" dir="ltr">{exam.durationMinutes} دقيقة</p>
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">تاريخ الإنشاء</p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">{formatDate(exam.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {effectiveActions.map(({ key, icon: Icon, label, hoverClass }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => onAction(key, exam)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors duration-150 ${hoverClass}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden scrollbar-thin overflow-x-auto sm:block">
        <table className="w-full min-w-[1080px] border-collapse text-right">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">اسم الامتحان</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">المدرس</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">المادة</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">المرحلة</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الصف</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">عدد الأسئلة</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">إجمالي الدرجات</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">مدة الامتحان</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الحالة</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">تاريخ الإنشاء</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam, index) => (
            <motion.tr
              key={exam.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                    {exam.subject.slice(0, 1)}
                  </div>
                  <span className="text-sm font-bold text-slate-800">{exam.name}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs font-semibold text-slate-500">{exam.teacherName || '—'}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{exam.subject}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{exam.stage}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{exam.grade}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{exam.questions.length}</td>
              <td className="px-4 py-3.5 text-sm font-bold text-primary">{calcTotalScore(exam.questions)}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-600" dir="ltr">
                {exam.durationMinutes} دقيقة
              </td>
              <td className="px-4 py-3.5">
                <Badge tone={STATUS_TONE[exam.status] ?? 'neutral'}>
                  {EXAM_STATUSES[exam.status] ?? exam.status}
                </Badge>
              </td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-500">{formatDate(exam.createdAt)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
                  {effectiveActions.map(({ key, icon: Icon, label, hoverClass }) => (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      onClick={() => onAction(key, exam)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 ${hoverClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  )
}