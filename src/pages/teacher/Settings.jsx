import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineSun, HiOutlineMoon, HiOutlineUserCircle } from 'react-icons/hi2'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useTheme } from '../../hooks/useTheme.js'
import { getCurrentTeacher } from '../../services/auth.js'
import { getTeacherById, getTeacherPermissions } from '../../services/repository.js'

export default function Settings() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  const sessionTeacher = getCurrentTeacher()
  const [teacher, setTeacher] = useState(sessionTeacher)

  // The admin is the single source of truth for permissions. Always pull the
  // latest profile from the DB so Account Data reflects exactly what the admin
  // saved (the session can be stale). Falls back to the session while loading.
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!sessionTeacher?.id) return
      const fetched = await getTeacherById(sessionTeacher.id)
      if (active && fetched) setTeacher(fetched)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const perms = getTeacherPermissions(teacher)
  const subject = perms.subject || '—'
  const stages = perms.stages.join('، ') || '—'
  const grades = perms.grades
  const phone = teacher?.phone || '—'
  const teacherId = teacher?.id || '—'
  const status = teacher?.status === 'Inactive' ? 'غير نشط' : 'نشط'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">الإعدادات</h2>
        <p className="mt-1 text-sm text-slate-500">إعدادات الحساب والمظهر للوحة المدرس.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard title="مظهر الواجهة" delay={0.05}>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-primary">
                {dark ? <HiOutlineMoon /> : <HiOutlineSun />}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">{dark ? 'الوضع الداكن' : 'الوضع الفاتح'}</p>
                <p className="text-xs text-slate-400">فعّل للراحة البصرية عند العمل مساءً</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggle}
              role="switch"
              aria-checked={dark}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-slate-300'}`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
                style={{ right: dark ? '0.25rem' : '1.5rem' }}
              />
            </button>
          </div>
        </DashboardCard>

        <DashboardCard title="بيانات الحساب" delay={0.1}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl text-white">
              <HiOutlineUserCircle />
            </div>
            <div>
              <p className="font-display text-base font-extrabold text-slate-900">{teacher?.name || '—'}</p>
              <p className="text-xs text-slate-400">{subject} · كود {teacherId}</p>
              <Badge tone={teacher?.status === 'Inactive' ? 'neutral' : 'success'}>{status}</Badge>
            </div>
          </div>
          <dl className="mt-5 divide-y divide-slate-100">
            <Row label="المادة" value={subject} />
            <Row label="المراحل المسموحة" value={stages} />
            <Row label="الصفوف المسموحة">
              {grades.length ? grades.map((grade) => <div key={grade}>{grade}</div>) : '—'}
            </Row>
            <Row label="رقم الهاتف" value={phone} ltr />
          </dl>
        </DashboardCard>
      </div>
    </div>
  )
}

function Row({ label, value, ltr, children }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm font-bold text-slate-800" dir={ltr ? 'ltr' : 'rtl'}>{children ?? value}</dd>
    </div>
  )
}
