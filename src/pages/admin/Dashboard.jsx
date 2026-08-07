import { useMemo, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineAcademicCap,
  HiOutlineClipboardDocumentList,
  HiOutlinePlus,
  HiOutlineUserPlus,
  HiOutlineBookOpen,
  HiOutlineChartPie,
  HiOutlineSparkles,
  HiOutlineInboxStack,
} from 'react-icons/hi2'
import { PiChalkboardTeacherDuotone } from 'react-icons/pi'
import StatsCard from '../../components/ui/StatsCard.jsx'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import WeeklyBarChart from '../../components/dashboard/WeeklyBarChart.jsx'
import { useStudents } from '../../hooks/useStudents.js'
import { useTeachers } from '../../hooks/useTeachers.js'
import { useSubjects } from '../../hooks/useSubjects.js'
import { useExams } from '../../hooks/useExams.js'
import { useExamAttempts } from '../../hooks/useExamAttempts.js'
import { computeWeeklyActivity, computeRecentActivity, parseStoredTimestamp, timeAgo } from '../../utils/statsUtils.js'
import { getNotifications, subscribe } from '../../services/notifications.js'

const EXAM_STATUS_TONE = {
  Published: 'success',
  Draft: 'neutral',
}

function PassDonut({ passed, total }) {
  const failed = total - passed
  const ratio = total ? passed / total : 0
  const dash = `${ratio * 282.7} 282.7`

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#EEF2F7" strokeWidth="12" />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#22C55E"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={dash}
            initial={{ strokeDasharray: '0 282.7' }}
            animate={{ strokeDasharray: dash }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-2xl font-extrabold text-slate-900">{total ? Math.round(ratio * 100) : 0}%</p>
          <p className="text-[11px] font-semibold text-slate-400">نسبة النجاح</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2 font-semibold text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" /> ناجح
          <span className="ms-auto font-extrabold text-slate-900">{passed}</span>
        </li>
        <li className="flex items-center gap-2 font-semibold text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> راسب
          <span className="ms-auto font-extrabold text-slate-900">{failed}</span>
        </li>
      </ul>
    </div>
  )
}

const QUICK_ACTIONS = [
  { to: '/admin/students', label: 'إضافة طالب', icon: <HiOutlineUserPlus /> },
  { to: '/admin/teachers', label: 'إضافة مدرس', icon: <PiChalkboardTeacherDuotone /> },
  { to: '/admin/exams', label: 'إدارة الامتحانات', icon: <HiOutlinePlus /> },
  { to: '/admin/reports', label: 'التقارير', icon: <HiOutlineChartPie /> },
]

/** Commercial-grade admin home — every number is computed from the live dataset. */
export default function Dashboard() {
  const { students, totalCount: studentTotal } = useStudents()
  const { teachers, totalCount: teacherTotal, loading: teacherLoading } = useTeachers()
  const { subjects } = useSubjects()
  const { exams } = useExams()
  const { attempts } = useExamAttempts()
  const liveNotifications = useSyncExternalStore(subscribe, getNotifications)

  const passed = attempts.filter((a) => a.passed).length
  const activeTeachers = teacherLoading ? teacherTotal : teachers.filter((t) => t.status === 'Active').length
  const publishedExams = exams.filter((e) => e.status === 'Published').length
  const weekly = computeWeeklyActivity(attempts)
  const hasData = studentTotal + teachers.length + exams.length + attempts.length + subjects.length > 0

  // Latest exams — newest first by the exam's real creation date/time.
  const latestExams = useMemo(() => {
    return [...exams].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 4)
  }, [exams])

  // Recent activity — merged from the live dataset (students/exams/attempts,
  // all reactive to repository changes) plus the real-time event feed for the
  // event types that leave no dataset record (exam started/edited/deleted,
  // teacher added/edited/deleted). Sorted by the true event timestamp.
  const activity = useMemo(() => {
    const FEED_ONLY = new Set([
      'exam_started',
      'exam_updated',
      'exam_deleted',
      'teacher_added',
      'teacher_updated',
      'teacher_deleted',
    ])
    const items = []
    for (const item of computeRecentActivity({ students, exams, attempts }, 12)) {
      items.push({ key: item.key, text: item.text, date: item.date })
    }
    for (const n of liveNotifications) {
      if (!FEED_ONLY.has(n.type)) continue
      items.push({ key: n.id, text: n.text, date: n.createdAt })
    }
    const toMs = (d) => {
      const t = parseStoredTimestamp(d)
      return t ? t.getTime() : 0
    }
    items.sort((a, b) => toMs(b.date) - toMs(a.date))
    return items.slice(0, 6).map((item) => ({ ...item, time: timeAgo(item.date) }))
  }, [students, exams, attempts, liveNotifications])

  const STATS = [
    { icon: <HiOutlineAcademicCap />, label: 'إجمالي الطلاب', value: studentTotal, tone: 'primary' },
    { icon: <PiChalkboardTeacherDuotone />, label: 'المدرسون النشطون', value: activeTeachers, tone: 'secondary' },
    { icon: <HiOutlineBookOpen />, label: 'المواد الدراسية', value: subjects.length, tone: 'success' },
    { icon: <HiOutlineClipboardDocumentList />, label: 'الامتحانات المنشورة', value: publishedExams, tone: 'warning' },
  ]

  const latestStudents = students.slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col gap-4 overflow-hidden rounded-card bg-gradient-to-l from-primary to-secondary p-6 text-white shadow-soft sm:p-8 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-100">
            <HiOutlineSparkles className="h-5 w-5" />
            <p className="text-sm font-bold">نظرة عامة على المنصة</p>
          </div>
          <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">أهلاً بك في لوحة الإدارة 👋</h2>
          <p className="mt-1 text-sm font-medium text-blue-50">
            {hasData
              ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date())
              : 'ابدأ بإضافة بياناتك أو اعرض المنصة ببيانات تجريبية.'}
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
          <Link
            to="/admin/demo-data"
            className="flex items-center justify-center gap-2 rounded-xl bg-white text-primary px-4 py-3 text-sm font-extrabold ring-1 ring-white/30 transition-colors hover:bg-white/90"
          >
            <HiOutlineSparkles className="text-lg" />
            بيانات تجريبية
          </Link>
          {QUICK_ACTIONS.map((qa) => (
            <Link
              key={qa.label}
              to={qa.to}
              className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-3 text-sm font-bold ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <span className="text-lg">{qa.icon}</span>
              {qa.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <StatsCard key={stat.label} {...stat} delay={index * 0.06} />
        ))}
      </div>

      {!hasData && (
        <EmptyState
          icon={<HiOutlineInboxStack />}
          title="لا توجد بيانات بعد"
          description="لوحة المعلومات فارغة حاليًا. حمّل البيانات التجريبية لملء جميع اللوحات في لمح البصر، أو ابدأ بإضافة طلاب وامتحانات بنفسك."
          action={
            <Link to="/admin/demo-data">
              <Button variant="outline" size="md" icon={<HiOutlineSparkles />}>تحميل بيانات تجريبية</Button>
            </Link>
          }
        />
      )}

      {/* Chart + results donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="نشاط الامتحانات الأسبوعي" className="lg:col-span-2" delay={0.1}>
          {attempts.length === 0 ? (
            <EmptyState
              className="py-10"
              icon={<HiOutlineChartPie />}
              title="لا توجد تسليمات هذا الأسبوع"
              description="عندما يُسجّل الطلاب نتائج، سيرسم هذا المخطط نشاط التسليم عبر الأيام السبعة الأخيرة."
            />
          ) : (
            <WeeklyBarChart data={weekly} />
          )}
        </DashboardCard>

        <DashboardCard title="نتائج الطلاب" delay={0.15}>
          {attempts.length === 0 ? (
            <EmptyState className="py-10" title="لا توجد نتائج بعد" description="ستظهر نسب النجاح هنا بمجرد تسجيل أول نتيجة." />
          ) : (
            <PassDonut passed={passed} total={attempts.length} />
          )}
        </DashboardCard>
      </div>

      {/* Latest students + latest exams */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard
          title="آخر الطلاب المسجلين"
          action={
            students.length > 0 && (
              <Link to="/admin/students" className="text-xs font-bold text-primary hover:text-secondary">عرض الكل</Link>
            )
          }
          delay={0.2}
        >
          {latestStudents.length === 0 ? (
            <EmptyState
              className="py-10"
              title="لا يوجد طلاب حتى الآن"
              description="أضف أول طالب أو حمّل بيانات تجريبية."
              action={<Link to="/admin/students"><Button size="sm" variant="outline">إضافة طالب</Button></Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-50">
              {latestStudents.map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                      {student.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.grade}</p>
                    </div>
                  </div>
                  <Badge tone={student.status === 'Active' ? 'success' : 'neutral'}>
                    {student.status === 'Active' ? 'نشط' : 'غير نشط'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="آخر الامتحانات"
          action={
            exams.length > 0 && (
              <Link to="/admin/exams" className="text-xs font-bold text-primary hover:text-secondary">عرض الكل</Link>
            )
          }
          delay={0.25}
        >
          {latestExams.length === 0 ? (
            <EmptyState
              className="py-10"
              title="لا توجد امتحانات بعد"
              description="أنشئ أول امتحان أو حمّل بيانات تجريبية."
              action={<Link to="/admin/exams"><Button size="sm" variant="outline">إدارة الامتحانات</Button></Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-50">
              {latestExams.map((exam) => (
                <li key={exam.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{exam.name}</p>
                    <p className="text-xs text-slate-400">{exam.subject} · {exam.grade}</p>
                  </div>
                  <Badge tone={EXAM_STATUS_TONE[exam.status] ?? 'neutral'}>{exam.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      {/* Recent activity */}
      <DashboardCard title="آخر النشاطات" delay={0.3}>
        {activity.length === 0 ? (
          <EmptyState
            className="py-10"
            icon={<HiOutlineInboxStack />}
            title="لا يوجد نشاط بعد"
            description="ستظهر الإضافات والامتحانات والنتائج هنا تلقائيًا."
          />
        ) : (
          <ul className="space-y-4">
            {activity.map((item) => (
              <li key={item.key} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">{item.text}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  )
}