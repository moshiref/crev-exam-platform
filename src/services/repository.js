// ============================================================================
// Data repository — the single seam between the UI and where data lives.
//
// Reads/writes go through this module only. Two backends are supported:
//
//   1. Supabase  — used automatically when VITE_SUPABASE_URL and
//                  VITE_SUPABASE_ANON_KEY are set in `.env`.
//   2. In-memory — an empty cache used until real credentials exist (or while
//                  running the built-in demo). Everything is written through
//                  the repository's CRUD / demo loader.
//
// The cache is always kept in sync (optimistic UI) and, when Supabase is
// live, every mutation is mirrored to the database. Components never talk
// to Supabase directly — they call these functions, so switching backends
// never touches the UI layer.
// ============================================================================

import { isSupabaseConfigured, supabase } from './supabase.js'
import { isAdminAuthenticated, getCurrentTeacher } from './auth.js'
import { createDemoDataset } from '../data/demoData.js'
import { generateNextExamId } from '../utils/examUtils.js'
import {
  generateNextStudentId,
  generateParentPin,
  generateStudentPassword,
} from '../utils/generateCredentials.js'
import { notify, clearAll as clearNotifications } from './notifications.js'

// Deep clone that survives older engines (structuredClone is used when
// available, JSON round-trip as a safe fallback).
function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

// ---------------------------------------------------------------------------
// Row mappers (DB snake_case <-> app camelCase)
// ---------------------------------------------------------------------------

const TABLE = {
  students: 'students',
  teachers: 'teachers',
  subjects: 'subjects',
  exams: 'exams',
  attempts: 'exam_attempts',
  classes: 'classes',
}

const rowToStudent = (row) => ({
  id: row.id,
  name: row.name,
  stage: row.stage,
  grade: row.grade,
  parentPhone: row.parent_phone,
  status: row.status,
  password: row.password,
  parentPin: row.parent_pin,
  createdAt: row.created_at,
})

const studentToRow = (student) => ({
  id: student.id,
  name: student.name,
  stage: student.stage,
  grade: student.grade,
  parent_phone: student.parentPhone,
  status: student.status,
  password: student.password,
  parent_pin: student.parentPin,
  created_at: student.createdAt,
})

const rowToExam = (row) => ({
  id: row.id,
  name: row.name,
  subject: row.subject,
  stage: row.stage,
  grade: row.grade,
  durationMinutes: row.duration_minutes,
  status: row.status,
  createdAt: row.created_at,
  teacherId: row.teacher_id ?? null,
  teacherName: row.teacher_name ?? null,
  questions: row.questions ?? [],
  scheduledDate: row.scheduled_date ?? '',
  startTime: row.start_time ?? '',
  endTime: row.end_time ?? '',
  instructions: row.instructions ?? '',
  passScore: row.pass_score ?? 0,
  archived: row.archived ?? false,
})

const rowToSubject = (row) => ({
  id: row.id,
  name: row.name,
  teachersCount: row.teachers_count ?? 0,
  examsCount: row.exams_count ?? 0,
})

const subjectToRow = (subject) => ({
  id: subject.id,
  name: subject.name,
  teachers_count: subject.teachersCount ?? 0,
  exams_count: subject.examsCount ?? 0,
})

const rowToClass = (row) => ({
  id: row.id,
  stage: row.stage,
  name: row.name,
  studentsCount: row.students_count ?? 0,
  examsCount: row.exams_count ?? 0,
})

// The live `classes` table only stores `name` (`id` is a DB-generated UUID,
// so it cannot be supplied by the app — there is no stage/count column).
const classToRow = (cls) => ({ name: cls.name })

const examToRow = (exam) => ({
  id: exam.id,
  name: exam.name,
  subject: exam.subject,
  stage: exam.stage,
  grade: exam.grade,
  duration_minutes: exam.durationMinutes,
  status: exam.status,
  created_at: exam.createdAt,
  teacher_id: exam.teacherId || '',
  teacher_name: exam.teacherName || '',
  questions: exam.questions ?? [],
  scheduled_date: exam.scheduledDate || null,
  start_time: exam.startTime || null,
  end_time: exam.endTime || null,
  instructions: exam.instructions ?? '',
  pass_score: exam.passScore ?? 0,
  archived: exam.archived ?? false,
})

const rowToAttempt = (row) => ({
  id: row.id,
  examId: row.exam_id,
  examName: row.exam_name,
  subject: row.subject,
  grade: row.grade,
  studentId: row.student_id,
  studentName: row.student_name,
  submittedAt: row.submitted_at,
  score: row.score,
  totalScore: row.total_score,
  passScore: row.pass_score,
  passed: row.passed,
  answers: row.answers ?? [],
})

const attemptToRow = (attempt) => ({
  id: attempt.id,
  exam_id: attempt.examId,
  exam_name: attempt.examName,
  subject: attempt.subject,
  grade: attempt.grade,
  student_id: attempt.studentId,
  student_name: attempt.studentName,
  submitted_at: attempt.submittedAt,
  score: attempt.score,
  total_score: attempt.totalScore,
  pass_score: attempt.passScore,
  passed: attempt.passed,
  answers: attempt.answers ?? [],
})

// ---------------------------------------------------------------------------
// In-memory cache (starts empty — data is added via CRUD or the demo loader)
// ---------------------------------------------------------------------------

const cache = {
  students: [],
  teachers: [],
  subjects: [],
  exams: [],
  attempts: [],
  classes: [],
}

const live = () => isSupabaseConfigured

// ---------------------------------------------------------------------------
// Cache change notifications — lets the UI react to data changes without a
// page refresh. Every mutation calls `touchCache()`, which:
//   1. emits to in-page subscribers (same-tab components update instantly),
//   2. mirrors the cache to localStorage so OTHER tabs of the same browser
//      pick up the change via the `storage` event and re-render too.
// ---------------------------------------------------------------------------

const CACHE_STORAGE_PREFIX = 'crev-cache:'
const cacheListeners = new Set()

/** Subscribes to repository cache changes. Returns an unsubscribe function. */
export function subscribeToCache(listener) {
  cacheListeners.add(listener)
  return () => cacheListeners.delete(listener)
}

function emitCacheChange() {
  for (const listener of cacheListeners) {
    try {
      listener()
    } catch {
      /* a broken listener must never break the data layer */
    }
  }
}

function persistCache() {
  try {
    for (const key of Object.keys(cache)) {
      window.localStorage.setItem(CACHE_STORAGE_PREFIX + key, JSON.stringify(cache[key]))
    }
  } catch {
    /* storage unavailable — same-tab reactivity still works */
  }
}

/** Called after every cache mutation: syncs other tabs and notifies the UI. */
function touchCache() {
  persistCache()
  emitCacheChange()
}

try {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(CACHE_STORAGE_PREFIX)) return
    const key = e.key.slice(CACHE_STORAGE_PREFIX.length)
    if (!(key in cache)) return
    try {
      cache[key] = e.newValue ? JSON.parse(e.newValue) : []
      emitCacheChange()
    } catch {
      /* ignore malformed cross-tab payloads */
    }
  })
} catch {
  /* storage events unavailable — same-tab reactivity still works */
}

// ---------------------------------------------------------------------------
// Hydration — pull the real data into the cache when Supabase is configured
// ---------------------------------------------------------------------------

async function loadTable(key, select, mapRow) {
  const { data, error } = await supabase.from(TABLE[key]).select(select)
  if (!error && data) cache[key] = data.map(mapRow)
}

/**
 * Fetches the scoped teacher data through the SECURITY DEFINER RPCs so the
 * database itself decides which students / exams / results a teacher may see.
 * If the RPCs are not deployed yet (fresh DB), falls back to loading the full
 * tables — the list getters still apply JS-side scoping (weaker, but the app
 * keeps working until `supabase/rbac_teacher.sql` is run).
 */
async function loadTeacherScoped(key, teacher) {
  const rpc = {
    students: { fn: 'teacher_scoped_students', map: rowToStudent },
    exams: { fn: 'teacher_scoped_exams', map: rowToExam },
    attempts: { fn: 'teacher_scoped_attempts', map: rowToAttempt },
  }[key]
  if (!rpc) return
  const token = teacher?.session_token || ''
  // No session token means the identity cannot be verified server-side (e.g. a
  // session created before `teacher_login` was deployed, or a rotated token).
  // Fall back to the plain load + JS scoping — identical to today's behavior —
  // until the teacher logs in again and receives a fresh token.
  if (!token) {
    await loadTeacherScopedFallback(key)
    return
  }
  try {
    const { data, error } = await supabase.rpc(rpc.fn, {
      p_teacher_id: teacher?.id,
      p_session_token: token,
    })
    if (!error) {
      cache[key] = (data || []).map(rpc.map)
      return
    }
    if (error.code === 'PGRST202' || error.code === '42883') {
      // RPC not deployed yet → plain load; JS scoping still applies on read.
      await loadTeacherScopedFallback(key)
    }
  } catch {
    await loadTeacherScopedFallback(key)
  }
}

/** Full-table load used only when the teacher scoping RPCs are unavailable. */
async function loadTeacherScopedFallback(key) {
  const loaders = {
    students: () => loadTable('students', 'id, name, stage, grade, parent_phone, status, password, created_at', rowToStudent),
    exams: () => loadTable('exams', '*', rowToExam),
    attempts: () => loadTable('attempts', '*', rowToAttempt),
  }
  if (loaders[key]) await loaders[key]()
}

let hydratePromise = null

/**
 * Fetches data from Supabase into the cache (no-op in mock mode).
 *
 * Single-flight: concurrent callers — several hooks on the same page and
 * React StrictMode double-mounts in dev — share ONE in-flight load, so no
 * duplicate requests are ever fired on mount.
 *
 * Ordering is auth-first: the current teacher is read synchronously (the
 * teacher session lives in sessionStorage — there is no async Supabase Auth
 * session) BEFORE any network call, and teacher-scoped RPCs are only invoked
 * for a verified identity (a teacher row carrying a `session_token`). When a
 * teacher is logged in ONLY their scoped rows are fetched — the browser never
 * receives out-of-scope students / exams / results, nor any other teacher's
 * data. Admins / demo load everything as before.
 */
export function hydrateAll() {
  if (!live()) return Promise.resolve()
  if (hydratePromise) return hydratePromise
  hydratePromise = (async () => {
    try {
      const teacher = isAdminAuthenticated() ? null : (getCurrentTeacher ? getCurrentTeacher() : null)
      if (teacher) {
        await Promise.all([
          loadTeacherScoped('students', teacher),
          loadTeacherScoped('exams', teacher),
          loadTeacherScoped('attempts', teacher),
        ])
        // Teacher sessions never hold the teachers / subjects / classes tables.
        return
      }
      await Promise.all([
        loadTable('students', 'id, name, stage, grade, parent_phone, status, password, parent_pin, created_at', rowToStudent),
        loadTable('teachers', '*', rowToTeacher),
        loadTable('subjects', '*', rowToSubject),
        loadTable('exams', '*', rowToExam),
        loadTable('attempts', '*', rowToAttempt),
        loadTable('classes', '*', rowToClass),
      ])
      /* eslint-disable-next-line no-console */
      console.log(
        '[hydrateAll] exams fetch  :', cache.exams.length, 'rows |',
        'first row teacher_id =', cache.exams[0]?.teacherId
      )
    } finally {
      hydratePromise = null
    }
  })()
  return hydratePromise
}

/** True when the app is talking to a real Supabase project. */
export const isBackendLive = () => live()

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/**
 * True when the caller is a logged-in teacher. Used to scope every data read
 * and to lock admin-only mutations away from teacher accounts.
 */
function isTeacherContext() {
  if (isAdminAuthenticated()) return false
  return Boolean(getCurrentTeacher ? getCurrentTeacher() : null)
}

/**
 * Strict student scoping for a teacher: a student is visible ONLY when BOTH
 * their `stage` and their `grade` are inside the admin-granted permissions.
 * If the teacher has no stages or no grades granted, they see nothing
 * (admin must grant a scope). Admins / demo mode are unrestricted.
 */
function studentsWithinPermissions(teacher, students) {
  if (!teacher) return students
  const stages = asList(teacher.stages)
  const grades = asList(teacher.grades)
  if (!stages.length || !grades.length) return []
  return students.filter(
    (s) => inAllowed(stages, s.stage) && inAllowed(grades, s.grade)
  )
}

/** Throws when the caller is not acting as an admin. Uses the exact same
 *  admin session (`admin_session`) that gates the Admin Dashboard, so a
 *  leftover teacher session can never be mistaken for the current actor. */
function assertAdminContext() {
  if (!isAdminAuthenticated()) {
    throw new Error('هذه العملية متاحة للإدارة فقط.')
  }
}

/** Rejects a teacher touching a student that is outside their granted scope. */
function assertStudentInScope(student) {
  if (!isTeacherContext()) return
  if (!student || studentsWithinPermissions(currentOwner(), [student]).length === 0) {
    throw new Error('لا يمكنك تعديل أو حذف طالب خارج الصفوف المسموح بها لك.')
  }
}

export function listStudents() {
  const teacher = currentOwner()
  return teacher ? clone(studentsWithinPermissions(teacher, cache.students)) : clone(cache.students)
}

/** Creates a student, auto-generating id / password / parent PIN unless given.
 *  Teachers are NOT allowed to create students — admin only. */
export async function createStudent(formValues) {
  assertAdminContext()
  const student = {
    ...formValues,
    id: formValues.id || generateNextStudentId(cache.students),
    password: formValues.password || generateStudentPassword(),
    parentPin: formValues.parentPin || generateParentPin(),
    createdAt: new Date().toISOString().slice(0, 10),
  }

  cache.students = [student, ...cache.students]

  if (live()) {
    await supabase.from(TABLE.students).insert(studentToRow(student))
  }
  notify({ type: 'student_registered', text: `تم تسجيل الطالب "${student.name}"` })
  touchCache()
  return clone(student)
}

export async function updateStudent(studentId, formValues) {
  const existing = cache.students.find((s) => s.id === studentId)
  assertStudentInScope(existing)
  cache.students = cache.students.map((s) => (s.id === studentId ? { ...s, ...formValues } : s))

  if (live()) {
    await supabase.from(TABLE.students).update(studentToRow({ ...cache.students.find((s) => s.id === studentId), ...formValues })).eq('id', studentId)
  }
  touchCache()
}

export async function deleteStudent(studentId) {
  const existing = cache.students.find((s) => s.id === studentId)
  assertStudentInScope(existing)
  cache.students = cache.students.filter((s) => s.id !== studentId)
  if (live()) {
    await supabase.from(TABLE.students).delete().eq('id', studentId)
  }
  touchCache()
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export function listTeachers() {
  // A teacher must never see other teachers (or be able to tamper with them).
  if (isTeacherContext()) return []
  return clone(cache.teachers)
}

/**
 * Normalizes a teacher's teaching permissions into array form:
 *   `subjects[]`, `stages[]`, `grades[]` — each stored as arrays/JSON.
 * A `subject` is also kept (first allowed subject) for backward compatibility
 * with screens that still expect a single subject string.
 */
function normalizeTeacherPermissions(values) {
  const subjects = parsePermissionList(values.subjects)
  const stages = parsePermissionList(values.stages)
  const grades = parsePermissionList(values.grades)
  if (!subjects.length && values.subject) subjects.push(String(values.subject).trim())
  return {
    ...values,
    subjects,
    stages,
    grades,
    subject: values.subject || subjects[0] || '',
  }
}

/**
 * Tries to decode a JSON-encoded value (array or string). Returns a decoded
 * array of items, or null when the input is not decodable JSON. Handles the
 * legacy corruption pattern where a JSON array is stored inside a string
 * element, e.g. `["[\"الرياضيات\"]"]` → unwraps to `["الرياضيات"]`.
 */
function unwrapJson(input) {
  if (typeof input !== 'string') return null
  let s = input.trim()
  if (!s) return null
  if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1).trim()
  if (!s.startsWith('[') && !s.startsWith('"')) return null
  try {
    const parsed = JSON.parse(s)
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'string') {
      const inner = parsePermissionList(parsed)
      return inner.length ? inner : [parsed]
    }
  } catch {
    /* not JSON — treat as a plain value below */
  }
  return null
}

/**
 * Central permission parser. Turns ANY persisted value into a clean array of
 * trimmed strings — never undefined. It handles:
 *   - a real array            `["الرياضيات"]`
 *   - a JSON string           `"[\"الرياضيات\"]"` (jsonb string / text JSON)
 *   - a doubly-encoded value  `["[\"الرياضيات\"]"]` → `["الرياضيات"]`
 *   - a quoted plain value    `"الرياضيات"` → `["الرياضيات"]`
 *   - a comma-separated list  `"الرياضيات،العلوم"` (ASCII or Arabic comma)
 *
 * Original text is preserved — values are never lowercased or rewritten.
 * Duplicates are removed. Used by every read AND write path so old corrupt
 * rows and newly saved rows converge on the same clean array shape.
 */
export function parsePermissionList(value) {
  const out = []
  const seen = new Set()
  const add = (item) => {
    let s = String(item).trim()
    if (!s) return
    if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1).trim()
    if (!s) return
    const unwrapped = unwrapJson(s)
    if (unwrapped) {
      for (const sub of unwrapped) add(sub)
      return
    }
    if (seen.has(s)) return
    seen.add(s)
    out.push(s)
  }
  if (Array.isArray(value)) {
    for (const item of value) add(item)
  } else if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return out
    if (trimmed.startsWith('[') || trimmed.startsWith('"') || trimmed.startsWith("'")) {
      const unwrapped = unwrapJson(trimmed)
      if (unwrapped) {
        for (const sub of unwrapped) add(sub)
        return out
      }
    }
    for (const part of trimmed.split(/[،,]/)) {
      const s = part.trim()
      if (s && !seen.has(s)) {
        seen.add(s)
        out.push(s)
      }
    }
  }
  return out
}

/**
 * Parses a persisted permission value (array, JSON string, doubly-encoded
 * JSON, or comma-separated string) into a clean string array — never
 * undefined. Delegates to the central `parsePermissionList`.
 */
function parseList(value) {
  return parsePermissionList(value)
}

/** DB/BE row → React object: permission columns become real arrays. */
function rowToTeacher(row) {
  const subjects = parseList(row.subjects)
  return {
    ...row,
    subjects,
    stages: parseList(row.stages),
    grades: parseList(row.grades),
    subject: row.subject || subjects[0] || '',
  }
}

/**
 * THE single, shared way to read a teacher's teaching permissions. Given a
 * teacher object (from the DB, cache or session) it returns clean arrays:
 *   `{ subject, subjects, stages, grades }`
 * Legacy values — real arrays, JSON strings, doubly-encoded JSON, or
 * comma-separated text — are all normalized through the central parser, so no
 * page can ever display raw JSON or diverge in how it reads permissions.
 */
export function getTeacherPermissions(teacher) {
  const subjects = parsePermissionList(teacher?.subjects)
  return {
    subject: teacher?.subject || subjects[0] || '',
    subjects: subjects.length ? subjects : parsePermissionList(teacher?.subject),
    stages: parsePermissionList(teacher?.stages),
    grades: parsePermissionList(teacher?.grades),
  }
}

/** React object → DB/BE row: permission arrays persisted as REAL JSON arrays
 *  (jsonb) / JSON text (text columns) so they survive round-trips without
 *  ever being stored as a string inside an array. */
function teacherToRow(teacher) {
  const { subjects, stages, grades } = normalizeTeacherPermissions(teacher)
  return {
    ...teacher,
    subject: teacher.subject || subjects[0] || '',
    subjects,
    stages,
    grades,
  }
}

/** Reads the existing `teachers.id` values straight from the DB (or cache offline). */
async function readTeacherIds() {
  if (!live()) {
    return cache.teachers.map((t) => t.id).filter(Boolean)
  }
  const { data, error } = await supabase.from(TABLE.teachers).select('id')
  if (error || !data) return []
  return data.map((r) => r.id).filter(Boolean)
}

/** True when an id looks like an auto-generated UUID. */
function isUuidId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))
}

/**
 * Picks the next free text id (T-00X) by scanning the ids already in the DB —
 * never `cache.length`, so refreshes or pre-existing rows can't collide.
 */
function nextTeacherTextId(ids) {
  const used = new Set(ids)
  let n = 1
  while (used.has(`T-${String(n).padStart(3, '0')}`)) n += 1
  return `T-${String(n).padStart(3, '0')}`
}

/** Existing usernames on the live teachers table (or the cache when offline). */
async function readTeacherUsernames() {
  if (!live()) {
    return new Set(cache.teachers.map((t) => t.username).filter(Boolean))
  }
  const { data, error } = await supabase.from(TABLE.teachers).select('username')
  if (error || !data) return new Set()
  return new Set(data.map((r) => r.username).filter(Boolean))
}

/** Returns `base` when free; otherwise appends a numeric suffix (`base2`,
 *  `base3`, …) so the stored username is always unique — the live teachers
 *  table enforces a UNIQUE constraint on `username`. */
async function ensureUniqueUsername(base) {
  const used = await readTeacherUsernames()
  if (!base || !used.has(base)) return base
  let n = 2
  while (used.has(`${base}${n}`)) n += 1
  return `${base}${n}`
}

export async function createTeacher(formValues) {
  assertAdminContext()
  const teacher = normalizeTeacherPermissions({
    ...formValues,
    username: await ensureUniqueUsername(
      formValues.username ||
        formValues.name.trim().replace(/\s+/g, '.').toLowerCase() ||
        `teacher${Date.now()}`
    ),
    password: formValues.password || Math.random().toString(36).slice(2, 10),
    status: formValues.status || 'Active',
  })

  // No backend configured → in-memory only (mock / demo).
  if (!live()) {
    teacher.id = formValues.id || nextTeacherTextId(cache.teachers.map((t) => t.id))
    cache.teachers = [teacher, ...cache.teachers]
    notify({ type: 'teacher_added', text: `تمت إضافة مدرس جديد "${teacher.name}"` })
    touchCache()
    return clone(teacher)
  }

  // Live Supabase: pick the id based on the table's real shape.
  const existingIds = await readTeacherIds()
  let idToUse = null
  if (existingIds.some(isUuidId)) {
    idToUse = null // UUID / auto-generated PK → let the DB generate it
  } else if (formValues.id && !existingIds.includes(formValues.id)) {
    idToUse = formValues.id // user-supplied, still unused
  } else if (!formValues.id) {
    idToUse = nextTeacherTextId(existingIds) // unique text id from DB data
  }

  // INSERT must succeed first; the cache is only updated after success.
  try {
    const row = teacherToRow(teacher)
    if (idToUse) row.id = idToUse
    else delete row.id // omit id so the DB auto-generates it
    const cols = await liveColumns('teachers')
    const payload = stripToRows([row], cols)[0]
    const { data, error } = await supabase.from(TABLE.teachers).insert(payload).select()
    if (error) {
      console.error('فشل حفظ المدرس (INSERT):', error)
      throw new Error(`فشل حفظ المدرس: ${error.message || JSON.stringify(error)}`)
    }
    cache.teachers = await queryTeachersRows()
    if (data && data[0]) {
      notify({ type: 'teacher_added', text: `تمت إضافة مدرس جديد "${data[0].name || teacher.name}"` })
      touchCache()
      return clone(rowToTeacher(data[0]))
    }
    notify({ type: 'teacher_added', text: `تمت إضافة مدرس جديد "${teacher.name}"` })
    touchCache()
    return clone(cache.teachers.find((t) => t.id === idToUse) || teacher)
  } catch (err) {
    console.error('فشل إضافة المدرس:', err)
    throw err
  }
}

export async function updateTeacher(teacherId, formValues) {
  assertAdminContext()
  const updated = normalizeTeacherPermissions(formValues)

  /* No backend configured → in-memory only. */
  if (!live()) {
    cache.teachers = cache.teachers.map((t) => (t.id === teacherId ? { ...t, ...updated } : t))
    notify({ type: 'teacher_updated', text: `تم تعديل بيانات المدرس "${updated.name}"` })
    touchCache()
    return
  }

  try {
    const cols = await liveColumns('teachers')
    const payload = stripToRows([teacherToRow(updated)], cols)[0]
    const { error } = await supabase.from(TABLE.teachers).update(payload).eq('id', teacherId)
    if (error) {
      console.error('فشل تحديث المدرس (UPDATE):', error)
      throw new Error(`فشل تحديث المدرس: ${error.message || JSON.stringify(error)}`)
    }
    cache.teachers = await queryTeachersRows()
    notify({ type: 'teacher_updated', text: `تم تعديل بيانات المدرس "${updated.name}"` })
    touchCache()
  } catch (err) {
    console.error('فشل تحديث المعلم:', err)
    throw err
  }
}

export async function deleteTeacher(teacherId) {
  assertAdminContext()
  const target = cache.teachers.find((t) => t.id === teacherId)

  /* No backend configured → in-memory only. */
  if (!live()) {
    cache.teachers = cache.teachers.filter((t) => t.id !== teacherId)
    notify({ type: 'teacher_deleted', text: `تم حذف المدرس "${target?.name || teacherId}"` })
    touchCache()
    return
  }

  try {
    const { error } = await supabase.from(TABLE.teachers).delete().eq('id', teacherId)
    if (error) {
      console.error('فشل حذف المعلم (DELETE):', error)
      throw new Error(`فشل حذف المعلم: ${error.message || JSON.stringify(error)}`)
    }
    cache.teachers = await queryTeachersRows()
    notify({ type: 'teacher_deleted', text: `تم حذف المدرس "${target?.name || teacherId}"` })
    touchCache()
  } catch (err) {
    console.error('فشل حذف المعلم:', err)
    throw err
  }
}

/** Pulls every teacher row straight from the DB (no-op cache return offline). */
export async function loadTeachers() {
  assertAdminContext()
  if (!live()) return clone(cache.teachers)
  cache.teachers = await queryTeachersRows()
  return clone(cache.teachers)
}

async function queryTeachersRows() {
  const { data, error } = await supabase.from(TABLE.teachers).select('*')
  if (error) {
    console.error('فشل تحميل المدرسين:', error)
    return cache.teachers
  }
  return (data || []).map((row) => rowToTeacher(row))
}

// ---------------------------------------------------------------------------
// Teacher authentication — match username + password against the `teachers`
// table (live Supabase first, in-memory cache fallback).
// ---------------------------------------------------------------------------

/**
 * Fetches a single teacher by id. Prefers the live Supabase `teachers` table,
 * falling back to the in-memory cache only when the backend isn't configured.
 * A logged-in teacher may only fetch THEIR OWN profile — never another
 * teacher's record.
 */
export async function getTeacherById(teacherId) {
  if (!teacherId) return null
  const owner = currentOwner()
  if (owner && owner.id !== teacherId) return null
  const cached = cache.teachers.find((t) => t.id === teacherId)
  if (!live()) return cached ? clone(rowToTeacher(cached)) : null
  try {
    // Select only columns that actually exist (older DBs may lack the newer
    // permission columns) — avoids a 400 and keeps both schemas working.
    const cols = await liveColumns('teachers')
    const select = (cols.includes('subjects') ? 'id, name, subject, subjects, stages, grades'
      : cols.includes('id') ? 'id, name, subject' : 'id, name')
      .split(',')
      .map((c) => c.trim())
      .filter((c) => cols.includes(c))
      .join(',')
    const { data, error } = await supabase
      .from(TABLE.teachers)
      .select(select)
      .eq('id', teacherId)
      .limit(1)
      .maybeSingle()
    // Map through rowToTeacher so the permission columns arrive as clean
    // arrays even when the DB stores jsonb strings / double-encoded values.
    if (!error && data) return clone(rowToTeacher(data))
  } catch {
    /* fall through to cache on a live query failure */
  }
  return cached ? clone(rowToTeacher(cached)) : null
}

export async function findTeacherByUsernamePassword(username, password) {
  const normalizedUsername = username.trim()
  const cached = cache.teachers.find(
    (t) => t.username === normalizedUsername && t.password === password && (t.status ?? 'Active') === 'Active'
  )
  if (!live()) return cached ? clone(cached) : null
  try {
    // Preferred path: SECURITY DEFINER RPC — validates credentials and issues a
    // fresh `session_token` server-side (never exposes the password column).
    const { data, error } = await supabase.rpc('teacher_login', {
      p_username: normalizedUsername,
      p_password: password,
    })
    if (!error && data && data.length) return clone(rowToTeacher(data[0]))
    // RPC not deployed yet → fall back to the legacy direct-table match.
    if (error && (error.code === 'PGRST202' || error.code === '42883')) {
      const { data: legacy, error: legacyError } = await supabase
        .from(TABLE.teachers)
        .select('*')
        .eq('username', normalizedUsername)
        .eq('password', password)
        .eq('status', 'Active')
        .limit(1)
        .maybeSingle()
      if (!legacyError && legacy) return clone(rowToTeacher(legacy))
    }
    return null
  } catch {
    return cached ? clone(cached) : null
  }
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export function listSubjects() {
  // Teacher dashboards never need the full subject catalog.
  if (isTeacherContext()) return []
  return clone(cache.subjects)
}

export async function createSubject(name) {
  assertAdminContext()
  const subject = {
    id: `SUB-${String(cache.subjects.length + 1).padStart(2, '0')}`,
    name,
    teachersCount: 0,
    examsCount: 0,
  }
  cache.subjects = [subject, ...cache.subjects]

  if (live()) {
    await supabase.from(TABLE.subjects).insert(subjectToRow(subject))
  }
  touchCache()
  return clone(subject)
}

export async function updateSubject(subjectId, name) {
  assertAdminContext()
  cache.subjects = cache.subjects.map((s) => (s.id === subjectId ? { ...s, name } : s))
  if (live()) {
    await supabase.from(TABLE.subjects).update({ name }).eq('id', subjectId)
  }
  touchCache()
}

export async function deleteSubject(subjectId) {
  assertAdminContext()
  cache.subjects = cache.subjects.filter((s) => s.id !== subjectId)
  if (live()) {
    await supabase.from(TABLE.subjects).delete().eq('id', subjectId)
  }
  touchCache()
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

/**
 * The teacher currently logged in, or null (e.g. for admin or demo mode).
 * Used both to auto-tag exams with their owner and to enforce ownership.
 */
function currentOwner() {
  if (isAdminAuthenticated()) return null
  return getCurrentTeacher ? getCurrentTeacher() : null
}

/** True when the exam can be managed by the current request context
 * (admin/demo or the owning teacher). Rejects another teacher's exam. */
function assertOwnerExam(exam) {
  const owner = currentOwner()
  if (!owner) return true // admin / demo → unrestricted
  if (!exam) return false
  return exam.teacherId === owner.id
}

/** The teaching permissions a teacher is allowed — arrays only, parsed from
 *  either real arrays, a JSONB string, or a simpler singular value. */
function allowedPermissions(teacher) {
  const subjects = asList(teacher?.subjects)
  const stages = asList(teacher?.stages)
  const grades = asList(teacher?.grades)
  return {
    subjects: subjects.length ? subjects : asList(teacher?.subject && [teacher.subject]),
    stages,
    grades,
  }
}

/** RFC/JSON-safe normalization: trim, strip surrounding quotes, lowercase. */
function normal(v) {
  if (v == null) return ''
  return String(v).trim().replace(/^["']|["']$/g, '').toLowerCase()
}

/** Always returns a real Array from an input that may be an Array, a JSON
 *  string (e.g. `["عربي","رياضيات"]`), a doubly-encoded JSON value
 *  (`["[\"رياضيات\"]"]`), a plain string, null or undefined. Values are
 *  normalized for case-insensitive matching (display reads use
 *  `parsePermissionList`, which preserves the original text). */
function asList(list) {
  return parsePermissionList(list).map((i) => normal(i)).filter(Boolean)
}

/** case-insensitive, trimmed membership test. Robust to any list type. */
function inAllowed(list, value) {
  /* eslint-disable-next-line no-console */
  console.log('[inAllowed] typeof list   :', typeof list)
  /* eslint-disable-next-line no-console */
  console.log('[inAllowed] Array.isArray :', Array.isArray(list))
  /* eslint-disable-next-line no-console */
  console.log('[inAllowed] list          :', list)
  const items = Array.isArray(list) ? list.map((i) => normal(i)).filter(Boolean) : asList(list)
  const wanted = normal(value)
  return items.includes(wanted)
}

/**
 * Verifies a teacher's chosen exam scope (subject/stage/grade) is within the
 * admin-defined permissions. Throws otherwise — enforced server-side, so it
 * can't be bypassed from DevTools or a raw API call.
 */
function assertWithinPermissions(teacher, { subject, stage, grade }) {
  const { subjects, stages, grades } = allowedPermissions(teacher)

  /* eslint-disable-next-line no-console */
  console.log('[assertWithinPermissions] Teacher Subjects :', subjects)
  /* eslint-disable-next-line no-console */
  console.log('[assertWithinPermissions] Teacher Stages   :', stages)
  /* eslint-disable-next-line no-console */
  console.log('[assertWithinPermissions] Teacher Grades   :', grades)
  /* eslint-disable-next-line no-console */
  console.log('[assertWithinPermissions] Exam Subject     :', subject)
  /* eslint-disable-next-line no-console */
  console.log('[assertWithinPermissions] Exam Stage       :', stage)
  /* eslint-disable-next-line no-console */
  console.log('[assertWithinPermissions] Exam Grade       :', grade)

  if (subjects.length && !inAllowed(subjects, subject)) {
    /* eslint-disable-next-line no-console */
    console.log('[assertWithinPermissions] REN: موضوع  خارج الصلاحيات ->', subject, 'not in', subjects)
    throw new Error('ليس لديك صلاحية لإنشاء امتحان لهذه المادة أو المرحلة أو الصف.')
  }
  if (stages.length && !inAllowed(stages, stage)) {
    /* eslint-disable-next-line no-console */
    console.log('[assertWithinPermissions] REN: مرحلة  خارج الصلاحيات ->', stage, 'not in', stages)
    throw new Error('ليس لديك صلاحية لإنشاء امتحان لهذه المادة أو المرحلة أو الصف.')
  }
  if (grades.length && !inAllowed(grades, grade)) {
    /* eslint-disable-next-line no-console */
    console.log('[assertWithinPermissions] REN: صف     خارج الصلاحيات ->', grade, 'not in', grades)
    throw new Error('ليس لديك صلاحية لإنشاء امتحان لهذه المادة أو المرحلة أو الصف.')
  }
}

export function listExams() {
  const teacher = currentOwner()
  if (teacher) {
    // A teacher only ever reads their OWN exams within their granted scope.
    return clone(
      cache.exams.filter((e) => e.teacherId === teacher.id && examWithinPermissions(teacher, e))
    )
  }
  return clone(cache.exams)
}

/**
 * Exams owned by the given teacher AND within their admin-granted
 * permissions (subjects / stages / grades). Used by the teacher-facing
 * roster so nobody sees another teacher's exams or an exam outside their
 * allowed scope. Exams without a `teacherId` (legacy) are excluded.
 */
export function listExamsForTeacher(teacherId, _subject) {
  const teacher = cache.teachers.find((t) => t.id === teacherId)
  return clone(
    cache.exams.filter((e) => {
      if (!e.teacherId || e.teacherId !== teacherId) return false
      return examWithinPermissions(teacher, e)
    })
  )
}

/** True when an exam's subject/stage/grade fall inside the teacher's
 *  admin-granted permissions. Empty permission lists mean "unrestricted"
 *  for that dimension (backward compatible with older teacher records). */
function examWithinPermissions(teacher, exam) {
  if (!teacher) return true // admin / demo → unrestricted
  const { subjects, stages, grades } = allowedPermissions(teacher)
  if (subjects.length && !inAllowed(subjects, exam.subject)) return false
  if (stages.length && !inAllowed(stages, exam.stage)) return false
  if (grades.length && !inAllowed(grades, exam.grade)) return false
  return true
}

/**
 * Real permission check used before ANY teacher interaction with an exam
 * (view, edit, delete, add questions, manage results). Returns true only
 * when the exam is owned by the current teacher AND within their allowed
 * subject/stage/grade scope. Admins / demo mode are unrestricted.
 */
export function canTeacherAccessExam(examId) {
  const owner = currentOwner()
  if (!owner) return true // admin / demo → unrestricted
  const exam = cache.exams.find((e) => e.id === examId)
  if (!exam) return false
  if (exam.teacherId !== owner.id) return false
  return examWithinPermissions(owner, exam)
}

/**
 * The next free EX-### exam id, computed against the REAL exams table when
 * live (merged with the local cache). A teacher's cache only holds their own
 * scoped exams, so deriving the id from it alone can collide with another
 * teacher's — or an admin-created — exam. Falls back to the cache alone in
 * mock mode or on a live read failure.
 */
async function nextExamId() {
  if (live()) {
    try {
      const { data } = await supabase.from(TABLE.exams).select('id')
      const dbIds = (data || []).map((r) => r.id)
      const allIds = [...new Set([...dbIds, ...cache.exams.map((e) => e.id)])].map((id) => ({ id }))
      return generateNextExamId(allIds)
    } catch {
      /* fall back to cache-based generation below */
    }
  }
  return generateNextExamId(cache.exams)
}

/**
 * Creates a new exam. The logged-in teacher is fixed as the owner — they
 * cannot choose a teacher — and `teacher_id` / `teacher_name` are filled in
 * automatically from the session. Admin-created exams carry no teacher.
 */
export async function createExam(examData) {
  // Only teachers author exams (the admin page is read-only). The owner is the
  // teacher logged into the CURRENT session, read straight from the session so
  // a leftover admin session can never shadow them. `teachers.id` is the ONLY
  // valid key for exams.teacher_id, so when no real teacher is present we stop
  // with a clear error instead of posting a bogus key to the database.
  const owner = getCurrentTeacher ? getCurrentTeacher() : null
  if (!owner || !owner.id) {
    throw new Error(
      'لا يمكن حفظ الامتحان الآن: تعذّر تحديد حساب المدرس الحالي. سجّل الخروج ثم ادخل كمدرس وحاول مرة أخرى.'
    )
  }
  assertWithinPermissions(owner, examData)
  const exam = {
    ...examData,
    id: await nextExamId(),
    teacherId: owner ? owner.id : (examData.teacherId ?? null),
    teacherName: owner ? owner.name : (examData.teacherName ?? null),
    createdAt: new Date().toISOString().slice(0, 10),
  }
  cache.exams = [exam, ...cache.exams]

  /* eslint-disable-next-line no-console */
  console.log('[createExam] current teacher :', owner ? { id: owner.id, name: owner.name } : 'admin/demo')
  /* eslint-disable-next-line no-console */
  console.log('[createExam] teacher subject :', owner?.subject)
  /* eslint-disable-next-line no-console */
  console.log('[createExam] teacher perms   :', owner && {
    subjects: Array.isArray(owner.subjects) ? owner.subjects : owner.subject,
    stages: owner.stages,
    grades: owner.grades,
  })

  if (live()) {
    try {
      let saved = null
      for (let attempt = 0; attempt < 5; attempt++) {
        const cols = await liveColumns('exams')
        const row = stripToRows([examToRow(exam)], cols)[0]
        row.start_time = row.start_time?.trim() || null
        row.end_time = row.end_time?.trim() || null
        /* eslint-disable-next-line no-console */
        console.log('Exam payload:', row)
        const { data, error } = await supabase.from(TABLE.exams).insert(row).select()
        /* eslint-disable-next-line no-console */
        console.log('[createExam] insert response:', error ? `ERROR ${error.status}` : data)
        if (error && error.code === '23505') {
          // The EX-### collided with a real exam outside this browser's cache
          // (another teacher, or one created after hydration). Regenerate a
          // fresh id against the live table and retry — never reuse a used id.
          const prevId = exam.id
          exam.id = await nextExamId()
          cache.exams = cache.exams.map((e) => (e.id === prevId ? exam : e))
          continue
        }
        if (error) {
          /* eslint-disable-next-line no-console */
          console.error('[createExam] insert error:', error)
          /* eslint-disable-next-line no-console */
          console.error('[createExam] message:', error.message)
          /* eslint-disable-next-line no-console */
          console.error('[createExam] details:', error.details)
          /* eslint-disable-next-line no-console */
          console.error('[createExam] hint:', error.hint)
          throw new Error(`فشل حفظ الامتحان: ${error.message || JSON.stringify(error)}`)
        }
        if (!data || !data[0]) {
          /* eslint-disable-next-line no-console */
          console.warn('[createExam] insert returned no row — exam NOT persisted in Supabase')
          throw new Error('فشل حفظ الامتحان: لم يتم الحفظ في قاعدة البيانات.')
        }
        /* eslint-disable-next-line no-console */
        console.log('[createExam] inserted exam teacher_id :', data[0].teacher_id, '(expecting', owner?.id, ')')
        if (owner && data[0].teacher_id == null) {
          /* eslint-disable-next-line no-console */
          console.error('[createExam] «teacher_id» missing in returned row')
          throw new Error('فشل ربط الامتحان بالمدرس: teacher_id غير موجود في قاعدة البيانات.')
        }
        if (owner && String(data[0].teacher_id) !== String(owner.id)) {
          /* eslint-disable-next-line no-console */
          console.error('[createExam] MISMATCH → saved', data[0].teacher_id, 'but current teacher id is', owner.id)
          throw new Error(
            'فشل ربط الامتحان بالمدرس: عدم تطابق teacher_id المخزّن مع معرف المدرس الحالي.'
          )
        }
        saved = data[0]
        break
      }
      if (!saved) {
        throw new Error('فشل حفظ الامتحان: تعذّر الحصول على معرف فريد للامتحان.')
      }
      cache.exams = cache.exams.map((e) => (e.id === exam.id ? { ...e, ...rowToExam(saved) } : e))
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error('[createExam] failed to insert:', err)
      throw err
    }
  }
  notify({
    type: 'exam_created',
    text: `قام ${owner ? `الأستاذ ${owner.name}` : 'الإدارة'} بإنشاء امتحان "${exam.name}"`,
  })
  touchCache()
  return clone(exam)
}

export async function updateExam(examId, examData) {
  const existing = cache.exams.find((e) => e.id === examId)
  if (existing && !assertOwnerExam(existing)) {
    throw new Error('لا يمكنك تعديل امتحان لا يخصك.')
  }
  let merged = { ...existing, ...examData }
  const owner = currentOwner()
  if (owner && existing && existing.teacherId === owner.id) {
    assertWithinPermissions(owner, merged)
    merged = { ...merged, teacherId: owner.id, teacherName: owner.name }
  }
  cache.exams = cache.exams.map((e) => (e.id === examId ? merged : e))
  if (live()) {
    try {
      const cols = await liveColumns('exams')
      const row = stripToRows([examToRow(merged)], cols)[0]
      row.start_time = row.start_time?.trim() || null
      row.end_time = row.end_time?.trim() || null
      /* eslint-disable-next-line no-console */
      console.log('Exam payload (update):', row)
      const { error } = await supabase.from(TABLE.exams).update(row).eq('id', examId)
      if (error) {
        /* eslint-disable-next-line no-console */
        console.error('[updateExam] error:', error)
        /* eslint-disable-next-line no-console */
        console.error('[updateExam] message:', error.message)
        /* eslint-disable-next-line no-console */
        console.error('[updateExam] details:', error.details)
        /* eslint-disable-next-line no-console */
        console.error('[updateExam] hint:', error.hint)
        throw new Error(`فشل تحديث الامتحان: ${error.message || JSON.stringify(error)}`)
      }
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error('[updateExam] failed to update:', err)
      throw err
    }
  }
  notify({ type: 'exam_updated', text: `تم تعديل امتحان "${merged.name}"` })
  touchCache()
}

export async function deleteExam(examId) {
  const existing = cache.exams.find((e) => e.id === examId)
  if (existing && !assertOwnerExam(existing)) {
    throw new Error('لا يمكنك حذف امتحان لا يخصك.')
  }
  cache.exams = cache.exams.filter((e) => e.id !== examId)
  if (live()) {
    await supabase.from(TABLE.exams).delete().eq('id', examId)
  }
  notify({ type: 'exam_deleted', text: `تم حذف امتحان "${existing?.name || examId}"` })
  touchCache()
}

/** Duplicates an exam (fresh ids/questions) as a new draft. */
export async function duplicateExam(examId) {
  const source = cache.exams.find((e) => e.id === examId)
  if (!source) return
  if (!assertOwnerExam(source)) {
    throw new Error('لا يمكنك نسخ امتحان لا يخصك.')
  }

  const copy = {
    ...clone(source),
    id: await nextExamId(),
    name: `${source.name} (نسخة)`,
    status: 'Draft',
    createdAt: new Date().toISOString().slice(0, 10),
    questions: source.questions.map((q) => ({
      ...q,
      id: `Q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    })),
  }
  cache.exams = [copy, ...cache.exams]

  if (live()) {
    await supabase.from(TABLE.exams).insert(examToRow(copy))
  }
  notify({ type: 'exam_created', text: `تم إنشاء نسخة من امتحان "${copy.name}"` })
  touchCache()
}

// ---------------------------------------------------------------------------
// Exam attempts (results) — one row per student submission, pre-graded
// ---------------------------------------------------------------------------

export function listExamAttempts() {
  const teacher = currentOwner()
  if (teacher) {
    // A teacher only sees results submitted on their OWN in-scope exams.
    const ownIds = new Set(
      cache.exams
        .filter((e) => e.teacherId === teacher.id && examWithinPermissions(teacher, e))
        .map((e) => e.id)
    )
    return clone(cache.attempts.filter((a) => ownIds.has(a.examId)))
  }
  return clone(cache.attempts)
}

/**
 * Latest attempt a student made on an exam, or null. Checks live Supabase
 * first (when configured), falling back to the in-memory cache. Used to
 * enforce one attempt per student per exam.
 */
export async function findExamAttempt(studentId, examId) {
  // A teacher may only look at attempts on their own in-scope exams.
  const teacher = currentOwner()
  if (teacher) {
    const exam = cache.exams.find((e) => e.id === examId)
    if (!exam || exam.teacherId !== teacher.id || !examWithinPermissions(teacher, exam)) return null
  }
  const cached = cache.attempts.find((a) => a.studentId === studentId && a.examId === examId)
  if (!live()) return cached ? clone(cached) : null
  try {
    const { data, error } = await supabase
      .from(TABLE.attempts)
      .select('*')
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .limit(1)
.maybeSingle()
    if (!error && data) return clone(rowToAttempt(data))
  } catch {
    /* fall through to cache on a live query failure */
  }
  return cached ? clone(cached) : null
}

/** Persists a completed exam attempt (already graded by the caller). */
export async function createExamAttempt(attempt) {
  // A teacher can only record results for their own in-scope exams.
  const teacher = currentOwner()
  if (teacher) {
    const exam = cache.exams.find((e) => e.id === attempt?.examId)
    if (!exam || exam.teacherId !== teacher.id || !examWithinPermissions(teacher, exam)) {
      throw new Error('لا يمكنك تسجيل نتيجة على امتحان لا يخصك.')
    }
  }
  // One attempt per student per exam — never insert a duplicate.
  const existing = await findExamAttempt(attempt.studentId, attempt.examId)
  if (existing) {
    if (!cache.attempts.some((a) => a.id === existing.id)) cache.attempts = [existing, ...cache.attempts]
    return clone(existing)
  }

  const record = {
    ...attempt,
    id: `AT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
  }
  cache.attempts = [record, ...cache.attempts]

  if (live()) {
    await supabase.from(TABLE.attempts).insert(attemptToRow(record))
  }
  notify({
    type: 'exam_submitted',
    text: `قام الطالب "${attempt.studentName}" بتسليم امتحان "${attempt.examName}"`,
  })
  touchCache()
  return clone(record)
}

export async function deleteExamAttempt(attemptId) {
  const target = cache.attempts.find((a) => a.id === attemptId)
  if (target) {
    const teacher = currentOwner()
    if (teacher) {
      const exam = cache.exams.find((e) => e.id === target.examId)
      if (!exam || exam.teacherId !== teacher.id || !examWithinPermissions(teacher, exam)) {
        throw new Error('لا يمكنك حذف نتيجة خارج امتحاناتك.')
      }
    }
  }
  cache.attempts = cache.attempts.filter((a) => a.id !== attemptId)
  if (live()) {
    await supabase.from(TABLE.attempts).delete().eq('id', attemptId)
  }
  touchCache()
}

// ---------------------------------------------------------------------------
// Classes (الصفوف) — one row per class across all educational stages
// ---------------------------------------------------------------------------

export function listClasses() {
  if (isTeacherContext()) return []
  return clone(cache.classes)
}

export async function createClass(formValues) {
  assertAdminContext()
  const cls = {
    ...formValues,
    id: `CLS-${String(cache.classes.length + 1).padStart(2, '0')}`,
    studentsCount: 0,
    examsCount: 0,
  }
  cache.classes = [...cache.classes, cls]

  if (live()) {
    await supabase.from(TABLE.classes).insert(classToRow(cls))
  }
  touchCache()
  return clone(cls)
}

export async function updateClass(classId, formData) {
  assertAdminContext()
  cache.classes = cache.classes.map((c) => (c.id === classId ? { ...c, ...formData } : c))
  if (live()) {
    await supabase.from(TABLE.classes).update(formData).eq('id', classId)
  }
  touchCache()
}

export async function deleteClass(classId) {
  assertAdminContext()
  cache.classes = cache.classes.filter((c) => c.id !== classId)
  if (live()) {
    await supabase.from(TABLE.classes).delete().eq('id', classId)
  }
  touchCache()
}

// ---------------------------------------------------------------------------
// Demo data — one-click populate / reset used by the Demo Data admin page.
// Generates a full, consistent dataset so every dashboard fills up, or clears
// the system back to its empty state.
// ---------------------------------------------------------------------------

const DEMO_TABLES = ['students', 'teachers', 'subjects', 'exams', 'attempts', 'classes']

/* Candidate columns per table (full shape the app writes). The real project
   may have fewer columns, so inserts are stripped to the live column set. */
const MODEL_COLUMNS = {
  students: ['id', 'name', 'stage', 'grade', 'parent_phone', 'status', 'password', 'parent_pin', 'created_at'],
  teachers: ['id', 'name', 'subject', 'subjects', 'stages', 'grades', 'stage', 'grade', 'phone', 'status', 'username', 'password', 'session_token'],
  subjects: ['id', 'name', 'teachers_count', 'exams_count'],
  classes: ['id', 'name'],
  exams: ['id', 'name', 'subject', 'stage', 'grade', 'duration_minutes', 'status', 'created_at', 'scheduled_date', 'start_time', 'end_time', 'instructions', 'pass_score', 'archived', 'questions', 'teacher_id', 'teacher_name'],
  attempts: ['id', 'exam_id', 'exam_name', 'subject', 'grade', 'student_id', 'student_name', 'submitted_at', 'score', 'total_score', 'pass_score', 'passed', 'answers'],
}

const liveColumnsCache = {}

/** Returns the columns that actually exist on the live table (anon-safe probe). */
async function liveColumns(key) {
  if (!liveColumnsCache[key]) {
    const probe = await supabase.from(TABLE[key]).select('*').limit(1)
    let cols
    if (!probe.error && probe.data && probe.data.length) {
      cols = Object.keys(probe.data[0])
    } else {
      cols = []
      for (const c of MODEL_COLUMNS[key]) {
        const res = await supabase.from(TABLE[key]).select(c).limit(1)
        // PGRST204 means the column does not exist → drop it. Any other error
        // (e.g. 42501 permission denied) means the column exists but is not
        // readable by the current role — keep it so write payloads don't
        // silently drop values like `password` / `parent_pin`.
        if (!res.error || res.error.code !== 'PGRST204') cols.push(c)
      }
      if (!cols.length) cols = MODEL_COLUMNS[key]
    }
    liveColumnsCache[key] = cols
  }
  return liveColumnsCache[key]
}

/** Keeps only the column names that exist in `cols` for each row. */
function stripToRows(rows, cols) {
  return rows.map((row) => {
    const out = {}
    for (const c of cols) if (c in row) out[c] = row[c]
    return out
  })
}

/** Fills the repository with a generated demo dataset (and mirrors to DB when live). */
export async function loadDemoData() {
  const dataset = createDemoDataset()

  cache.students = dataset.students
  cache.teachers = dataset.teachers
  cache.subjects = dataset.subjects
  cache.exams = dataset.exams
  cache.attempts = dataset.attempts
  cache.classes = dataset.classes

  if (live()) {
    const inserts = [
      dataset.students.length ? { key: 'students', table: TABLE.students, rows: dataset.students.map(studentToRow) } : null,
      dataset.teachers.length ? { key: 'teachers', table: TABLE.teachers, rows: dataset.teachers } : null,
      dataset.subjects.length ? { key: 'subjects', table: TABLE.subjects, rows: dataset.subjects.map(subjectToRow) } : null,
      dataset.exams.length ? { key: 'exams', table: TABLE.exams, rows: dataset.exams.map(examToRow) } : null,
      dataset.attempts.length ? { key: 'attempts', table: TABLE.attempts, rows: dataset.attempts.map(attemptToRow) } : null,
      dataset.classes.length ? { key: 'classes', table: TABLE.classes, rows: dataset.classes.map(classToRow) } : null,
    ].filter(Boolean)

    // Insert only rows/columns; the live table may have fewer columns than the
    // model, so each payload is stripped to the columns that exist.
    for (const { table, key, rows } of inserts) {
      let res
      try {
        const cols = await liveColumns(key)
        const payload = stripToRows(rows, cols)
        if (key === 'classes') {
          // classes.id is an auto-generated UUID the app can't supply, and there
          // is no other unique column — a plain insert avoids the on_conflict=id 400.
          res = await supabase.from(table).insert(payload)
        } else {
          res = await supabase.from(table).upsert(payload, { onConflict: 'id' })
        }
      } catch (err) {
        console.error(`فشل كتابة بيانات جدول ${table}:`, err)
        throw new Error(`فشل كتابة بيانات جدول ${table}: ${err.message || err}`)
      }
      if (res && res.error) {
        console.error(`فشل كتابة بيانات جدول ${table}:`, res.error)
        throw new Error(`فشل كتابة بيانات جدول ${table}: ${res.error.message || res.error.messageCode || JSON.stringify(res.error)}`)
      }
    }
  }

  touchCache()

  return {
    students: cache.students.length,
    teachers: cache.teachers.length,
    subjects: cache.subjects.length,
    exams: cache.exams.length,
    attempts: cache.attempts.length,
    classes: cache.classes.length,
  }
}

/** Empties every table — resets the platform to its clean, empty state. */
export async function clearDemoData() {
  cache.students = []
  cache.teachers = []
  cache.subjects = []
  cache.exams = []
  cache.attempts = []
  cache.classes = []
  clearNotifications()
  touchCache()

  if (live()) {
    await Promise.all(
      DEMO_TABLES.map((table) =>
        supabase
          .from(TABLE[table])
          .delete()
          // classes.id is a UUID; a text sentinel would throw a cast error,
          // so use a valid zero-UUID there and a text sentinel elsewhere.
          .neq('id', table === 'classes' ? '00000000-0000-0000-0000-000000000000' : 'noop')
      )
    )
  }
}

// ---------------------------------------------------------------------------
// Admin — wipe all operational data (secure RPC, NOT a frontend DELETE).
// Deletes students / teachers / exams / attempts rows ONLY. The static
// catalog tables (subjects, classes) are intentionally left untouched.
// ---------------------------------------------------------------------------

// Server-side gate token. MUST match the constant in supabase/admin_wipe.sql.
// Read the security note in that file before changing this value.
const ADMIN_WIPE_TOKEN = 'crev-wipe-gate-0f8c2e9a-4b1d-47c6-a93e-5d2f1b7a8c04'

/**
 * Erases all operational data (students, teachers, exams, attempts) through
 * the `admin_wipe_all_operational_data` RPC — never a direct client DELETE.
 * The DB function is a single transaction, so on failure nothing is deleted
 * and the in-memory cache is left untouched. Static catalog (subjects,
 * classes) is preserved as-is.
 */
export async function wipeAllOperationalData() {
  assertAdminContext()

  let counts = { students: 0, teachers: 0, exams: 0, attempts: 0 }

  if (live()) {
    const { data, error } = await supabase.rpc('admin_wipe_all_operational_data', {
      p_admin_token: ADMIN_WIPE_TOKEN,
    })
    if (error) {
      console.error('[wipeAllOperationalData] فشل محو البيانات من Supabase:', error)
      throw new Error(
        error.code === 'PGRST202' || error.code === '42883'
          ? 'دالة المحو غير منشورة على Supabase بعد. شغّل ملف supabase/admin_wipe.sql من SQL Editor ثم أعد المحاولة.'
          : error.message || 'تعذّر تنفيذ محو البيانات على الخادم.'
      )
    }
    const row = data && data[0]
    counts = {
      students: row?.students_deleted ?? 0,
      teachers: row?.teachers_deleted ?? 0,
      exams: row?.exams_deleted ?? 0,
      attempts: row?.attempts_deleted ?? 0,
    }
  }

  cache.students = []
  cache.teachers = []
  cache.exams = []
  cache.attempts = []
  clearNotifications()
  touchCache()
  return counts
}