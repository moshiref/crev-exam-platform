-- ============================================================================
-- CREV Exam Platform — FIX: teacher_login 404
-- ============================================================================
-- WHAT THIS DOES:
--   Creates the `teacher_login` function ONLY. Nothing else changes:
--   - teacher_scoped_exams / teacher_scoped_students / teacher_scoped_attempts
--     are NOT touched.
--   - No RLS changes. No other tables touched. No data changes.
--
-- WHY IT FIXES THE 404:
--   The 404 (PGRST202) means this function was never deployed to the project
--   (the app calls it from src/services/repository.js:717). Creating it here
--   makes the RPC endpoint exist, so the login request returns a real result
--   instead of 404.
--
-- REQUIRED DEPENDENCY (verified missing on the live DB):
--   `teachers.session_token` — teacher_login issues and stores a fresh token
--   on the teacher row. Without this ONE additive column the function would
--   exist but every call would fail with `column teachers.session_token does
--   not exist`. The ALTER below is additive + idempotent: it does not touch
--   existing rows, RLS, or any other table.
--
-- HOW TO RUN:
--   Supabase Dashboard -> SQL -> New query -> paste this file -> Run.
--   Safe to run multiple times (CREATE OR REPLACE / ADD COLUMN IF NOT EXISTS).
-- ============================================================================

alter table public.teachers add column if not exists session_token text not null default '';

-- ---------------------------------------------------------------------------
-- Internal normalizer for the permission columns. teacher_login depends on
-- it. Handles real jsonb arrays (schema.sql) AND the JSON-encoded text
-- strings the live DB actually stores (e.g. '["????"]'). Not exposed through
-- PostgREST (execute revoked from public below).
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
-- teacher_login — validates username/password against public.teachers, issues
-- a fresh random session_token and returns ONLY safe columns (never the
-- password). SECURITY DEFINER so it can read the table and rotate the token.
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

  -- Fresh random token per login.
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

-- Make it callable with the anon key used by the frontend.
grant execute on function public.teacher_login(text, text) to anon;
