-- HOW TO RUN:
-- Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.

CREATE OR REPLACE FUNCTION public.admin_wipe_all_operational_data(
  p_admin_token text
)
RETURNS TABLE (
  students_deleted bigint,
  teachers_deleted bigint,
  exams_deleted bigint,
  attempts_deleted bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_students bigint;
  v_teachers bigint;
  v_exams bigint;
  v_attempts bigint;
BEGIN

  -- Security check
  IF p_admin_token IS DISTINCT FROM
    'crev-wipe-gate-0f8c2e9a-4b1d-47c6-a93e-5d2f1b7a8c04'
  THEN
    RAISE EXCEPTION
      'غير مصرح: محو جميع البيانات متاح للإدارة فقط.'
      USING ERRCODE = '42501';
  END IF;

  -- Delete attempts first because they depend on exams/students
  WITH d AS (
    DELETE FROM public.exam_attempts
    WHERE true
    RETURNING 1
  )
  SELECT count(*) INTO v_attempts FROM d;

  -- Delete exams
  WITH d AS (
    DELETE FROM public.exams
    WHERE true
    RETURNING 1
  )
  SELECT count(*) INTO v_exams FROM d;

  -- Delete students
  WITH d AS (
    DELETE FROM public.students
    WHERE true
    RETURNING 1
  )
  SELECT count(*) INTO v_students FROM d;

  -- Delete teachers last
  WITH d AS (
    DELETE FROM public.teachers
    WHERE true
    RETURNING 1
  )
  SELECT count(*) INTO v_teachers FROM d;

  RETURN QUERY
  SELECT
    v_students,
    v_teachers,
    v_exams,
    v_attempts;

END;
$$;


-- Security
REVOKE ALL
ON FUNCTION public.admin_wipe_all_operational_data(text)
FROM public;

GRANT EXECUTE
ON FUNCTION public.admin_wipe_all_operational_data(text)
TO anon;