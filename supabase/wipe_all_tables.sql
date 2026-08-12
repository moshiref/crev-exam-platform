-- ============================================================================
-- CREV Exam Platform — FULL DATA RESET (start from a completely empty DB)
--
-- Deletes EVERY row from ALL six tables — including anything that was added
-- manually or by an older seed — so the platform boots into a truly empty
-- state:
--     students, teachers, subjects, classes, exams, exam_attempts
--
-- This is a one-time administrative reset. Run it in the Supabase SQL editor
-- (Dashboard -> SQL -> New query) — the editor runs as the table owner, so it
-- can truncate regardless of RLS. Afterwards every dashboard shows 0 and no
-- demo/mock/old records appear anywhere.
--
-- SAFETY NOTES:
--   * Transactional (BEGIN + COMMIT): on any error nothing is deleted.
--   * TRUNCATE ignores any old seed/manual data and resets nothing but the
--     rows — schema, columns, RLS and functions stay untouched.
--   * There are no Foreign Keys in this schema, so CASCADE is harmless.
-- ============================================================================

begin;

truncate table public.exam_attempts cascade;
truncate table public.exams         cascade;
truncate table public.students      cascade;
truncate table public.teachers      cascade;
truncate table public.subjects      cascade;
truncate table public.classes       cascade;

commit;

-- VERIFY after running:
--   select 'students' as tbl, count(*) from public.students
--   union all select 'teachers', count(*) from public.teachers
--   union all select 'subjects', count(*) from public.subjects
--   union all select 'classes',  count(*) from public.classes
--   union all select 'exams',    count(*) from public.exams
--   union all select 'attempts', count(*) from public.exam_attempts;
--   → all six rows read 0.