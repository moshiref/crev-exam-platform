-- ============================================================================
-- CREV Exam Platform — seed data
--
-- Mirrors the app's mock data so Supabase mode starts with identical
-- content. Run after schema.sql. (Optional — the app seeds its cache from
-- mock data automatically; this just makes the DB self-contained.)
-- ============================================================================

insert into public.students (id, name, stage, grade, parent_phone, status, password, parent_pin, created_at) values
  ('CREV-1001', 'محمد أحمد السيد', 'ثانوي', 'الثالث الثانوي', '01012345678', 'Active', '483921', '7254', '2026-01-12'),
  ('CREV-1002', 'سارة خالد إبراهيم', 'إعدادي', 'الثاني الإعدادي', '01123456789', 'Active', '291837', '4410', '2026-01-15'),
  ('CREV-1003', 'يوسف عمرو منصور', 'ثانوي', 'الثاني الثانوي', '01234567890', 'Inactive', '664215', '8823', '2026-01-18'),
  ('CREV-1004', 'نور محمود فتحي', 'ابتدائي', 'السادس الابتدائي', '01555443322', 'Active', '117729', '3396', '2026-01-22'),
  ('CREV-1005', 'عمر طارق حسن', 'ثانوي', 'الأول الثانوي', '01099887766', 'Active', '558402', '6019', '2026-01-25')
on conflict (id) do nothing;

insert into public.teachers (id, name, subject, phone, status, username, password) values
  ('T-001', 'أ. أحمد فوزي', 'الرياضيات', '01011122233', 'Active', 'ahmed.fouzi', 'Ahmed@123'),
  ('T-002', 'أ. منى عبد الله', 'اللغة الإنجليزية', '01022233344', 'Active', 'mona.abdallah', 'Mona@123'),
  ('T-003', 'أ. كريم سامي', 'العلوم', '01033344455', 'Active', 'karim.sami', 'Karim@123'),
  ('T-004', 'أ. هبة الدسوقي', 'اللغة العربية', '01044455566', 'Inactive', 'heba.desouky', 'Heba@123'),
  ('T-005', 'أ. محمود صلاح', 'الدراسات الاجتماعية', '01055566677', 'Active', 'mahmoud.salah', 'Mahmoud@123')
on conflict (id) do nothing;

insert into public.subjects (id, name, teachers_count, exams_count) values
  ('SUB-01', 'اللغة العربية', 3, 8),
  ('SUB-02', 'اللغة الإنجليزية', 2, 6),
  ('SUB-03', 'الرياضيات', 4, 10),
  ('SUB-04', 'العلوم', 2, 5),
  ('SUB-05', 'الدراسات الاجتماعية', 1, 4),
  ('SUB-06', 'الحاسب الآلي', 1, 3)
on conflict (id) do nothing;

insert into public.classes (id, stage, name, students_count, exams_count) values
  ('CLS-01', 'ابتدائي', 'الأول الابتدائي', 18, 2),
  ('CLS-02', 'ابتدائي', 'الثاني الابتدائي', 21, 1),
  ('CLS-03', 'ابتدائي', 'الثالث الابتدائي', 15, 0),
  ('CLS-04', 'ابتدائي', 'الرابع الابتدائي', 24, 2),
  ('CLS-05', 'ابتدائي', 'الخامس الابتدائي', 19, 1),
  ('CLS-06', 'ابتدائي', 'السادس الابتدائي', 26, 3),
  ('CLS-07', 'إعدادي', 'الأول الإعدادي', 22, 2),
  ('CLS-08', 'إعدادي', 'الثاني الإعدادي', 27, 4),
  ('CLS-09', 'إعدادي', 'الثالث الإعدادي', 20, 3),
  ('CLS-10', 'ثانوي', 'الأول الثانوي', 30, 5),
  ('CLS-11', 'ثانوي', 'الثاني الثانوي', 28, 4),
  ('CLS-12', 'ثانوي', 'الثالث الثانوي', 25, 6)
on conflict (id) do nothing;

insert into public.exams (id, name, subject, stage, grade, duration_minutes, status, created_at, scheduled_date, start_time, end_time, instructions, pass_score, archived, questions) values
  (
    'EX-001', 'امتحان الوحدة الأولى', 'الرياضيات', 'ثانوي', 'الثالث الثانوي', 45, 'Published', '2026-02-10', '2026-08-12', '09:00', '10:30', 'اقرأ كل سؤال جيدًا قبل الإجابة.', 12, false,
    '[
      {"id":"q1","text":"ما ناتج 2² + 3؟","type":"MCQ","score":2,"options":["5","6","7","9"],"correctIndex":2},
      {"id":"q2","text":"مجموع زوايا المثلث يساوي:","type":"MCQ","score":2,"options":["90°","180°","270°","360°"],"correctIndex":1},
      {"id":"q3","text":"ناتج 5 × 6 هو 30.","type":"TF","score":1,"options":null,"correctAnswer":true},
      {"id":"q4","text":"إذا كانت س + 3 = 10، فإن قيمة س =","type":"MCQ","score":3,"options":["5","7","6","13"],"correctIndex":1}
    ]'::jsonb
  ),
  (
    'EX-002', 'امتحان منتصف الترم', 'اللغة الإنجليزية', 'إعدادي', 'الثاني الإعدادي', 60, 'Draft', '2026-04-05', '', '11:00', '12:00', '', 2, false,
    '[
      {"id":"q1","text":"She ___ to school every day.","type":"MCQ","score":2,"options":["go","goes","going","gone"],"correctIndex":1},
      {"id":"q2","text":"The sun rises in the east.","type":"TF","score":2,"options":null,"correctAnswer":true}
    ]'::jsonb
  ),
  (
    'EX-003', 'اختبار قصير علوم', 'العلوم', 'ثانوي', 'الأول الثانوي', 20, 'Published', '2026-03-28', '2026-08-11', '09:30', '10:00', 'أجب عن الأسئلة في الوقت المحدد.', 4, false,
    '[
      {"id":"q1","text":"أي الغازات يمثل الجزء الأكبر من غلاف الأرض الجوي؟","type":"MCQ","score":3,"options":["الأكسجين","الهيدروجين","ثاني أكسيد الكربون","النيتروجين"],"correctIndex":3},
      {"id":"q2","text":"الماء يتجمد عند درجة حرارة 100° مئوية.","type":"TF","score":1,"options":null,"correctAnswer":false}
    ]'::jsonb
  ),
  (
    'EX-004', 'امتحان نهاية الوحدة', 'اللغة العربية', 'ابتدائي', 'السادس الابتدائي', 40, 'Draft', '2026-03-20', '2026-08-14', '13:00', '14:30', '', 3, false,
    '[
      {"id":"q1","text":"ما جمع كلمة «كتاب»؟","type":"MCQ","score":1,"options":["كتب","كتابات","كتابان","مكتبة"],"correctIndex":0},
      {"id":"q2","text":"الفاعل في الجملة يأتي دائمًا:","type":"MCQ","score":2,"options":["منصوبًا","مرفوعًا","مجرورًا","ساكنًا"],"correctIndex":1},
      {"id":"q3","text":"الهمزة في كلمة «أنَّ» همزة مفتوحة.","type":"TF","score":1,"options":null,"correctAnswer":true}
    ]'::jsonb
  )
on conflict (id) do nothing;

insert into public.exam_attempts (id, exam_id, exam_name, subject, grade, student_id, student_name, submitted_at, score, total_score, pass_score, passed, answers) values
  (
    'AT-1001', 'EX-001', 'امتحان الوحدة الأولى', 'الرياضيات', 'الثالث الثانوي', 'CREV-1001', 'محمد أحمد السيد', '2026-08-12 09:41', 8, 8, 12, false,
    '[
      {"questionId":"q1","text":"ما ناتج 2² + 3؟","type":"MCQ","score":2,"earned":2,"selected":2,"correct":true,"options":["5","6","7","9"],"correctIndex":2},
      {"questionId":"q2","text":"مجموع زوايا المثلث يساوي:","type":"MCQ","score":2,"earned":2,"selected":1,"correct":true,"options":["90°","180°","270°","360°"],"correctIndex":1},
      {"questionId":"q3","text":"ناتج 5 × 6 هو 30.","type":"TF","score":1,"earned":1,"selected":true,"correct":true,"correctAnswer":true},
      {"questionId":"q4","text":"إذا كانت س + 3 = 10، فإن قيمة س =","type":"MCQ","score":3,"earned":0,"selected":2,"correct":false,"options":["5","7","6","13"],"correctIndex":1}
    ]'::jsonb
  ),
  (
    'AT-1002', 'EX-001', 'امتحان الوحدة الأولى', 'الرياضيات', 'الثالث الثانوي', 'CREV-1005', 'عمر طارق حسن', '2026-08-12 10:02', 6, 8, 12, false,
    '[
      {"questionId":"q1","text":"ما ناتج 2² + 3؟","type":"MCQ","score":2,"earned":0,"selected":0,"correct":false,"options":["5","6","7","9"],"correctIndex":2},
      {"questionId":"q2","text":"مجموع زوايا المثلث يساوي:","type":"MCQ","score":2,"earned":2,"selected":1,"correct":true,"options":["90°","180°","270°","360°"],"correctIndex":1},
      {"questionId":"q3","text":"ناتج 5 × 6 هو 30.","type":"TF","score":1,"earned":1,"selected":true,"correct":true,"correctAnswer":true},
      {"questionId":"q4","text":"إذا كانت س + 3 = 10، فإن قيمة س =","type":"MCQ","score":3,"earned":3,"selected":1,"correct":true,"options":["5","7","6","13"],"correctIndex":1}
    ]'::jsonb
  ),
  (
    'AT-1003', 'EX-003', 'اختبار قصير علوم', 'العلوم', 'الأول الثانوي', 'CREV-1002', 'سارة خالد إبراهيم', '2026-08-11 09:45', 4, 4, 4, true,
    '[
      {"question":"0","text":"أي الغازات يمثل الجزء الأكبر من غلاف الأرض الجوي؟","type":"MCQ","score":3,"earned":3,"selected":3,"correct":true,"options":["الأكسجين","الهيدروجين","ثاني أكسيد الكربون","النيتروجين"],"correctIndex":3},
      {"question":"1","text":"الماء يتجمد عند درجة حرارة 100° مئوية.","type":"TF","score":1,"earned":1,"selected":false,"correct":true,"correctAnswer":false}
    ]'::jsonb
  )
on conflict (id) do nothing;