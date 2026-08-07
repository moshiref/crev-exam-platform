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

const ADMIN_KEY = 'crev-admin-auth'
const TEACHER_KEY = 'crev-teacher-auth'

export function verifyAdmin(username, password) {
  return username === DEMO_ADMIN.username && password === DEMO_ADMIN.password
}

export function loginAdmin() {
  window.sessionStorage.setItem(ADMIN_KEY, '1')
}

export function isAdminAuthenticated() {
  return window.sessionStorage.getItem(ADMIN_KEY) === '1'
}

export function logoutAdmin() {
  window.sessionStorage.removeItem(ADMIN_KEY)
}

/** Stores the authenticated teacher account in sessionStorage. */
export function loginTeacher(teacher) {
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

export function logoutTeacher() {
  window.sessionStorage.removeItem(TEACHER_KEY)
}