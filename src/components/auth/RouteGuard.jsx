import { Navigate } from 'react-router-dom'
import { isTeacherAuthenticated } from '../../services/auth.js'

/**
 * Role-based route guards — real redirects, not link hiding.
 *
 * - `RequireTeacher` : only a logged-in teacher may render the children;
 *   anyone else is sent to the teacher login page.
 * - `BlockTeacher`   : a logged-in teacher is always sent back to their own
 *   dashboard, so they can never open the student / parent / admin portals
 *   by typing a URL or navigating directly.
 */
export function RequireTeacher({ children }) {
  if (!isTeacherAuthenticated()) {
    return <Navigate to="/teacher" replace />
  }
  return children
}

export function BlockTeacher({ children }) {
  if (isTeacherAuthenticated()) {
    return <Navigate to="/teacher/dashboard" replace />
  }
  return children
}
