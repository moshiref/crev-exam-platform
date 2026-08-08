import { motion } from 'framer-motion'
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePrinter,
  HiOutlineInboxStack,
} from 'react-icons/hi2'
import Badge from '../ui/Badge.jsx'

const ACTIONS = [
  { key: 'view', icon: HiOutlineEye, label: 'عرض', hoverClass: 'hover:bg-blue-50 hover:text-primary' },
  { key: 'edit', icon: HiOutlinePencilSquare, label: 'تعديل', hoverClass: 'hover:bg-amber-50 hover:text-amber-600' },
  { key: 'print', icon: HiOutlinePrinter, label: 'طباعة البطاقة', hoverClass: 'hover:bg-emerald-50 hover:text-emerald-600' },
  { key: 'delete', icon: HiOutlineTrash, label: 'حذف', hoverClass: 'hover:bg-red-50 hover:text-danger' },
]

function StudentStatusBadge({ status }) {
  return (
    <Badge tone={status === 'Active' ? 'success' : 'neutral'}>
      {status === 'Active' ? 'نشط' : 'غير نشط'}
    </Badge>
  )
}

/**
 * Student roster.
 * Desktop / tablet (sm+): a full table kept horizontally scrollable
 * inside its own card on narrow widths — matching Stripe/Linear-style
 * tables and keeping column alignment intact.
 * Mobile (<sm): a stacked card list so phones never have to swipe
 * horizontally; each row surfaces the same info and actions.
 */
export default function StudentTable({ students, onAction }) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
          <HiOutlineInboxStack />
        </div>
        <p className="text-sm font-semibold text-slate-500">لا يوجد طلاب مطابقون لبحثك</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {students.map((student) => (
          <div key={student.id} className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                  {student.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{student.name}</p>
                  <p className="truncate font-mono text-xs font-semibold text-slate-500" dir="ltr">{student.id}</p>
                </div>
              </div>
              <StudentStatusBadge status={student.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">الصف الدراسي</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{student.grade}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">هاتف ولي الأمر</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-800" dir="ltr">{student.parentPhone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ACTIONS.map(({ key, icon: Icon, label, hoverClass }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => onAction(key, student)}
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
        <table className="w-full min-w-[820px] border-collapse text-right">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">اسم الطالب</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">كود الطالب</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الصف الدراسي</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">هاتف ولي الأمر</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الحالة</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                      {student.name.slice(0, 1)}
                    </div>
                    <span className="text-sm font-bold text-slate-800">{student.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-sm font-semibold text-slate-500">{student.id}</span>
                </td>
                <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{student.grade}</td>
                <td className="px-4 py-3.5 text-sm font-medium text-slate-600" dir="ltr">
                  {student.parentPhone}
                </td>
                <td className="px-4 py-3.5">
                  <StudentStatusBadge status={student.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    {ACTIONS.map(({ key, icon: Icon, label, hoverClass }) => (
                      <button
                        key={key}
                        type="button"
                        title={label}
                        onClick={() => onAction(key, student)}
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
