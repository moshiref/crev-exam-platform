import { Navigate } from 'react-router-dom'
import { isTeacherAuthenticated, isStudentAuthenticated } from '../../services/auth.js'

/**
 * Role-based route guards — real redirects, not link hiding.
 *
 * Each guard checks ONLY its own role's session, so a teacher session can
 * never be mistaken for a student (or any other) session and vice versa.
 *
 * - `RequireTeacher` : only a logged-in teacher may render the children;
 *   anyone else is sent to the teacher login page.
 * - `RequireStudent` : only a logged-in student may render the children;
 *   anyone else is sent to the student login page.
 * - `BlockTeacher`   : a logged-in teacher is always sent back to their own
 *   dashboard (used only on the teacher/admin login pages, never on the
 *   student or parent portals — those must stay reachable regardless of an
 *   active teacher session).
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

export function BlockTeacher({ children }) {
  if (isTeacherAuthenticated()) {
    return <Navigate to="/teacher/dashboard" replace />
  }
  return children
}
