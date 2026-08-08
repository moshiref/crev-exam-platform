// ============================================================================
// Authentication state helpers.
//
//  - Admin   : demo-only for now (username `admin` / password `admin123`).
//  - Teacher : REAL authentication — the credentials are validated against the
//             Supabase `teachers` table in the repository, and the matched
//             teacher record is stored here on login.
//
// Login state is kept in sessionStorage per portal so a refresh keeps you in.
// Components only call these functions, never read credentials themselves.
// ============================================================================

const DEMO_ADMIN = { username: 'admin', password: 'admin123' }

export const ADMIN_KEY = 'crev-admin-auth'
export const TEACHER_KEY = 'crev-teacher-auth'
export const STUDENT_KEY = 'crev-student-auth'
export const PARENT_KEY = 'crev-parent-auth'

/** Removes every role session from sessionStorage — a complete logout. */
export function clearAllSessions() {
  ;[ADMIN_KEY, TEACHER_KEY, STUDENT_KEY, PARENT_KEY].forEach((key) =>
    window.sessionStorage.removeItem(key)
  )
}

/**
 * Removes every role session EXCEPT `keepKey`. Used on login so an old
 * teacher/admin/parent session can never force a different role into the
 * wrong dashboard, and vice versa.
 */
export function clearOtherSessions(keepKey) {
  ;[ADMIN_KEY, TEACHER_KEY, STUDENT_KEY, PARENT_KEY].forEach((key) => {
    if (key !== keepKey) window.sessionStorage.removeItem(key)
  })
}

export function verifyAdmin(username, password) {
  return username === DEMO_ADMIN.username && password === DEMO_ADMIN.password
}

export function loginAdmin() {
  clearOtherSessions(ADMIN_KEY)
  window.sessionStorage.setItem(ADMIN_KEY, '1')
}

export function isAdminAuthenticated() {
  return window.sessionStorage.getItem(ADMIN_KEY) === '1'
}

export function logoutAdmin() {
  clearAllSessions()
}

/** Stores the authenticated teacher account in sessionStorage. */
export function loginTeacher(teacher) {
  clearOtherSessions(TEACHER_KEY)
  window.sessionStorage.setItem(TEACHER_KEY, JSON.stringify(teacher ?? {}))
}

export function isTeacherAuthenticated() {
  return Boolean(window.sessionStorage.getItem(TEACHER_KEY))
}

/** Returns the authenticated teacher account, or null when logged out. */
export function getCurrentTeacher() {
  try {
    const raw = window.sessionStorage.getItem(TEACHER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** True only when a student session exists — never affected by other roles. */
export function isStudentAuthenticated() {
  return Boolean(window.sessionStorage.getItem(STUDENT_KEY))
}

/** True only when a parent session exists — never affected by other roles. */
export function isParentAuthenticated() {
  return Boolean(window.sessionStorage.getItem(PARENT_KEY))
}

/** Logs the teacher out by removing the teacher session only. */
export function logoutTeacher() {
  window.sessionStorage.removeItem(TEACHER_KEY)
}