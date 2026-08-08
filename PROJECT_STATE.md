# CREV Exam Platform — Project State / Progress Documentation

> This file is the single source of truth for the current state of the project.
> Read this first before making any change so you can continue where the last
> developer left off.

Last updated: 2026-08-08

---

## 1. Project Overview

**CREV Exam Platform** is a React (Vite) + Supabase exam management application.

- **Roles:** Admin, Teacher, Student (and a Parent login placeholder).
- **Data:** Supabase Postgres, accessed via the `anon`/publishable key (permissive
  RLS demo policies). Falls back to an in-memory mock cache when no credentials.
- **UI:** Tailwind CSS, `framer-motion`, `react-icons`, `react-router-dom`.

### Key paths
- `src/services/repository.js` — the data layer (CRUD + Supabase + in-memory cache).
- `src/services/supabase.js` — Supabase client / `isSupabaseConfigured`.
- `src/services/auth.js` — teacher session helpers (`getCurrentTeacher`, etc.).
- `src/hooks/useExams.js` — exam roster + owner scoping.
- `src/components/teacher/ExamInfoForm.jsx` — Step 1 exam info (permission-driven).
- `src/components/teacher/TeacherQuestionBuilder.jsx` — Step 2 question builder.
- `src/components/exams/QuestionForm.jsx`, `QuestionCard.jsx`, `ExamPreview.jsx`,
  `ExamStats.jsx` — question editing + preview.
- `src/pages/teacher/Exams.jsx` — teacher exam list + wizard host + save logic.
- `supabase/schema.sql` — idempotent schema/seed (run in Supabase SQL Editor).

---

## 2. Current Database Changes (Supabase)

Done (already applied to the live project):
- **`exams` table was updated.**
- **`teacher_id` column was ADDED** (`text`).
- Added other missing columns if not present: `teacher_name`, `questions`
  (`jsonb`), `status`, `pass_score`, `archived`, `instructions`,
  `scheduled_date`, `start_time`, `end_time`, `duration_minutes`, `created_at`.
- Existing rows without a `teacher_id` were backfilled/fixed.
- **Teacher permissions on `teachers`:** new `subjects`/`stages`/`grades`
  (`jsonb`) columns. (Applied via `schema.sql`; verify they exist in the live DB.)

Rule now in effect:
- **Every exam must be linked to a teacher via `teacher_id`.** Admin-created
  exams may carry no teacher; teacher-created exams must always be linked.

> When columns are missing in a live DB, the app auto-strips them via
> `liveColumns()` + `stripToRows()` (no 400) and falls back to legacy fields.

---

## 3. Current Bug & Solution (THIS session)

### Symptom
Exams were **saved successfully** (toast "تم حفظ الامتحان") but **disappeared after
refresh** and could not be found.

### Root cause
- `createExam()` built a payload with `teacher_id`, but the live `exams` table
  **did not have the `teacher_id` column**.
- `stripToRows()` stripped it out → the row persisted with `teacher_id = NULL`.
- On refresh, `hydrateAll()` reads rows with `teacher_id = null` →
  `rowToExam` → `teacherId = null`.
- `useExams({ ownerId })` filters `e.teacherId === owner.id` → the un-linked exam
  was **filtered out** and appeared "disappeared".

### Solution
- **DB:** add `teacher_id` (done).
- **JS:** `createExam` must always send `teacher_id: currentTeacher.id`.
- **Verify the insert response** contains `teacher_id`, and throw on missing or
  mismatched `teacher_id` (no fake success).
- **Verify fetching** (`hydrateAll` → `useExams`/`listExamsForTeacher`) scopes by
  `teacher_id` only.

---

## 4. JavaScript Changes Completed

### `src/services/repository.js`
- **`createExam(examData)`**
  - Sets owner on the exam object (credit: `currentOwner()` / `getCurrentTeacher()`):
    ```js
    teacherId:  owner ? owner.id  : (examData.teacherId ?? null),
    teacherName: owner ? owner.name : (examData.teacherName ?? null),
    ```
  - Builds payload via `examToRow(exam)` → `stripToRows(..., liveColumns('exams'))`
    → sends `teacher_id` (once the column exists).
  - Logs: `[createExam] current teacher`, `teacher perms`, `Exam payload`,
    `[createExam] insert response`, `inserted exam teacher_id`.
  - **Throws (real errors, not fake success)** when:
    - Supabase returns an error (logs `error.message` / `details` / `hint`).
    - Insert returns no row (nothing persisted).
    - `teacher_id` is missing/`null` in the returned row.
    - Stored `teacher_id` mismatches `currentTeacher.id` (String comparison).
- **`rowToExam`** reads `teacherId: row.teacher_id ?? null`.
- **`examToRow`** writes `teacher_id: exam.teacherId` (plus all other fields).
- **`listExamsForTeacher(teacherId)`** filters by `teacher_id` only (no subject filter).
- **`hydrateAll`** logs exams fetched + owner-filter example.

### `src/hooks/useExams.js`
- **`scopeExams(list)`** now filters **only by `ownerId` / `teacher_id`**,
  not by `ownerSubject`. (Fix: exams a teacher created in any *allowed* subject
  other than their primary one were previously hidden.)
- `addExam/editExam/removeExam/copyExam` re-scope from `repo.listExams()` after
  each mutation so the list updates immediately.

### Earlier related fixes (also in the codebase)
- Teacher multi-permission arrays, `rowToTeacher`/`teacherToRow` mappers,
  `normal`/`asList`/`inAllowed` robust matching (trim + case-insensitive + quote
  strip, handles `Array` / JSON string / plain string / `null` / `undefined`).
- `assertWithinPermissions` reads `subjects`/`stages`/`grades` arrays; call order
  is `inAllowed(subjects, subject)` / `inAllowed(stages, stage)` /
  `inAllowed(grades, grade)`.
- Teacher Question Builder fully wired (add/edit/delete/duplicate/reorder, MCQ +
  TF, MCQ now supports **2–6 options**).
- Fixed a bug where the question modal wasn't mounted while inside the builder
  (Question modal + preview are now rendered in the builder branch of
  `src/pages/teacher/Exams.jsx`).

---

## 5. Remaining Tasks / Open Items

1. **Verify end-to-end persist flow in the live app:**
   Create → Save → **Refresh** → exam must still appear for the teacher.
2. Confirm `teacher_id` is set even for exams created by students/admin
   (admin-created exams intentionally carry no teacher — confirm list still shows,
   since admin passes `ownerId = null`).
3. (Optional) Remove/resolve the temporary `console.log` / `console.warn`
   diagnostics once verified — or keep a couple for DevTools debugging.
4. Confirm the **`questions` (jsonb) round-trip** — questions saved on create and
   loaded on edit.
5. If `subjects/stages/grades` columns were re-added to the live `teachers` table
   after a prior migration, re-verify the admin teacher CRUD persists them across
   refresh.
6. Runtime: no lint errors (`npm run lint`) and `npm run build` succeeds
   (currently passing).

---

## 6. Current Errors / Things to Check

- [x] `teacher_id` missing → **resolved** (column added + payload sends it + verify).
- [ ] Confirm there is **no leftover exam with `teacher_id = null`** that should be
      linked to its rightful teacher (admin screen can audit).
- [ ] Watch the browser console for:
  - `[createExam] MISMATCH → saved … but current teacher id is …` — means two
    codes disagree on the teacher identifier (fix the id source).
  - `[hydrateAll] exams fetch :` row count — ensure rows are fetched.
  - RLS errors from Supabase (policies are permissive; tighten later).
- [ ] After the build, the `QuestionForm` modal must still open from the builder
      (that was fixed; re-confirm no regression).

---

## 8. How to Continue (developer onboarding)

### Run
```bash
npm install
npm run dev     # dev server (Vite)
npm run build   # production build
npm run lint    # oxlint (currently clean)
```

### Supabase (only if she attached jobs was created)
Run the idempotent `supabase/schema.sql` in the Supabase SQL Editor. Targeted
one-off `ALTER`s are also collected there. The app works with the `anon` key;
schema changes require the Supabase dashboard (no service-role key in this repo).

### Where to look first when an exam "disappears"
1. `src/services/repository.js` → `createExam` → read the `Exam payload:` log and
   `[createExam] inserted exam teacher_id :`.
2. `src/pages/util/hooks/useExams.js` → `scopeExams` / the hook filter
   (`e.teacherId === ownerId`).
3. `supabase/schema.sql` → `exams` columns.

### Important naming
- DB column `teacher_id` ↔ app field `teacherId` (mapped by `rowToExam`).
- DB columns `subjects`/`stages`/`grades` ↔ app arrays on the teacher object.

---

## 9. Constraints (respected throughout)

- **No UI/design changes.**
- **No new features** beyond the requested fixes.
- Keep **minimal edits** and preserve all existing features.

---

## 10. Teacher RBAC (permissions enforcement) — 2026-08-08

Goal: a teacher only ever sees/manages data inside the scope the admin grants
(subjects / stages / grades), even against crafted URLs or raw API requests.
Enforced at BOTH the data layer and the database, not just hidden in the UI.

### Database (`supabase/rbac_teacher.sql` — run AFTER `schema.sql`)
- New `teachers.session_token` column.
- `teacher_login` — SECURITY DEFINER login RPC (validates credentials, rotates
  `session_token`, never exposes the password column).
- `teacher_scoped_students` / `teacher_scoped_exams` / `teacher_scoped_attempts`
  — SECURITY DEFINER read RPCs. Each verifies the session token (unforgeable
  identity) and re-reads the teacher's OWN admin-defined permissions from the
  `teachers` table, filtering the rows in SQL. Passing another teacher's id
  returns NOTHING.

### Data layer (`src/services/repository.js`)
- When a teacher is logged in, `hydrateAll` fetches ONLY scoped rows via the
  RPCs (out-of-scope data never reaches the browser cache).
- `listStudents`/`listExams`/`listExamAttempts` are teacher-scoped; a teacher
  also gets `[]` from `listTeachers`/`listSubjects`/`listClasses`.
- Admin-only mutations (`createTeacher`/`updateTeacher`/`deleteTeacher`,
  subject & class CRUD, `createStudent`, `loadTeachers`) now throw for a
  teacher context (`assertAdminContext`), so a teacher cannot change their own
  permissions or reach other teachers even via a crafted call.
- Student edit/delete (`assertStudentInScope`) and attempt create/delete are
  scope-checked; `getTeacherById` returns only the caller's own profile.

### Routing (RBAC on routes)
- New `src/components/auth/RouteGuard.jsx`: `RequireTeacher` (teacher routes)
  and `BlockTeacher` (student/parent/admin-login routes redirect a logged-in
  teacher to their own dashboard).
- `AdminLayout` now sends a logged-in teacher back to `/teacher/dashboard`
  instead of the admin login page.

### To deploy
Run `supabase/schema.sql` then `supabase/rbac_teacher.sql` in the Supabase SQL
editor. Until the RPCs exist the app falls back to full-table loads with
JS-side scoping (works, weaker). After deploying, teachers must log in again
so their session carries the new `session_token`.