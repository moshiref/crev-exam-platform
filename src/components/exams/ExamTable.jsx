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
 * Horizontally scrollable on narrow screens to keep column alignment —
 * matching the Stripe/Linear-style tables used across the dashboard.
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
    <div className="scrollbar-thin overflow-x-auto">
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
  )
}