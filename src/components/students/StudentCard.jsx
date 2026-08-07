import { HiOutlineQrCode } from 'react-icons/hi2'
import Logo from '../layout/Logo.jsx'

/**
 * Professional printable student card — used inside the "Student
 * Created Successfully" modal and for the table's "Print Card" action.
 * Marked with `data-print-area` so the global print stylesheet
 * (see index.css) isolates just this node when printing.
 */
export default function StudentCard({ student }) {
  if (!student) return null

  return (
    <div
      data-print-area
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50/60 p-5 shadow-soft"
    >
      {/* Decorative corner accent */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-primary/10" />

      <div className="relative flex items-start justify-between">
        <Logo size="sm" />
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-primary ring-1 ring-blue-100">
          بطاقة طالب
        </span>
      </div>

      <div className="relative mt-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white">
          {student.name.slice(0, 1)}
        </div>
        <div>
          <p className="font-display text-base font-extrabold text-slate-900">{student.name}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{student.grade}</p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">كود الطالب</p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-800">{student.id}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">كلمة المرور</p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-800">{student.password}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">كود ولي الأمر (PIN)</p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-800">{student.parentPin}</p>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
        <p className="max-w-[60%] text-[10px] leading-relaxed text-slate-400">
          امسح الرمز للدخول السريع إلى بوابة الطالب
        </p>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-3xl text-slate-300">
          <HiOutlineQrCode />
        </div>
      </div>
    </div>
  )
}
