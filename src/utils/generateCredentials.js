// ============================================================================
// Credential generation helpers — mock-only.
// These simulate what a Supabase function / DB trigger would eventually do:
// assign the next sequential student ID and generate one-time login
// credentials. Kept pure (no side effects) so they're easy to swap out later.
// ============================================================================

const STUDENT_ID_PREFIX = 'CREV'

/**
 * Returns the next sequential student ID given the current list of
 * students, e.g. CREV-1005 -> CREV-1006. Starts at CREV-1001 when the
 * list is empty.
 */
export function generateNextStudentId(existingStudents) {
  const numbers = existingStudents
    .map((student) => Number.parseInt(student.id.replace(`${STUDENT_ID_PREFIX}-`, ''), 10))
    .filter((n) => !Number.isNaN(n))

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001
  return `${STUDENT_ID_PREFIX}-${nextNumber}`
}

/** Random 6-digit numeric password, e.g. "483921". */
export function generateStudentPassword() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Random 4-digit numeric parent PIN, e.g. "7254". */
export function generateParentPin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}
