import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineChartPie,
} from 'react-icons/hi2'
import { motion } from 'framer-motion'
import StatsCard from '../../components/ui/StatsCard.jsx'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import WeeklyBarChart from '../../components/dashboard/WeeklyBarChart.jsx'
import { useExams } from '../../hooks/useExams.js'
import { useExamAttempts } from '../../hooks/useExamAttempts.js'
import { computeWeeklyActivity, todayKey } from '../../utils/statsUtils.js'
import { calcTotalScore } from '../../utils/examUtils.js'
import { getCurrentTeacher } from '../../services/auth.js'
import TeacherWelcomeCard from '../../components/teacher/TeacherWelcomeCard.jsx'

const EXAM_STATUS_TONE = { Published: 'success', Draft: 'neutral' }

const QUICK_ACTIONS = [
  { label: 'امتحان جديد', desc: 'إنشاء امتحان من الصفر', to: '/teacher/exams', icon: HiOutlineClipboardDocumentList, tone: 'from-primary to-secondary' },
  { label: 'عرض النتائج', desc: 'تصدير وتحليل النتائج', to: '/teacher/results', icon: HiOutlineChartPie, tone: 'from-amber-500 to-orange-500' },
]

/** Teacher dashboard home — stats, quick actions, chart and recent exams. */
export default function Home() {
  const currentTeacher = getCurrentTeacher()
  const { exams, totalCount } = useExams({ ownerId: currentTeacher?.id, ownerSubject: currentTeacher?.subject })
  const { attempts } = useExamAttempts()

  const myExamIds = useMemo(() => new Set(exams.map((e) => e.id)), [exams])
  const myAttempts = useMemo(
    () => attempts.filter((a) => myExamIds.has(a.examId)),
    [attempts, myExamIds]
  )

  const published = exams.filter((e) => e.status === 'Published')
  const scheduledToday = published.filter((e) => e.scheduledDate === todayKey()).length
  const totalAttempts = myAttempts.length
  const passed = myAttempts.filter((a) => a.passed).length
  const passRate = totalAttempts ? passed / totalAttempts : 0
  const weekly = computeWeeklyActivity(myAttempts)

  return (
    <div className="flex flex-col gap-6">
      <TeacherWelcomeCard />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">أهلاً بك في لوحة المدرس 👋</h2>
          <p className="mt-1 text-sm text-slate-500">إليك نظرة سريعة على امتحاناتك وطلابك اليوم.</p>
        </div>
        <Link to="/teacher/exams">
          <Button icon={<HiOutlineClipboardDocumentList />}>إنشاء امتحان جديد</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatsCard icon={<HiOutlineClipboardDocumentList />} label="إجمالي الامتحانات" value={totalCount} tone="primary" />
        <StatsCard icon={<HiOutlineChartPie />} label="امتحانات منشورة" value={published.length} tone="success" />
        <StatsCard icon={<HiOutlineClock />} label="امتحان مجدول" value={scheduledToday} tone="warning" />
        <StatsCard icon={<HiOutlineAcademicCap />} label="نسبة النجاح" value={passRate ? `${Math.round(passRate * 100)}%` : '—'} tone="secondary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon
          return (
            <Link key={action.label} to={action.to}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="flex items-center gap-4 rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-soft-lg"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-2xl text-white`}>
                  <Icon />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{action.label}</p>
                  <p className="text-xs font-semibold text-slate-400">{action.desc}</p>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="نشاط تسليم الامتحانات الأسبوعي" className="lg:col-span-2" delay={0.1}>
          {myAttempts.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50/60 text-sm font-semibold text-slate-400">
              لا توجد نتائج لرسمها بعد
            </div>
          ) : (
            <WeeklyBarChart data={weekly} />
          )}
        </DashboardCard>

        <DashboardCard title="آخر النتائج" delay={0.15}>
          <ul className="divide-y divide-slate-50">
            {myAttempts.slice(0, 5).map((attempt) => (
              <li key={attempt.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-800">{attempt.studentName}</p>
                  <Badge tone={attempt.passed ? 'success' : 'danger'}>
                    {attempt.passed ? 'ناجح' : 'راسب'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{attempt.examName} · {attempt.score}/{attempt.totalScore}</p>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      <DashboardCard
        title="أحدث الامتحانات"
        action={
          <Link to="/teacher/exams" className="text-xs font-bold text-primary hover:text-secondary">
            عرض الكل
          </Link>
        }
        delay={0.2}
      >
        <ul className="divide-y divide-slate-50">
          {exams.slice(0, 4).map((exam) => (
            <li key={exam.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                  {exam.subject.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{exam.name}</p>
                  <p className="text-xs text-slate-400">{exam.questions.length} سؤال · {calcTotalScore(exam.questions)} درجة</p>
                </div>
              </div>
              <Badge tone={EXAM_STATUS_TONE[exam.status] ?? 'neutral'}>
                {exam.status === 'Published' ? 'منشور' : 'مسودة'}
              </Badge>
            </li>
          ))}
        </ul>
      </DashboardCard>
    </div>
  )
}