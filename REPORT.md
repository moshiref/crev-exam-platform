# CREV Exam Platform — تقرير الفحص والتصميم لقاعدة بيانات Supabase

> تم إنتاج هذا التقرير بفحص الكود بالكامل (وليس بالافتراضات): كل جدول وكل عمود وكل
> RPC في هذا التقرير مستند إلى استدعاء حقيقي في الكود (`src/services/repository.js`,
> `src/services/supabase.js`, `src/pages/*Login.jsx`, `src/hooks/*`, `src/utils/*`).
>
> المخرجات: `supabase/schema.sql` (مخطط مقترح جاهز للمراجعة — لم يُنفَّذ) + هذا التقرير.

---

## 1) Database Tables

6 جداول فقط، كلها في `public`. لا يوجد Storage ولا Realtime ولا Edge Functions.

| Table | اسم الجدول | الاستخدام | المرجع في الكود |
|---|---|---|---|
| students | `students` | الطلاب + كلمة مرور الطالب + PIN ولي الأمر | `repository.js` |
| teachers | `teachers` | المدرسون + صلاحياتهم + توكن الجلسة | `repository.js` |
| subjects | `subjects` | المادة + عدادات العرض | `repository.js` |
| classes | `classes` | الصفوف الدراسية | `repository.js` |
| exams | `exams` | الامتحانات + الأسئلة (JSONB) | `repository.js` |
| exam_attempts | `exam_attempts` | نتائج الطلاب + الإجابات المصحّحة (JSONB) | `repository.js` |

### students
| Column | Type | Notes |
|---|---|---|
| id | text **PK** | كود الطالب (CREV-1006) — يُولَّد client-side |
| name | text NOT NULL | |
| stage | text NOT NULL | |
| grade | text NOT NULL | |
| parent_phone | text NOT NULL | |
| status | text NOT NULL default 'Active' | |
| password | text NOT NULL | 6 أرقام — يُمنع قراءته anon |
| parent_pin | text NOT NULL | 4 أرقام — يُمنع قراءته anon |
| created_at | date NOT NULL default now() | |

Indexes: `students(stage, grade)`, `students(status)`, `students(parent_pin)`.

### teachers
| Column | Type | Notes |
|---|---|---|
| id | text **PK** | T-001 ... |
| name | text NOT NULL | |
| subject | text NOT NULL default '' | مادة واحدة (توافق قديم) |
| subjects / stages / grades | jsonb NOT NULL default '[]' | صلاحيات التدريس (يمنحها الأدمن) |
| phone | text NOT NULL default '' | |
| status | text NOT NULL default 'Active' | |
| username | text NOT NULL default '' | فريد (index) |
| password | text NOT NULL default '' | يُمنع قراءته عبر SELECT المباشر |
| session_token | text NOT NULL default '' | يُدوَّر عند كل تسجيل دخول |

Indexes: `teachers(username)` فريد، `teachers(status)`, `teachers(session_token)`.

### subjects
| Column | Type | Notes |
|---|---|---|
| id | text **PK** | SUB-xx |
| name | text NOT NULL **unique** | |
| teachers_count | int NOT NULL default 0 | عدّاد عرض يكتبه التطبيق (ليس aggregate) |
| exams_count | int NOT NULL default 0 | عدّاد عرض |

### classes
| Column | Type | Notes |
|---|---|---|
| id | uuid **PK** default gen_random_uuid() | **هكذا في قاعدة البيانات الحيّة** (الملف القديم + تعليقات الكود) |
| stage | text NOT NULL default '' | |
| name | text NOT NULL | |
| students_count | int NOT NULL default 0 | |
| exams_count | int NOT NULL default 0 | |

⚠️ التطبيق عند إنشاء صف يرسل `id = 'CLS-xx'` (نص) — غير متوافق مع عمود uuid → مشكلة (انظر Problems #9).

### exams
| Column | Type | Notes |
|---|---|---|
| id | text **PK** | EX-001 — يُولَّد client-side |
| name | text NOT NULL | |
| subject / stage / grade | text NOT NULL default '' | |
| duration_minutes | int NOT NULL default 30 | |
| status | text NOT NULL default 'Draft' | Draft \| Published |
| created_at | text default 'YYYY-MM-DD' | |
| scheduled_date / start_time / end_time | text NOT NULL default '' | |
| instructions | text NOT NULL default '' | |
| pass_score | int NOT NULL default 0 | درجة النجاح |
| archived | boolean NOT NULL default false | |
| questions | jsonb NOT NULL default '[]' | تحتوي correctIndex/correctAnswer — **خطر** (انظر Problems #3) |
| teacher_id | text NOT NULL default '' | `''` = sentinel لامتحان الأدمن؛ لا يوجد FK (انظر Decisions #4) |
| teacher_name | text NOT NULL default '' | |

Indexes: `exams(teacher_id)`, `exams(stage, grade)`, `exams(status)`.

### exam_attempts
| Column | Type | Notes |
|---|---|---|
| id | text **PK** | AT-xxxx |
| exam_id | text NOT NULL **FK → exams(id) ON DELETE CASCADE** | |
| exam_name | text NOT NULL | |
| subject / grade | text NOT NULL | |
| student_id | text NOT NULL **FK → students(id) ON DELETE CASCADE** | |
| student_name | text NOT NULL | |
| submitted_at | text NOT NULL | |
| score / total_score / pass_score | int NOT NULL default 0 | |
| passed | boolean NOT NULL default false | |
| answers | jsonb NOT NULL default '[]' | تحتوي correctIndex/correctAnswer — مطلوبة لمراجعة المدرس، ممنوعة على الطالب |

Indexes: `exam_attempts(exam_id)`, `exam_attempts(student_id)`, `exam_attempts(submitted_at)`.

> ملاحظة FK: حذف امتحان يحذف نتائجه (CASCADE) — يطابق سلوك التطبيق (`deleteExam` لا يحذف النتائج يدويًا).

---

## 2) RPC Functions

7 دوال. كل الدوال `SECURITY DEFINER` (تعمل بصلاحيات المالك وتتحقق من الهوية في SQL)، عدا `_teacher_perm_values` فهي مساعدة داخلية غير قابلة للاستدعاء anon.

| Function | Arguments | Returns | يُستدعى كالتالي في الكود |
|---|---|---|---|
| teacher_login | `p_username text, p_password text` | TABLE (id, name, subject, subjects jsonb, stages jsonb, grades jsonb, phone, username, status, session_token) | `supabase.rpc('teacher_login', { p_username, p_password })` — ينتظر **مصفوفة** (data[0]) |
| teacher_scoped_students | `p_teacher_id text, p_session_token text` | TABLE (id, name, stage, grade, parent_phone, status, password, created_at) | `supabase.rpc('teacher_scoped_students', { p_teacher_id, p_session_token })` |
| teacher_scoped_exams | `p_teacher_id text, p_session_token text` | TABLE (كل أعمدة exams) | `supabase.rpc('teacher_scoped_exams', { p_teacher_id, p_session_token })` |
| teacher_scoped_attempts | `p_teacher_id text, p_session_token text` | TABLE (كل أعمدة exam_attempts) | `supabase.rpc('teacher_scoped_attempts', { p_teacher_id, p_session_token })` |
| student_login | `p_student_id text, p_password text` | TABLE (id, name, stage, grade, status, parent_phone) — بدون password | `supabase.rpc('student_login', { p_student_id, p_password })` — ينتظر data[0] |
| parent_login | `p_pin text` | TABLE (id, name, stage, grade, status, parent_phone) | `supabase.rpc('parent_login', { p_pin: code })` — ينتظر **قيمة واحدة بالضبط** (length === 1) |
| _teacher_perm_values | `p_raw text` | jsonb (مصفوفة) | داخلية — `revoke all from public` |

### سلوك كل دالة (كما يجب أن تكون في schema.sql الجديد)
- **teacher_login**: يطابق username+password+Active → يدوّر `session_token` عشوائيًا جديدًا → يعيد صف المدرس (دون password) مع صلاحياته مُطبَّعة كـ jsonb.
- **teacher_scoped_students**: يتحقق من (teacher_id + session_token + Active) ثم يفلتر الطلاب حيث `stage ∈ stages الممنوحة` **و** `grade ∈ grades الممنوحة`. (المدرسة القديمة كانت تُعيد **كل** الطلاب — خطأ، انظر Problems #6.)
- **teacher_scoped_exams**: يتحقق من الهوية ثم يرجّع فقط امتحانات `e.teacher_id = p_teacher_id` مع شرط `subject/stage/grade` داخل الصلاحيات. **اتفاق:** قائمة صلاحيات فارغة = غير مقيّد (يطابق JS `examWithinPermissions`).
- **teacher_scoped_attempts**: نفس التحقق، ثم نتائج الامتحانات المملوكة داخل النطاق.
- **student_login**: يطابق id+password+Active، يردّ 0 أو 1 صف بدون أسرار.
- **parent_login**: يطابق parent_pin+Active، يردّ حتى صفين (حتى يكتشف التطبيق التكرار — يرفض التطبيق أي نتيجة طولها ≠ 1).

> كل دوال المدرس تتسلم `session_token` كمعامل، وليس من `auth.uid()` — لأن **لا يوجد** Supabase Auth في النظام (انظر Authentication).

---

## 3) RLS (Row Level Security)

### الوضع الحالي في الملفات القديمة (المشروع المحذوف)
- `supabase/schema.sql` القديم: سياسات **متساهلة** لكل الجداول (`true`) + RLS مفعّل.
- `supabase/rls_students.sql` القديم: دالتا student_login / parent_login + `revoke select (password, parent_pin) on students from anon`.
- `supabase/rbac_teacher.sql` القديم: دوال المدرس + سياسة `teachers_select_own` تعتمد على
  `request.jwt.claims → app_metadata → teacher_id` وهي **فارغة دائمًا** (لا يوجد auth.uid() في النظام) → تعيد 0 صفوف.

### المشكلة الجوهرية
كل طلبات PostgREST تحمل **مفتاح anon (publishable) نفسه** بلا جلسة Supabase Auth.
لذلك لا يمكن لأي سياسة RLS أن تفرّق بين "أدمن" و"طالب" و"مدرس" و"ولي أمر" على مستوى الصف
(Row-Level). العزل الحقيقي الوحيد يتم **داخل دوال SECURITY DEFINER** التي تتحقق من
`session_token`/كلمة المرور.

### المخطط المقترح (schema.sql)
- تفعيل RLS على الجداول الستة.
- سياسات **متساهلة** (أساسية) لكل الجداول = سلوك التطبيق الحالي (كما كانت في schema.sql القديم).
- `revoke select (password, parent_pin) on students from anon` — حماية أعمدة الأسرار؛
  تسجيل الدخول يمر عبر الدوال.
- مخطط "التحصين" (سياسات per-role حقيقية) **موجود كتعليقات** في نهاية schema.sql وينتظر
  قرارًا منك (انظر Unclear / Requires Decision).

---

## 4) Storage

**لا يوجد.** لا يُستخدم أي Storage bucket، ولا Realtime، ولا Edge Functions في الكود.
كل البيانات عبر PostgREST (جداول + RPCs) فقط.

---

## 5) Authentication

لا يوجد Supabase Auth إطلاقًا (`auth.uid()` دائمًا NULL). الجلسات يدوية في sessionStorage:

| الدور | طريقة المصادقة | المفتاح/الشيفرة | التخزين | المرجع |
|---|---|---|---|---|
| Admin | **Demo فقط** — username/password مشفّران hardcoded | `admin` / `admin123` | `crev-admin-auth` | `auth.js:13-28` |
| Teacher | **حقيقية** — teacher_login ضد جدول teachers | username + password | `crev-teacher-auth` (كامل صف المدرس) | `auth.js:35-55` + `TeacherLogin.jsx` |
| Student | **حقيقية** — student_login ضد جدول students | كود الطالب + password | `crev-student-auth` {id,name,stage,grade} | `StudentLogin.jsx:79-83` |
| Parent | **حقيقية** — parent_login ضد parent_pin | PIN من 4 أرقام | `crev-parent-auth` | `ParentLogin.jsx:109-110` |

نقاط مهمة:
- لا يوجد جدول parents — ولي الأمر مرتبط بطفل **واحد** عبر `parent_pin`.
- `getCurrentTeacher()` في `repository.js` يقرأ `crev-teacher-auth` من sessionStorage
  قبل أي شبكة (التعليق في `hydrateAll`). وجود صف مدرس يعني "وضع المدرس" → يتم تحميل
  البيانات المقيّدة فقط عبر دوال teacher_scoped_*.
- بدون مدرس مسجّل (أدمن / طالب / ولي أمر / زائر) يتحمّل `hydrateAll` **كل** الجداول في ذاكرة المتصفح (انظر Problems #2).

---

## 6) Problems Found

1. **تعطّل كامل لتكامل Supabase (الأهم).**
   `src/services/supabase.js:18-19` يقرأ `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`.
   ملف `.env` الحالي يضع `VITE_SUPABASE_PUBLISHABLE_KEY` (اسم قديم). النتيجة:
   `isSupabaseConfigured = false` → التطبيق يعمل دائمًا بالوضع الوهمي (mock) ولا يتصل بقاعدة
   البيانات أبدًا. الحل: تصحيح اسم المتغير في `.env` إلى `VITE_SUPABASE_ANON_KEY`.

2. **تحميل كامل قاعدة البيانات إلى متصفح الطالب / ولي الأمر / الزائر.**
   في `repository.js:337-344`، الفرع "غير المدرس" من `hydrateAll` يجلب:
   `students` (بدون password)، **`teachers` بعلامة `*` (يشمل password!)**، `subjects`،
   `exams` بعلامة `*` (يشمل `questions` بالحلول!)، **`attempts` بعلامة `*` (يشمل
   `answers` بالحلول!)**، `classes`.
   والدوال `useExams()/useStudents()/useExamAttempts()` تُطلق `hydrateAll` عند فتح أي
   صفحة طالب/ولي أمر. أي شخص يفتح `/student/dashboard` ينزّل بيانات كل المدرسين
   (بكلمات مرورهم) وكل الحلول.

3. **الحلول الصحيحة موجودة في `questions` و`answers` وتُرسل للطالب.**
   - `exams.questions` تحتوي `correctIndex`/`correctAnswer`.
   - `StudentExamPage.jsx:57` يقرأ الامتحان من `useExams()` (كاملًا بالحلول) و`handleSubmit`
     (101-129) يصحّح **في المتصفح** عبر `gradeAttempt` (`examUtils.js:61-80`) ويخزّن
     `correctIndex/correctAnswer` في `answers`.
   - الكود نفسه يوثّق الخطر: `examUtils.js:56-60` "IMPORTANT SECURITY NOTE ... grading
     runs inside the browser". و`toExamCard` (`examUtils.js:89-95`) عمدًا لا يعمل (dead code)
     حتى ينتقل التصحيح إلى الخادم.
   - النتيجة: أي طالب يستطيع رؤية الحلول قبل الامتحان (DevTools) أو أثناءه.

4. **خطأ منطقي في حساب النجاح: كل نتيجة تنجح دائمًا.**
   `examUtils.js:73`: `passed = score >= (Number(questionsConfig?.[0]?.passScore) || 0)`.
   الأسئلة تحتوي `score` وليس `passScore` → القيمة دائمًا `0` → `passed` دائمًا `true`.
   درجة النجاح الحقيقية في `exam.passScore` ولا تصل إلى `gradeAttempt`. يظهر التأثير في
   كل نتائج الطلاب وفلتر النجاح/الرسوب عند المدرس.

5. **حماية المسارات غير مكتملة.**
   `AppRoutes.jsx:48-49`: صفحات الطالب محمية فقط بـ `BlockTeacher` (تمنع المدرس المسجّل)،
   وليست محمية بمصادقة الطالب. أي زائر يفتح `/student/exam/:examId` ويرى الامتحان كاملًا.

6. **أخطاء في ملفات SQL القديمة (من المشروع المحذوف).**
   - `rbac_teacher.sql` (قديم): `teacher_scoped_students` لا يفلتر stage/grade → يعيد
     **كل** الطلاب لأي مدرس صالح. (أُصلح في schema.sql الجديد.)
   - `rbac_teacher.sql` (قديم): سياسة `teachers_select_own` تعتمد على claim لا يوجد في
     النظام أبدًا → تعيد 0 صفوف → تكسر `getTeacherById` (إعدادات المدرس وExamInfoForm).
     (استُبدلت بسياسة متساهلة + توثيق في schema.sql الجديد.)

7. **الأدمن لا يختلف عن أي حامل لمفتاح anon على مستوى القاعدة.**
   `auth.js:13` مصادقة الأدمن hardcoded في المتصفح. لذلك `anon key` = صلاحية كاملة
   (قراءة/كتابة/حذف) على كل الجداول. العزل الحقيقي للأدمن يستلزم تغييرًا (انظر Decisions #1).

8. **كلمات مرور الطلاب قابلة للقراءة anon.**
   المسار القديم في `StudentLogin.jsx:86-92` و`ParentLogin.jsx:112-118` يعمل بـ
   `.select()` مباشر مقابل `password`/`parent_pin` كحل احتياطي عند غياب RPCs. بعد تطبيق
   `revoke select` ستُفشل هذه المسارات الاحتياطية — مقبول طالما دالتا login موجودتان.

9. **`createClass` غير متوافق مع عمود uuid.**
   `repository.js:1319` يولّد `id = 'CLS-xx'` ويرسله، بينما `classes.id` في القاعدة
   uuid (يُولَّد تلقائيًا — الكود يذكر ذلك في `repository.js:1433-1434` و`1479-1481`).
   إدخال نص في عمود uuid يفشل (cast error). تحميل البيانات التجريبية يعمل لأنه يرسل
   بدون id. يحتاج قرارًا (Decisions #3).

10. **محدودية نموذج ولي الأمر والامتحانات.**
    - لا جدول parents: ولي الأمر لطفل واحد فقط؛ PIN مكرر = رفض (صُمم هكذا).
    - لا ربط امتحان-طالب صريح: الرؤية = (stage+grade) + status Published فقط، على مستوى JS.

---

## 7) Unclear / Requires Decision

قرارات يجب أن تأخذها قبل تفعيل قاعدة بيانات جديدة وتطبيق التحصين:

1. **نموذج المصادقة والتخويل (الأهم).** أي من الخيارات:
   - **(A)** التحويل إلى Supabase Auth للأدوار الأربعة ثم سياسات RLS حقيقية عبر `auth.uid()`.
   - **(B)** إبقاء الجلسات المخصصة (مثل session_token للمدرس) مع نقل **كل** القراءة/الكتابة
     خلف دوال SECURITY DEFINER و`revoke` وصول anon للجداول.
   - **(C)** حل هجين: سياسات متساهلة فقط للجداول التي يحتاجها الأدمن، وكل قراءات
     الطالب/ولي الأمر/المدرس عبر RPCs (المدرس يفعل ذلك فعلًا؛ الطالب وولي الأمر لا).
   - المخطط الحالي = (C) بدون التحصين النهائي.

2. **دلالة الصلاحيات الفارغة للمدرس.** اقترحت أن `teacher_scoped_exams/attempts` تعامل
   القائمة الفارغة كـ"غير مقيّد" (يطابق JS)، بينما `teacher_scoped_students` تتطلب stage+grade
   معًا. هل هذا مقصود؟

3. **`classes.id` واستراتيجية الإنشاء.** هل نُبقي uuid (كما في القاعدة الحيّة) ونعدّل
   `createClass` ليرسل UUID/يحذف id، أم نُحوّل العمود إلى text؟

4. **`exams.teacher_id` والـ FK.** هل نُبقي sentinel `''` (الحالي — لا FK)، أم نُنقل إلى
   `NULL` مع FK اختياري إلى teachers؟

5. **محاولة واحدة لكل طالب/امتحان.** هل نُبقي الفحص على مستوى التطبيق فقط، أم نضيف
   index فريد `(student_id, exam_id)` في القاعدة (يحتاج تنظيف أي تكرارات قديمة أولًا)؟

6. **`teachers.username` فريد.** التأكد من عدم وجود تكرار في بياناتك قبل تطبيق الـ unique index.

7. **`parent_login` وحالة Active.** اقترحت فلترة `status='Active'` (يطابق المسار
   الاحتياطي). هل تريد ولي الأمر يسجّل لطفل غير نشط؟

8. **نطاق تحصين إجابات الطالب.** هل نعتمد نقل تصحيح الامتحانات إلى الخادم + تجريد
   `correctIndex/correctAnswer` من `questions` قبل إرسالها للطالب (يتطلب تغييرات كود)؟

9. **عدّادات subjects/classes.** `teachers_count`/`exams_count` أعمدة مكتوبة يدويًا من
   التطبيق (وليست محسوبة). مقبول أم نستبدلها بعروض محسوبة (views)؟

---

## ملاحظة أخيرة حول الملفات القديمة

`supabase/schema.sql` و`supabase/rbac_teacher.sql` و`supabase/rls_students.sql` الحالية
هي من **المشروع المحذوف** ولا يجب تنفيذها على مشروع جديد. الملف الجديد
`supabase/schema.sql` يحلّ محلها ويجمعها ويصلح أخطاءها (teacher_scoped_students،
سياسة teachers_select_own، إضافة الأعمدة المفقودة، حماية الأعمدة السرية).
