import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar.jsx'
import Header from '../components/layout/Header.jsx'
import { useDisclosure } from '../hooks/useDisclosure.js'
import { isAdminAuthenticated, isTeacherAuthenticated, logoutAdmin } from '../services/auth.js'

// Maps each admin route to the title shown in the Header.
const PAGE_TITLES = {
  '/admin/dashboard': 'لوحة التحكم',
  '/admin/students': 'الطلاب',
  '/admin/teachers': 'المدرسون',
  '/admin/subjects': 'المواد الدراسية',
  '/admin/classes': 'إدارة الصفوف',
  '/admin/exams': 'الامتحانات',
  '/admin/results': 'النتائج',
  '/admin/reports': 'التقارير',
  '/admin/demo-data': 'البيانات التجريبية',
  '/admin/settings': 'الإعدادات',
}

/**
 * Persistent shell for every /admin/* page: sidebar (desktop rail /
 * mobile drawer) + header + routed page content via <Outlet />.
 * Kept separate from the public `MainLayout` since the dashboard has
 * an entirely different navigation model (app shell vs. marketing nav).
 */
export default function AdminLayout() {
  const { isOpen, open, close } = useDisclosure(false)
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logoutAdmin()
    navigate('/')
  }

  useEffect(() => {
    // A teacher account is confined to the teacher dashboard — even typing
    // an /admin/* URL just sends them back to their own dashboard.
    if (isTeacherAuthenticated()) {
      navigate('/teacher/dashboard', { replace: true })
    } else if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar isOpen={isOpen} onClose={close} onLogout={handleLogout} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header title={PAGE_TITLES[location.pathname] ?? 'لوحة التحكم'} onMenuClick={open} />
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
