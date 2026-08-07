import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChartPie,
  HiOutlineDocumentChartBar,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiXMark,
} from 'react-icons/hi2'
import { PiChalkboardTeacherDuotone, PiCrownDuotone } from 'react-icons/pi'
import Logo from './Logo.jsx'
import { cn } from '../../utils/cn.js'

// Sidebar menu grouped by area. Order here is the order rendered and drives
// both the desktop rail and the mobile drawer.
const NAV_GROUPS = [
  {
    label: 'الرئيسية',
    items: [{ labelAr: 'لوحة التحكم', to: '/admin/dashboard', icon: HiOutlineHome }],
  },
  {
    label: 'الإدارة',
    items: [
      { labelAr: 'الطلاب', to: '/admin/students', icon: HiOutlineAcademicCap },
      { labelAr: 'المدرسون', to: '/admin/teachers', icon: PiChalkboardTeacherDuotone },
      { labelAr: 'المواد الدراسية', to: '/admin/subjects', icon: HiOutlineBookOpen },
      { labelAr: 'الصفوف', to: '/admin/classes', icon: HiOutlineSquares2X2 },
    ],
  },
  {
    label: 'الامتحانات والنتائج',
    items: [
      { labelAr: 'الامتحانات', to: '/admin/exams', icon: HiOutlineClipboardDocumentList },
      { labelAr: 'النتائج', to: '/admin/results', icon: HiOutlineChartPie },
      { labelAr: 'التقارير', to: '/admin/reports', icon: HiOutlineDocumentChartBar },
    ],
  },
  {
    label: 'النظام',
    items: [
      { labelAr: 'البيانات التجريبية', to: '/admin/demo-data', icon: HiOutlineSparkles },
      { labelAr: 'الإعدادات', to: '/admin/settings', icon: HiOutlineCog6Tooth },
    ],
  },
]

function NavItem({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200',
          isActive
            ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-soft'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.labelAr}</span>
    </NavLink>
  )
}

/** Shared sidebar contents — reused by both the desktop rail and the mobile drawer. */
function SidebarContent({ onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Logo size="sm" />
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-blue-50/70 px-3 py-2.5 ring-1 ring-blue-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-base text-white">
            <PiCrownDuotone />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-slate-800">حساب الإدارة</p>
            <p className="truncate text-[11px] font-semibold text-slate-400">admin</p>
          </div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-danger transition-colors duration-200 hover:bg-red-50"
        >
          <HiOutlineArrowRightOnRectangle className="h-5 w-5 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  )
}

/**
 * Premium admin sidebar.
 * Desktop: fixed rail, always visible (md and up).
 * Mobile: off-canvas drawer controlled by `isOpen` / `onClose`.
 */
export default function Sidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-slate-100 bg-card md:block">
        <SidebarContent onNavigate={() => {}} onLogout={onLogout} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-72 max-w-[80vw] bg-card shadow-glass md:hidden"
            >
              <div className="flex items-center justify-end px-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق القائمة"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onNavigate={onClose} onLogout={onLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}