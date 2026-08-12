-- ============================================================
-- CREV PLATFORM - COMPLETE SUPABASE SETUP
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Students
create table if not exists public.students (
  id text primary key,
  name text not null,
  stage text not null,
  grade text not null,
  parent_phone text not null,
  status text not null default 'Active',
  password text not null,
  parent_pin text not null,
  created_at date not null default current_date
);

-- Teachers
create table if not exists public.teachers (
  id text primary key,
  name text not null,
  subject text not null,
  phone text not null,
  status text not null default 'Active',
  username text not null default '',
  password text not null default '',
  subjects jsonb not null default '[]'::jsonb,
  stages jsonb not null default '[]'::jsonb,
  grades jsonb not null default '[]'::jsonb,
  session_token text not null default ''
);

alter table public.teachers
  add column if not exists username text not null default '';

alter table public.teachers
  add column if not exists password text not null default '';

alter table public.teachers
  add column if not exists subjects jsonb not null default '[]'::jsonb;

alter table public.teachers
  add column if not exists stages jsonb not null default '[]'::jsonb;

alter table public.teachers
  add column if not exists grades jsonb not null default '[]'::jsonb;

alter table public.teachers
  add column if not exists session_token text not null default '';

-- Subjects
create table if not exists public.subjects (
  id text primary key,
  name text not null unique,
  teachers_count int not null default 0,
  exams_count int not null default 0
);

-- Classes
create table if not exists public.classes (
  id text primary key,
  stage text not null,
  name text not null,
  students_count int not null default 0,
  exams_count int not null default 0
);

-- Exams
create table if not exists public.exams (
  id text primary key,
  name text not null,
  subject text not null,
  stage text not null,
  grade text not null,
  duration_minutes int not null default 30,
  status text not null default 'Draft',
  created_at text not null default to_char(now(), 'YYYY-MM-DD'),
  scheduled_date text not null default '',
  start_time text default '',
  end_time text default '',
  instructions text not null default '',
  pass_score int not null default 0,
  archived boolean not null default false,
  questions jsonb not null default '[]'::jsonb,
  teacher_id text not null default '',
  teacher_name text not null default ''
);

-- Backfill exam columns
alter table public.exams
  add column if not exists pass_score int not null default 0;

alter table public.exams
  add column if not exists archived boolean not null default false;

alter table public.exams
  add column if not exists questions jsonb not null default '[]'::jsonb;

alter table public.exams
  add column if not exists instructions text not null default '';

alter table public.exams
  add column if not exists scheduled_date text not null default '';

alter table public.exams
  add column if not exists start_time text default '';

alter table public.exams
  add column if not exists end_time text default '';

alter table public.exams
  add column if not exists teacher_id text not null default '';

alter table public.exams
  add column if not exists teacher_name text not null default '';

-- Exam attempts
create table if not exists public.exam_attempts (
  id text primary key,
  exam_id text not null,
  exam_name text not null,
  subject text not null,
  grade text not null,
  student_id text not null,
  student_name text not null,
  submitted_at text not null,
  score int not null default 0,
  total_score int not null default 0,
  pass_score int not null default 0,
  passed boolean not null default false,
  answers jsonb not null default '[]'::jsonb
);


-- ============================================================
-- 2. RLS
-- ============================================================

alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.exams enable row level security;
alter table public.exam_attempts enable row level security;


-- ============================================================
-- 3. DEMO POLICIES
-- ============================================================

drop policy if exists "students read/write demo"
on public.students;

create policy "students read/write demo"
on public.students
for all
using (true)
with check (true);


drop policy if exists "teachers read/write demo"
on public.teachers;

create policy "teachers read/write demo"
on public.teachers
for all
using (true)
with check (true);


drop policy if exists "subjects read/write demo"
on public.subjects;

create policy "subjects read/write demo"
on public.subjects
for all
using (true)
with check (true);


drop policy if exists "classes read/write demo"
on public.classes;

create policy "classes read/write demo"
on public.classes
for all
using (true)
with check (true);


drop policy if exists "exams read/write demo"
on public.exams;

create policy "exams read/write demo"
on public.exams
for all
using (true)
with check (true);


drop policy if exists "exam_attempts read/write demo"
on public.exam_attempts;

create policy "exam_attempts read/write demo"
on public.exam_attempts
for all
using (true)
with check (true);


-- ============================================================
-- 4. PERMISSIONS
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
on all tables in schema public
to anon, authenticated;

grant usage, select
on all sequences in schema public
to anon, authenticated;

grant execute
on all functions in schema public
to anon, authenticated;

alter default privileges in schema public
grant select, insert, update, delete
on tables
to anon, authenticated;

alter default privileges in schema public
grant execute
on functions
to anon, authenticated;


-- ============================================================
-- 5. INTERNAL TEACHER PERMISSION NORMALIZER
-- ============================================================

drop function if exists public._teacher_perm_values(text);

create function public._teacher_perm_values(
  p_value text
)
returns jsonb
language plpgsql
immutable
security invoker
set search_path = public
as $$
declare
  v jsonb;
  v_inner text;
begin

  if p_value is null or btrim(p_value) = '' then
    return '[]'::jsonb;
  end if;

  -- Normal JSON
  begin
    v := p_value::jsonb;
  exception
    when others then
      return '[]'::jsonb;
  end;

  -- Already an array
  if jsonb_typeof(v) = 'array' then
    return v;
  end if;

  -- JSON string containing an array
  if jsonb_typeof(v) = 'string' then

    v_inner := v #>> '{}';

    begin
      v := v_inner::jsonb;
    exception
      when others then
        return '[]'::jsonb;
    end;

    if jsonb_typeof(v) = 'array' then
      return v;
    end if;

  end if;

  return '[]'::jsonb;

end;
$$;


-- Internal helper must NOT be callable by REST clients
revoke all
on function public._teacher_perm_values(text)
from anon, authenticated, public;


-- ============================================================
-- 6. STUDENT LOGIN
-- ============================================================

drop function if exists public.student_login(text, text);

create function public.student_login(
  p_student_id text,
  p_password text
)
returns table (
  id text,
  name text,
  stage text,
  grade text,
  status text,
  parent_phone text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.stage,
    s.grade,
    s.status,
    s.parent_phone
  from public.students s
  where s.id = p_student_id
    and s.password = p_password
    and s.status = 'Active'
  limit 1;
$$;

grant execute
on function public.student_login(text, text)
to anon;


-- ============================================================
-- 7. PARENT LOGIN
-- ============================================================

drop function if exists public.parent_login(text);

create function public.parent_login(
  p_pin text
)
returns table (
  id text,
  name text,
  stage text,
  grade text,
  status text,
  parent_phone text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.stage,
    s.grade,
    s.status,
    s.parent_phone
  from public.students s
  where s.parent_pin = p_pin
    and s.status = 'Active'
  limit 2;
$$;

grant execute
on function public.parent_login(text)
to anon;


-- ============================================================
-- 8. TEACHER LOGIN
-- ============================================================

drop function if exists public.teacher_login(text, text);

create function public.teacher_login(
  p_username text,
  p_password text
)
returns table (
  id text,
  name text,
  subject text,
  subjects jsonb,
  stages jsonb,
  grades jsonb,
  phone text,
  username text,
  status text,
  session_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher public.teachers%rowtype;
  v_token text;
begin

  select *
  into v_teacher
  from public.teachers t
  where t.username = p_username
    and t.password = p_password
    and t.status = 'Active'
  limit 1;

  if v_teacher.id is null then
    return;
  end if;

  v_token :=
    md5(
      gen_random_uuid()::text ||
      gen_random_uuid()::text
    );

  update public.teachers
  set session_token = v_token
  where id = v_teacher.id;

  return query
  select
    v_teacher.id,
    v_teacher.name,
    v_teacher.subject,

    public._teacher_perm_values(
      v_teacher.subjects::text
    ),

    public._teacher_perm_values(
      v_teacher.stages::text
    ),

    public._teacher_perm_values(
      v_teacher.grades::text
    ),

    v_teacher.phone,
    v_teacher.username,
    v_teacher.status,
    v_token;

end;
$$;

grant execute
on function public.teacher_login(text, text)
to anon;


-- ============================================================
-- 9. TEACHER SCOPED STUDENTS
-- ============================================================

drop function if exists public.teacher_scoped_students(text, text);

create function public.teacher_scoped_students(
  p_teacher_id text,
  p_session_token text
)
returns table (
  id text,
  name text,
  stage text,
  grade text,
  parent_phone text,
  status text,
  password text,
  created_at date
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.stage,
    s.grade,
    s.parent_phone,
    s.status,
    s.password,
    s.created_at
  from public.students s
  join public.teachers t
    on t.id = p_teacher_id
   and t.session_token = p_session_token
   and t.status = 'Active'

  where jsonb_array_length(
          public._teacher_perm_values(t.stages::text)
        ) > 0

    and jsonb_array_length(
          public._teacher_perm_values(t.grades::text)
        ) > 0

    and public._teacher_perm_values(t.stages::text)
        ? s.stage

    and public._teacher_perm_values(t.grades::text)
        ? s.grade

  order by s.name;
$$;

grant execute
on function public.teacher_scoped_students(text, text)
to anon;


-- ============================================================
-- 10. TEACHER SCOPED EXAMS
-- ============================================================

drop function if exists public.teacher_scoped_exams(text, text);

create function public.teacher_scoped_exams(
  p_teacher_id text,
  p_session_token text
)
returns table (
  id text,
  name text,
  subject text,
  stage text,
  grade text,
  duration_minutes int,
  status text,
  created_at text,
  scheduled_date text,
  start_time text,
  end_time text,
  instructions text,
  pass_score int,
  archived boolean,
  questions jsonb,
  teacher_id text,
  teacher_name text
)
language sql
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    e.subject,
    e.stage,
    e.grade,
    e.duration_minutes,
    e.status,
    e.created_at,
    e.scheduled_date,
    e.start_time,
    e.end_time,
    e.instructions,
    e.pass_score,
    e.archived,
    e.questions,
    e.teacher_id,
    e.teacher_name

  from public.exams e

  join public.teachers t
    on t.id = p_teacher_id
   and t.session_token = p_session_token
   and t.status = 'Active'

  where e.teacher_id = p_teacher_id

    and (
      jsonb_array_length(
        public._teacher_perm_values(t.subjects::text)
      ) = 0

      or public._teacher_perm_values(t.subjects::text)
         ? e.subject
    )

    and (
      jsonb_array_length(
        public._teacher_perm_values(t.stages::text)
      ) = 0

      or public._teacher_perm_values(t.stages::text)
         ? e.stage
    )

    and (
      jsonb_array_length(
        public._teacher_perm_values(t.grades::text)
      ) = 0

      or public._teacher_perm_values(t.grades::text)
         ? e.grade
    )

  order by e.created_at desc;
$$;

grant execute
on function public.teacher_scoped_exams(text, text)
to anon;


-- ============================================================
-- 11. TEACHER SCOPED ATTEMPTS
-- ============================================================

drop function if exists public.teacher_scoped_attempts(text, text);

create function public.teacher_scoped_attempts(
  p_teacher_id text,
  p_session_token text
)
returns table (
  id text,
  exam_id text,
  exam_name text,
  subject text,
  grade text,
  student_id text,
  student_name text,
  submitted_at text,
  score int,
  total_score int,
  pass_score int,
  passed boolean,
  answers jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.exam_id,
    a.exam_name,
    a.subject,
    a.grade,
    a.student_id,
    a.student_name,
    a.submitted_at,
    a.score,
    a.total_score,
    a.pass_score,
    a.passed,
    a.answers

  from public.exam_attempts a

  join public.exams e
    on e.id = a.exam_id

  join public.teachers t
    on t.id = p_teacher_id
   and t.session_token = p_session_token
   and t.status = 'Active'

  where e.teacher_id = p_teacher_id

    and (
      jsonb_array_length(
        public._teacher_perm_values(t.subjects::text)
      ) = 0

      or public._teacher_perm_values(t.subjects::text)
         ? e.subject
    )

    and (
      jsonb_array_length(
        public._teacher_perm_values(t.stages::text)
      ) = 0

      or public._teacher_perm_values(t.stages::text)
         ? e.stage
    )

    and (
      jsonb_array_length(
        public._teacher_perm_values(t.grades::text)
      ) = 0

      or public._teacher_perm_values(t.grades::text)
         ? e.grade
    )

  order by a.submitted_at desc;
$$;

grant execute
on function public.teacher_scoped_attempts(text, text)
to anon;


-- ============================================================
-- 12. SECURITY - HIDE STUDENT SECRETS
-- ============================================================

revoke select (password, parent_pin)
on public.students
from anon, authenticated;


-- ============================================================
-- DONE
-- ============================================================

select 'CREV Supabase setup completed successfully.' as result;