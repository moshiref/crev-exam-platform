-- ============================================================================
-- CREV Exam Platform — Supabase schema
--
-- Safe to run MULTIPLE TIMES: every table uses CREATE TABLE IF NOT EXISTS,
-- columns use ADD COLUMN IF NOT EXISTS, and policies are dropped before being
-- recreated. You can re-run this in the Supabase SQL editor whenever the
-- schema changes without hitting "policy already exists" errors.
--
-- Row-level security is enabled but kept permissive so the demo works with
-- the anon key. Tighten the policies to `authenticated` once real auth is
-- introduced.
--
-- Table list:
--   public.students, public.teachers, public.subjects, public.classes,
--   public.exams, public.exam_attempts
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Students (column names are snake_case; the app maps them to camelCase)
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id          text primary key,          -- e.g. CREV-1006
  name        text not null,
  stage       text not null,
  grade       text not null,
  parent_phone text not null,
  status      text not null default 'Active',
  password    text not null,           -- auto-generated 6-digit login
  parent_pin  text not null,            -- auto-generated 4-digit parent login
  created_at  date not null default current_date
);

-- ---------------------------------------------------------------------------
-- Teachers (includes login credentials created in the Teachers page)
-- ---------------------------------------------------------------------------
create table if not exists public.teachers (
  id       text primary key,
  name     text not null,
  subject  text not null,
  phone    text not null,
  status   text not null default 'Active',
  username text not null default '',
  password text not null default '',
  subjects jsonb not null default '[]'::jsonb, -- teaching permissions (admin-defined)
  stages   jsonb not null default '[]'::jsonb, -- teaching permissions (admin-defined)
  grades   jsonb not null default '[]'::jsonb  -- teaching permissions (admin-defined)
);
-- Backfill for databases created before these columns existed:
alter table public.teachers add column if not exists username text not null default '';
alter table public.teachers add column if not exists password text not null default '';
alter table public.teachers add column if not exists subjects jsonb not null default '[]'::jsonb;
alter table public.teachers add column if not exists stages   jsonb not null default '[]'::jsonb;
alter table public.teachers add column if not exists grades   jsonb not null default '[]'::jsonb;
alter table public.teachers add column if not exists session_token text not null default '';

-- ---------------------------------------------------------------------------
-- Subjects (teachers_count / exams_count are counts the app pre-computes)
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id            text primary key,
  name          text not null unique,
  teachers_count int not null default 0,
  exams_count   int not null default 0
);

-- ---------------------------------------------------------------------------
-- Classes (الصفوف) — one row per grade/stage; app joins students & exams counts
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id             text primary key,
  stage          text not null,
  name           text not null,
  students_count int not null default 0,
  exams_count    int not null default 0
);

-- ---------------------------------------------------------------------------
-- Exams (questions stored as JSONB to keep a single row per exam)
-- ---------------------------------------------------------------------------
create table if not exists public.exams (
  id               text primary key,
  name             text not null,
  subject          text not null,
  stage            text not null,
  grade            text not null,
  duration_minutes int not null default 30,
  status           text not null default 'Draft',
  created_at       text not null default to_char(now(), 'YYYY-MM-DD'),
  scheduled_date   text not null default '',
  start_time       text not null default '',
  end_time         text not null default '',
  instructions     text not null default '',
  pass_score       int not null default 0,
  archived         boolean not null default false,
  questions        jsonb not null default '[]'::jsonb,
  teacher_id       text not null default '',
  teacher_name     text not null default ''
);
-- Backfill for databases created before newer columns existed:
alter table public.exams add column if not exists pass_score     int not null default 0;
alter table public.exams add column if not exists archived      boolean not null default false;
alter table public.exams add column if not exists questions     jsonb not null default '[]'::jsonb;
alter table public.exams add column if not exists instructions  text not null default '';
alter table public.exams add column if not exists scheduled_date text not null default '';
alter table public.exams add column if not exists start_time     text not null default '';
alter table public.exams add column if not exists end_time       text not null default '';
alter table public.exams add column if not exists teacher_id     text not null default '';
alter table public.exams add column if not exists teacher_name   text not null default '';

-- ---------------------------------------------------------------------------
-- Exam attempts (results) — one row per graded student submission
-- ---------------------------------------------------------------------------
create table if not exists public.exam_attempts (
  id           text primary key,
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
-- Row Level Security — enabled (idempotent) and permissive demo policies
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