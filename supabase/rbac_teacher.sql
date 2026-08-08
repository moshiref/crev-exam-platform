-- ============================================================================
-- CREV Exam Platform — Teacher RBAC (database-level authorization)
--
-- FIXES the "POST /rest/v1/rpc/teacher_scoped_* 404" errors. Those 404s mean
-- this migration was never executed on the project. Run this file in the
-- Supabase SQL editor (Dashboard → SQL → New query), AFTER schema.sql. It is
-- safe to run multiple times (CREATE OR REPLACE + ADD COLUMN IF NOT EXISTS).
--
-- Why NOT `auth.uid()`:
--   Teachers log in with username/password stored in `public.teachers` (a
--   custom login, not Supabase Auth), so there are NO `auth.users` rows and
--   `auth.uid()` is always NULL for these anon REST calls. Using it would
--   break the entire login flow. Instead the enforcement model is:
--     1. `teacher_login` (SECURITY DEFINER) validates the credentials and
--        rotates a random `session_token` stored on the teacher's row.
--     2. Every `teacher_scoped_*` RPC verifies that the supplied
--        `p_teacher_id` + `p_session_token` pair matches a row in
--        `teachers` (in SQL), then filters students/exams/attempts IN SQL to
--        the teacher's OWN admin-granted scope.
--   Passing another teacher's id — or a wrong token — returns NOTHING, so a
--   teacher can never read another teacher's data by tampering with the
--   request from DevTools.
--
-- Schema-drift fixes included (verified against the live project):
--   * `teachers.session_token` column is added if missing.
--   * `exams.teacher_name` column is added if missing (older DBs lack it).
--   * Permission columns (`subjects` / `stages` / `grades`) are parsed with a
--     normalizer that handles BOTH real jsonb arrays (schema.sql) and the
--     JSON-encoded text strings older DBs / the app actually store
--     (e.g. '["الرياضيات"]'). Matching an empty / missing list means the
--     teacher is "unrestricted" for that dimension — same as the app's JS.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Schema-drift backfills (idempotent, no-op when already present)
-- ---------------------------------------------------------------------------
alter table public.teachers add column if not exists session_token text not null default '';
alter table public.exams add column if not exists teacher_id     text not null default '';
alter table public.exams add column if not exists teacher_name   text not null default '';

-- ---------------------------------------------------------------------------
-- Normalizes a teacher permission value into a jsonb ARRAY:
--   NULL / '' / '[]'            → '[]'        (empty → "unrestricted")
--   '["أ","ب"]' (text JSON)     → '["أ","ب"]'
--   real jsonb array (as text)  → the array
--   'أ,ب' (plain CSV)           → '["أ","ب"]'
-- Malformed JSON falls back to '[]' instead of aborting the whole query.
-- Not exposed via PostgREST (execute revoked below) — internal helper only.
-- ---------------------------------------------------------------------------
create or replace function public._teacher_perm_values(p_raw text)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_trim text := btrim(coalesce(p_raw, ''));
begin
  if v_trim = '' then
    return '[]'::jsonb;
  end if;
  if left(v_trim, 1) = '[' then
    begin
      return v_trim::jsonb;
    exception when others then
      return '[]'::jsonb;
    end;
  end if;
  return to_jsonb(array_remove(string_to_array(v_trim, ','), ''));
end;
$$;

revoke all on function public._teacher_perm_values(text) from public;

-- ---------------------------------------------------------------------------
-- Teacher login — validates credentials, rotates the session token and
-- returns ONLY safe columns (never the password). Mirrors `student_login`.
-- ---------------------------------------------------------------------------
create or replace function public.teacher_login(
  p_username text,
  p_password text
)
returns table (
  id            text,
  name          text,
  subject       text,
  subjects      jsonb,
  stages        jsonb,
  grades        jsonb,
  phone         text,
  username      text,
  status        text,
  session_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher public.teachers%rowtype;
  v_token   text;
begin
  select * into v_teacher
  from public.teachers t
  where t.username = p_username
    and t.password = p_password
    and t.status = 'Active'
  limit 1;

  if v_teacher.id is null then
    return;
  end if;

  -- Fresh random token per login (md5 of two core gen_random_uuid() values).
  v_token := md5(gen_random_uuid()::text || gen_random_uuid()::text);

  update public.teachers
     set session_token = v_token
   where id = v_teacher.id;

  return query
    select v_teacher.id, v_teacher.name, v_teacher.subject,
           public._teacher_perm_values(v_teacher.subjects::text),
           public._teacher_perm_values(v_teacher.stages::text),
           public._teacher_perm_values(v_teacher.grades::text),
           v_teacher.phone, v_teacher.username, v_teacher.status,
           v_token;
end;
$$;

grant execute on function public.teacher_login(text, text) to anon;

-- ---------------------------------------------------------------------------
-- Scoped students — only students whose stage AND grade are inside the
-- teacher's admin-defined permissions. An empty / missing stages or grades
-- list means the teacher sees NO students (admin must grant a scope).
-- Returns NOTHING when the session token is invalid or the account inactive.
-- `password` is returned (not `parent_pin`) because the teacher dashboard
-- shows each of their own students' login password for distribution.
-- ---------------------------------------------------------------------------
create or replace function public.teacher_scoped_students(
  p_teacher_id   text,
  p_session_token text
)
returns table (
  id           text,
  name         text,
  stage        text,
  grade        text,
  parent_phone text,
  status       text,
  password     text,
  created_at   date
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.stage, s.grade, s.parent_phone, s.status, s.password, s.created_at
  from public.students s
  join public.teachers t
    on t.id = p_teacher_id
   and t.session_token = p_session_token
   and t.status = 'Active'
  where jsonb_array_length(public._teacher_perm_values(t.stages::text)) > 0
    and jsonb_array_length(public._teacher_perm_values(t.grades::text)) > 0
    and public._teacher_perm_values(t.stages::text) ? s.stage
    and public._teacher_perm_values(t.grades::text) ? s.grade
  order by s.name;
$$;

grant execute on function public.teacher_scoped_students(text, text) to anon;

-- ---------------------------------------------------------------------------
-- Scoped exams — only exams owned by the teacher (teacher_id) whose
-- subject / stage / grade are inside the teacher's admin-defined permissions.
-- An empty permission list for a dimension means "unrestricted" for it
-- (matches the app's JS scoping).
-- ---------------------------------------------------------------------------
create or replace function public.teacher_scoped_exams(
  p_teacher_id   text,
  p_session_token text
)
returns table (
  id               text,
  name             text,
  subject          text,
  stage            text,
  grade            text,
  duration_minutes int,
  status           text,
  created_at       text,
  scheduled_date   text,
  start_time       text,
  end_time         text,
  instructions     text,
  pass_score       int,
  archived         boolean,
  questions        jsonb,
  teacher_id       text,
  teacher_name     text
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.name, e.subject, e.stage, e.grade, e.duration_minutes,
         e.status, e.created_at, e.scheduled_date, e.start_time, e.end_time,
         e.instructions, e.pass_score, e.archived, e.questions,
         e.teacher_id, e.teacher_name
  from public.exams e
  join public.teachers t
    on t.id = p_teacher_id
   and t.session_token = p_session_token
   and t.status = 'Active'
  where e.teacher_id = p_teacher_id
    and (jsonb_array_length(public._teacher_perm_values(t.subjects::text)) = 0
         or public._teacher_perm_values(t.subjects::text) ? e.subject)
    and (jsonb_array_length(public._teacher_perm_values(t.stages::text)) = 0
         or public._teacher_perm_values(t.stages::text) ? e.stage)
    and (jsonb_array_length(public._teacher_perm_values(t.grades::text)) = 0
         or public._teacher_perm_values(t.grades::text) ? e.grade)
  order by e.created_at desc;
$$;

grant execute on function public.teacher_scoped_exams(text, text) to anon;

-- ---------------------------------------------------------------------------
-- Scoped attempts (results) — only attempts submitted on the teacher's own
-- exams, further limited to the teacher's subject / stage / grade scope.
-- ---------------------------------------------------------------------------
create or replace function public.teacher_scoped_attempts(
  p_teacher_id   text,
  p_session_token text
)
returns table (
  id           text,
  exam_id      text,
  exam_name    text,
  subject      text,
  grade        text,
  student_id   text,
  student_name text,
  submitted_at text,
  score        int,
  total_score  int,
  pass_score   int,
  passed       boolean,
  answers      jsonb
)
language sql
security definer
set search_path = public
as $$
  select a.id, a.exam_id, a.exam_name, a.subject, a.grade, a.student_id,
         a.student_name, a.submitted_at, a.score, a.total_score,
         a.pass_score, a.passed, a.answers
  from public.exam_attempts a
  join public.exams e on e.id = a.exam_id
  join public.teachers t
    on t.id = p_teacher_id
   and t.session_token = p_session_token
   and t.status = 'Active'
  where e.teacher_id = p_teacher_id
    and (jsonb_array_length(public._teacher_perm_values(t.subjects::text)) = 0
         or public._teacher_perm_values(t.subjects::text) ? e.subject)
    and (jsonb_array_length(public._teacher_perm_values(t.stages::text)) = 0
         or public._teacher_perm_values(t.stages::text) ? e.stage)
    and (jsonb_array_length(public._teacher_perm_values(t.grades::text)) = 0
         or public._teacher_perm_values(t.grades::text) ? e.grade)
  order by a.submitted_at desc;
$$;

grant execute on function public.teacher_scoped_attempts(text, text) to anon;
