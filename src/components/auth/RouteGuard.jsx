import { Navigate } from 'react-router-dom'
import {
  isAdminAuthenticated,
  isTeacherAuthenticated,
  isStudentAuthenticated,
} from '../../services/auth.js'

/**
 * Role-based route guards — real redirects, not link hiding.
 *
 * Each guard checks ONLY its own role's session, so a teacher session can
 * never be mistaken for an admin (or any other) session and vice versa.
 *
 * - `RequireTeacher`  : only a logged-in teacher may render the children;
 *   anyone else is sent to the teacher login page.
 * - `RequireStudent`  : only a logged-in student may render the children;
 *   anyone else is sent to the student login page.
 * - `BlockTeacherLogin`: a logged-in teacher is sent back to the teacher
 *   dashboard (used only on the teacher login page).
 * - `BlockAdminLogin` : a logged-in admin is sent back to the admin
 *   dashboard (used only on the admin login page).
 *
 * The two login guards are fully independent: opening the admin login while
 * a teacher session exists simply shows the login form — it never redirects
 * to the teacher dashboard, and vice versa.
 */
export function RequireTeacher({ children }) {
  if (!isTeacherAuthenticated()) {
    return <Navigate to="/teacher" replace />
  }
  return children
}

export function RequireStudent({ children }) {
  if (!isStudentAuthenticated()) {
    return <Navigate to="/student" replace />
  }
  return children
}

export function BlockTeacherLogin({ children }) {
  if (isTeacherAuthenticated()) {
    return <Navigate to="/teacher/dashboard" replace />
  }
  return children
}

export function BlockAdminLogin({ children }) {
  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />
  }
  return children
}
