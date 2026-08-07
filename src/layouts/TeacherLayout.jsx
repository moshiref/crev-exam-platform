import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineAcademicCap,
  HiOutlineChartPie,
  HiOutlineCog6Tooth,
  HiOutlineBars3,
  HiOutlineArrowRightOnRectangle,
  HiOutlineSun,
  HiOutlineMoon,
  HiXMark,
} from 'react-icons/hi2'
import Logo from '../components/layout/Logo.jsx'
import { useDisclosure } from '../hooks/useDisclosure.js'
import { useTheme } from '../hooks/useTheme.js'
import { isTeacherAuthenticated, logoutTeacher } from '../services/auth.js'
import { cn } from '../utils/cn.js'

const MENU_ITEMS = [
  { labelAr: 'الرئيسية', to: '/teacher/dashboard', icon: HiOutlineHome },
  { labelAr: 'الامتحانات', to: '/teacher/exams', icon: HiOutlineClipboardDocumentList },
  { labelAr: 'الطلاب', to: '/teacher/students', icon: HiOutlineAcademicCap },
  { labelAr: 'النتائج', to: '/teacher/results', icon: HiOutlineChartPie },
  { labelAr: 'الإعدادات', to: '/teacher/settings', icon: HiOutlineCog6Tooth },
]

const PAGE_TITLES = {
  '/teacher/dashboard': 'لوحة المدرس',
  '/teacher/exams': 'إدارة الامتحانات',
  '/teacher/students': 'الطلاب',
  '/teacher/results': 'النتائج',
  '/teacher/settings': 'الإعدادات',
}

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

function SidebarContent({ onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Logo size="sm" />
      </div>
      <nav className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {MENU_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
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
 * Persistent shell for every /teacher/* page — its own navigation model,
 * separate from the admin shell. Adds a light/dark theme toggle.
 */
export default function TeacherLayout() {
  const { isOpen, open, close } = useDisclosure(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  function handleLogout() {
    logoutTeacher()
    navigate('/')
  }

  useEffect(() => {
    if (!isTeacherAuthenticated()) {
      navigate('/teacher', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-slate-100 bg-card md:block">
        <SidebarContent onNavigate={() => {}} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
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
                  onClick={close}
                  aria-label="إغلاق القائمة"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onNavigate={close} onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-card/80 px-5 py-4 backdrop-blur-lg sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={open}
              aria-label="فتح القائمة"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            >
              <HiOutlineBars3 className="h-6 w-6" />
            </button>
            <h1 className="font-display text-lg font-extrabold text-slate-900 sm:text-xl">
              {PAGE_TITLES[location.pathname] ?? 'لوحة المدرس'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label="تبديل الوضع"
              title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
            >
              {theme === 'dark' ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
              أ
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}