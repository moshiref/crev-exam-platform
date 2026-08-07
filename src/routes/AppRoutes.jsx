import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

/**
 * Public pages load eagerly; admin/dashboard routes are lazy-loaded so the
 * large Supabase-backed code stays out of the initial bundle (faster first
 * paint). Each lazy page renders inside a shared Suspense fallback.
 */

const Home = lazy(() => import('../pages/Home.jsx'))
const TeacherLogin = lazy(() => import('../pages/TeacherLogin.jsx'))
const StudentLogin = lazy(() => import('../pages/StudentLogin.jsx'))
const StudentDashboard = lazy(() => import('../pages/StudentDashboard.jsx'))
const StudentExamPage = lazy(() => import('../pages/StudentExamPage.jsx'))
const ParentLogin = lazy(() => import('../pages/ParentLogin.jsx'))

const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'))
const AdminLogin = lazy(() => import('../pages/AdminLogin.jsx'))
const Dashboard = lazy(() => import('../pages/admin/Dashboard.jsx'))
const Students = lazy(() => import('../pages/admin/Students.jsx'))
const Teachers = lazy(() => import('../pages/admin/Teachers.jsx'))
const Subjects = lazy(() => import('../pages/admin/Subjects.jsx'))
const Classes = lazy(() => import('../pages/admin/Classes.jsx'))
const Exams = lazy(() => import('../pages/admin/Exams.jsx'))
const Results = lazy(() => import('../pages/admin/Results.jsx'))
const Reports = lazy(() => import('../pages/admin/Reports.jsx'))
const DemoData = lazy(() => import('../pages/admin/DemoData.jsx'))
const Settings = lazy(() => import('../pages/admin/Settings.jsx'))

const TeacherLayout = lazy(() => import('../layouts/TeacherLayout.jsx'))
const TeacherHome = lazy(() => import('../pages/teacher/Home.jsx'))
const TeacherExams = lazy(() => import('../pages/teacher/Exams.jsx'))
const TeacherExamTake = lazy(() => import('../pages/teacher/ExamTake.jsx'))
const TeacherStudents = lazy(() => import('../pages/teacher/Students.jsx'))
const TeacherResults = lazy(() => import('../pages/teacher/Results.jsx'))
const TeacherSettings = lazy(() => import('../pages/teacher/Settings.jsx'))

/**
 * Central route table for the app.
 *
 * `/admin/*` is a nested route tree: `AdminLayout` renders the
 * persistent sidebar + header shell once, and each admin page renders
 * inside it via <Outlet />, instead of every page re-mounting its own
 * navigation chrome.
 */
export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher" element={<TeacherLogin />} />
        <Route path="/student" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/exam/:examId" element={<StudentExamPage />} />
        <Route path="/parent" element={<ParentLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="classes" element={<Classes />} />
          <Route path="exams" element={<Exams />} />
          <Route path="results" element={<Results />} />
          <Route path="reports" element={<Reports />} />
          <Route path="demo-data" element={<DemoData />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Teacher dashboard — its own layout, separate from /admin/* */}
        <Route element={<TeacherLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherHome />} />
          <Route path="/teacher/exams" element={<TeacherExams />} />
          <Route path="/teacher/exams/take/:examId" element={<TeacherExamTake />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/results" element={<TeacherResults />} />
          <Route path="/teacher/settings" element={<TeacherSettings />} />
        </Route>
      </Routes>
    </Suspense>
  )
}