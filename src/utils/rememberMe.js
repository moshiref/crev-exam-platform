// ============================================================================
// "Remember Me" helper — persists login credentials to localStorage only.
//
// Credentials are saved ONLY after a successful login and ONLY when the
// "تذكرني" checkbox is ticked. The saved data is never cleared on logout —
// logout only removes the in-memory session. Use the keys via role.
// ============================================================================

const STORAGE_KEYS = {
  student: 'crev-remember-student',
  teacher: 'crev-remember-teacher',
  parent: 'crev-remember-parent',
  admin: 'crev-remember-admin',
}

/** Returns the remembered credentials object for a role (or empty object). */
export function loadRemembered(role) {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEYS[role])) || {}
  } catch {
    return {}
  }
}

/** Persists credentials for a role after a successful, opted-in login. */
export function saveRemembered(role, data) {
  try {
    window.localStorage.setItem(STORAGE_KEYS[role], JSON.stringify(data))
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Removes the remembered credentials for a role. */
export function clearRemembered(role) {
  try {
    window.localStorage.removeItem(STORAGE_KEYS[role])
  } catch {
    /* storage unavailable — ignore */
  }
}