-- ============================================================================
-- CREV Exam Platform — محو جميع بيانات المنصة (admin wipe)
-- ============================================================================
-- WHAT THIS DOES:
--   Creates a single SECURITY DEFINER RPC, `admin_wipe_all_operational_data`,
--   that deletes ONLY the operational data rows from the live database:
--     public.exam_attempts (النتائج / المحاولات)
--     public.exams         (الامتحانات — تشمل الأسئلة داخل exams.questions)
--     public.students      (الطلاب)
--     public.teachers      (المدرسون)
--   Nothing else changes:
--     - public.subjects / public.classes هي كتالوج ثابت (مواد/صفوف) — لا تُمس.
--     - لا تعديل على أي جدول أو عمود أو مفتاح أجنبي.
--     - لا تغيير على RLS أو الصلاحيات أو Auth أو إعدادات المشروع.
--
-- WHY AN RPC (وليس DELETE من الواجهة):
--   الميزة تتطلب أن يتم الحذف داخل قاعدة البيانات فقط، عبر دالة بصلاحيات
--   الخادم (SECURITY DEFINER تعمل كصاحب الجدول)، ولا يستطيع أي مستخدم عادي
--   استدعاءها من الكونسول دون الرمز.
--
-- SECURITY MODEL:
--   الدالة تتطلب معامل `p_admin_token`. تُقارن القيمة داخل الدالة بالثابت
--   ADMIN_WIPE_TOKEN أدناه، وإن اختلفت تُرفض (42501). يرجى ملاحظة أن نظام
--   الإدارة الحالي هو demo (admin/admin123 في كود الواجهة) — لذلك الرمز هو
--   "بوابة" بمستوى حماية نفس مستوى كلمة مرور المدير: أي شخص يقرأ حزمة JS
--   يستطيع استخراجه. لرفع مستوى الحماية: غيّر القيمة أدناه وفي
--   src/services/repository.js بنفس القيمة.
--
-- ATOMICITY:
--   جسم الدالة plpgsql يعمل كمعاملة واحدة — أي خطأ يُرجع كل الحذف كاملًا
--   (لا حذف جزئي). الحذف لا يعتمد على Foreign Keys (لا توجد في الـ schema)
--   لكن ترتيبه منطقي: المحاولات ← الامتحانات ← الطلاب ← المدرسون.
--
-- HOW TO RUN:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--   Safe to run MULTIPLE TIMES (CREATE OR REPLACE / REVOKE / GRANT idempotent).
-- ============================================================================

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

-- Secured: not callable by the generic `public` catch-all; only by the `anon`
-- role (the key the frontend uses), after the token check above passes.
revoke all on function public.admin_wipe_all_operational_data(text) from public;
grant execute on function public.admin_wipe_all_operational_data(text) to anon;
