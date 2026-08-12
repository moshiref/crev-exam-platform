-- ============================================================================
-- CREV Exam Platform — FULL PROVISIONING SCRIPT (run ONCE on the NEW project)
--
--   Target DB : the brand-new Supabase project whose URL + anon/publishable key
--               you placed in `.env` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
--   Run       : Supabase Dashboard -> SQL Editor -> New query -> paste ALL of
--               this file -> Run. Safe to run more than once (idempotent).
--
-- THIS SCRIPT IS THE ENTIRE DATABASE SETUP:
--   * creates the 6 tables (empty — no rows are ever inserted),
--   * grants the privileges `anon`/`authenticated` need (fixes the 401),
--   * enables RLS + the permissive table policies the platform's DESIGN uses,
--   * revokes SELECT on the secret student columns (password / parent_pin),
--   * creates every RPC the app calls (teacher_login / teacher_scoped_* /
--     student_login / parent_login / admin_wipe_all_operational_data).
--
-- WHY PERMISSIVE TABLE POLICIES (design, see REPORT.md §3):
--   The app does NOT use Supabase Auth. It carries ONE REST key (the publishable
--   key → PostgREST role `anon`), and the "admin" is a client-side demo session.
--   So table-level RLS cannot distinguish admin/teacher/student/parent. The real
--   isolation happens at the RPC layer (SECURITY DEFINER functions that verify
--   credentials / session tokens) + the secret-column revoke below. Tightening
--   to per-role policies is a documented future step that REQUIRES Supabase Auth
--   (auth.uid()) — changing it now would break the whole app.
--
-- NO DATA OF ANY KIND IS INSERTED HERE. The database starts empty; the app
-- never seeds automatically.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) TABLES (match the app's row mappers in src/services/repository.js)
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id           text primary key,              -- CREV-1001
  name         text not null,
  stage        text not null,
  grade        text not null,
  parent_phone text not null,
  status       text not null default 'Active',
  password     text not null,
  parent_pin   text not null,
  created_at   date not null default current_date
);

create table if not exists public.teachers (
  id       text primary key,                  -- T-001
  name     text not null,
  subject  text not null,
  phone    text not null default '',
  status   text not null default 'Active',
  username text not null default '',
  password text not null default '',
  subjects jsonb not null default '[]'::jsonb,
  stages   jsonb not null default '[]'::jsonb,
  grades   jsonb not null default '[]'::jsonb,
  session_token text not null default ''
);

create table if not exists public.subjects (
  id             text primary key,            -- SUB-01
  name           text not null unique,
  teachers_count int not null default 0,
  exams_count    int not null default 0
);

create table if not exists public.classes (
  id             text primary key,            -- CLS-01 (text by design — the
  stage          text not null default '',    -- app's createClass supplies it)
  name           text not null,
  students_count int not null default 0,
  exams_count    int not null default 0
);

create table if not exists public.exams (
  id               text primary key,          -- EX-001
  name             text not null,
  subject          text not null,
  stage            text not null,
  grade            text not null,
  duration_minutes int not null default 30,
  status           text not null default 'Draft',
  created_at       text not null default to_char(now(), 'YYYY-MM-DD'),
scheduled_date text not null default '',
  start_time text default '',
  end_time text default '',
  instructions     text not null default '',
  pass_score       int not null default 0,
  archived         boolean not null default false,
  questions        jsonb not null default '[]'::jsonb,
  teacher_id       text not null default '',
  teacher_name     text not null default ''
);

create table if not exists public.exam_attempts (
  id           text primary key,              -- AT-1001
  exam_id      text not null,
  exam_name    text not null,
  subject      text not null,
  grade        text not null,
  student_id   text not null,
  student_name text not null,
  submitted_at text not null,
  score        int not null default 0,
  total_score  int not null default 0,
  pass_score   int not null default 0,
  passed       boolean not null default false,
  answers      jsonb not null default '[]'::jsonb
);

-- ---------------------------------------------------------------------------
-- 2) ROLE GRANTS — THE 401 FIX
--    Fresh Supabase projects give `anon`/`authenticated` NO privileges on
--    tables created via the SQL editor; without these every REST call answers
--    HTTP 401 {"code":"42501","message":"permission denied for table ..."}.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to anon, authenticated;

grant usage, select
  on all sequences in schema public
  to anon, authenticated;

grant execute on all functions in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) ROW LEVEL SECURITY — enabled everywhere, permissive policies (design)
-- ---------------------------------------------------------------------------
alter table public.students      enable row level security;
alter table public.teachers      enable row level security;
alter table public.subjects      enable row level security;
alter table public.classes       enable row level security;
alter table public.exams         enable row level security;
alter table public.exam_attempts enable row level security;

drop policy if exists "students read/write demo" on public.students;
create policy "students read/write demo"
  on public.students for all using (true) with check (true);

drop policy if exists "teachers read/write demo" on public.teachers;
create policy "teachers read/write demo"
  on public.teachers for all using (true) with check (true);

drop policy if exists "subjects read/write demo" on public.subjects;
create policy "subjects read/write demo"
  on public.subjects for all using (true) with check (true);

drop policy if exists "classes read/write demo" on public.classes;
create policy "classes read/write demo"
  on public.classes for all using (true) with check (true);

drop policy if exists "exams read/write demo" on public.exams;
create policy "exams read/write demo"
  on public.exams for all using (true) with check (true);

drop policy if exists "exam_attempts read/write demo" on public.exam_attempts;
create policy "exam_attempts read/write demo"
  on public.exam_attempts for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 4) SECRET COLUMNS — student passwords / parent PINs are NOT readable by
--    the REST key. Logins validate server-side via the RPCs below.
-- ---------------------------------------------------------------------------
revoke select (password, parent_pin) on public.students from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) FUNCTION: _teacher_perm_values (internal normalizer — NOT callable)
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

revoke all on function public._teacher_perm_values(text) from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- 6) FUNCTION: teacher_login — validate credentials, rotate the session token,
--    return ONLY safe columns (never the password).
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

grant execute on function public.teacher_login(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7) FUNCTION: teacher_scoped_students — only the teacher's own granted
--    stage+grade students; verified by (id + session_token); returns password
--    because the teacher dashboard prints their students' login codes.
-- ---------------------------------------------------------------------------
create or replace function public.teacher_scoped_students(
  p_teacher_id    text,
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

grant execute on function public.teacher_scoped_students(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8) FUNCTION: teacher_scoped_exams — the teacher's OWN exams, within their
--    granted subject/stage/grade scope (empty list = unrestricted, matching
--    the app's JS scoping). Verified identity via id + session_token.
-- ---------------------------------------------------------------------------
create or replace function public.teacher_scoped_exams(
  p_teacher_id    text,
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

grant execute on function public.teacher_scoped_exams(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9) FUNCTION: teacher_scoped_attempts — results only for the teacher's OWN
--    exams, within their granted scope.
-- ---------------------------------------------------------------------------
create or replace function public.teacher_scoped_attempts(
  p_teacher_id    text,
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

grant execute on function public.teacher_scoped_attempts(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10) FUNCTION: student_login — verifies id + password in the DB, returns only
--     non-secret fields. NEVER exposes the password to the client.
-- ---------------------------------------------------------------------------
create or replace function public.student_login(
  p_student_id text,
  p_password   text
)
returns table (
  id           text,
  name         text,
  stage        text,
  grade        text,
  status       text,
  parent_phone text
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.stage, s.grade, s.status, s.parent_phone
  from public.students s
  where s.id = p_student_id
    and s.password = p_password
    and s.status = 'Active'
  limit 1;
$$;

grant execute on function public.student_login(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11) FUNCTION: parent_login — verifies the 4-digit PIN; returns up to two
--     active matches so the app enforces "exactly one".
-- ---------------------------------------------------------------------------
create or replace function public.parent_login(
  p_pin text
)
returns table (
  id           text,
  name         text,
  stage        text,
  grade        text,
  status       text,
  parent_phone text
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.stage, s.grade, s.status, s.parent_phone
  from public.students s
  where s.parent_pin = p_pin
    and s.status = 'Active'
  limit 2;
$$;

grant execute on function public.parent_login(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 12) FUNCTION: admin_wipe_all_operational_data — token-gated FULL wipe of
--     students / teachers / exams / attempts (single transaction). Token MUST
--     match src/services/repository.js ADMIN_WIPE_TOKEN.
-- ---------------------------------------------------------------------------
create or replace function public.admin_wipe_all_operational_data(
  p_admin_token text
)
returns table (
  students_deleted bigint,
  teachers_deleted bigint,
  exams_deleted    bigint,
  attempts_deleted bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_students  bigint;
  v_teachers  bigint;
  v_exams     bigint;
  v_attempts  bigint;
begin
  if p_admin_token is distinct from 'crev-wipe-gate-0f8c2e9a-4b1d-47c6-a93e-5d2f1b7a8c04' then
    raise exception 'غير مصرح: محو جميع البيانات متاح للإدارة فقط.'
      using errcode = '42501';
  end if;

  with d as (delete from public.exam_attempts returning 1)
    select count(*) into v_attempts from d;
  with d as (delete from public.exams returning 1)
    select count(*) into v_exams from d;
  with d as (delete from public.students returning 1)
    select count(*) into v_students from d;
  with d as (delete from public.teachers returning 1)
    select count(*) into v_teachers from d;

  return query select v_students, v_teachers, v_exams, v_attempts;
end;
$$;

revoke all on function public.admin_wipe_all_operational_data(text) from public;
grant execute on function public.admin_wipe_all_operational_data(text) to anon, authenticated;

-- ============================================================================
-- DONE. VERIFY from the browser / REST client after running:
--   GET https://<your-project-ref>.supabase.co/rest/v1/teachers?select=*
--   headers: { apikey: <VITE_SUPABASE_ANON_KEY>,
--              Authorization: 'Bearer ' + <VITE_SUPABASE_ANON_KEY> }
--   → HTTP 200  []
-- ============================================================================