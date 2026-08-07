-- ============================================================================
-- CREV Exam Platform — RLS hardening for student credentials
--
-- Stops the anon key from reading the `password` / `parent_pin` secret columns
-- on public.students, while keeping student + parent login working through
-- SECURITY DEFINER RPC functions that run as the table owner (bypassing RLS)
-- and only return non-secret fields.
--
-- Row-level visibility is unchanged (the permissive demo policy stays). Only
-- the column-level read privilege is revoked for `anon`.
--
-- Safe to run MULTIPLE TIMES: functions use CREATE OR REPLACE, and REVOKE /
-- GRANT are idempotent. Run this AFTER supabase/schema.sql in the Supabase
-- SQL editor. Requires a role with table-owner privileges (the SQL editor
-- runs as postgres, which is fine).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Student login — verifies id + password, returns only safe columns.
-- SECURITY DEFINER: runs as the table owner, so RLS / column privileges of
-- the calling role (anon) do not apply, but the caller can never see the
-- password itself — only a matching student's non-secret fields.
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

grant execute on function public.student_login(text, text) to anon;

-- ---------------------------------------------------------------------------
-- Parent login — verifies the 4-digit PIN. Returns up to two matches so the
-- app can enforce "exactly one active student has this PIN" (mirrors the
-- legacy client-side check). Only non-secret fields are returned.
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

grant execute on function public.parent_login(text) to anon;

-- ---------------------------------------------------------------------------
-- Column-level revoke: the anon role can no longer SELECT the secret columns.
-- (INSERT/UPDATE stay permitted so the admin can still create students and
-- set credentials; only reads are blocked for anon.)
-- ---------------------------------------------------------------------------
revoke select (password, parent_pin) on public.students from anon;
