import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineSparkles, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineCircleStack } from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import * as repo from '../../services/repository.js'

const COUNT_ITEMS = [
  { key: 'students', label: 'الطلاب', tone: 'primary' },
  { key: 'teachers', label: 'المدرسون', tone: 'secondary' },
  { key: 'subjects', label: 'المواد', tone: 'success' },
  { key: 'exams', label: 'الامتحانات', tone: 'warning' },
  { key: 'attempts', label: 'النتائج', tone: 'danger' },
]

function readCounts() {
  return {
    students: repo.listStudents().length,
    teachers: repo.listTeachers().length,
    subjects: repo.listSubjects().length,
    exams: repo.listExams().length,
    attempts: repo.listExamAttempts().length,
    classes: repo.listClasses().length,
  }
}

/**
 * Demo Data — one-click populate / reset of the whole platform.
 * Fills every dashboard with a generated dataset, or returns the system
 * to its clean, empty state.
 */
export default function DemoData() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState(readCounts)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const clearDialog = useDisclosure(false)

  const hasData = Object.values(counts).some((v) => v > 0)

  async function handleLoad() {
    setBusy(true)
    setFeedback(null)
    try {
      const summary = await repo.loadDemoData()
      setCounts(summary)
      setFeedback('تم تحميل البيانات التجريبية بنجاح — امتلأت جميع اللوحات تلقائيًا.')
    } catch {
      setFeedback('تعذّر تحميل البيانات التجريبية. حاول مرة أخرى.')
    } finally {
      setBusy(false)
    }
  }

  async function handleClear() {
    setBusy(true)
    clearDialog.close()
    try {
      await repo.clearDemoData()
      setCounts(readCounts())
      setFeedback('تم حذف جميع البيانات — النظام عاد إلى حالته الفارغة.')
    } catch {
      setFeedback('تعذّر حذف البيانات. حاول مرة أخرى.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">البيانات التجريبية</h2>
        <p className="mt-1 text-sm text-slate-500">
          املأ المنصة ببيانات تجريبية واقعية للاستعراض، أو أعدها إلى حالتها الفارغة.
        </p>
      </div>

      {feedback && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
          <HiOutlineCheckCircle className="h-5 w-5 shrink-0" />
          {feedback}
        </div>
      )}

      <DashboardCard title="تحميل بيانات تجريبية">
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-slate-500">
            عند الضغط على الزر، يتم إنشاء مجموعة بيانات كاملة ومترابطة داخل نظام البيانات:
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COUNT_ITEMS.map(({ key, label, tone }) => (
              <div key={key} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="font-display text-2xl font-extrabold text-slate-900">{counts[key]}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
                <Badge tone={tone} className="mt-2">{counts[key] > 0 ? 'متاح' : 'فارغ'}</Badge>
              </div>
            ))}
          </div>

          <Button size="lg" icon={<HiOutlineSparkles />} onClick={handleLoad} disabled={busy}>
            {busy ? 'جارٍ التحميل...' : 'تحميل بيانات تجريبية'}
          </Button>

          <div className="rounded-2xl bg-blue-50/60 p-4 ring-1 ring-blue-100">
            <p className="text-xs font-semibold leading-relaxed text-primary">
              تشمل البيانات: 5 مدرسين · 50 طالبًا · 6 مواد · 10 امتحانات · نتائج مرتبطة بنسب نجاح ودرجات متنوعة،
              مع نشاط حديث وإشعارات تُحتسب تلقائيًا في جميع الصفحات.
            </p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="إعادة النظام إلى الحالة الفارغة">
        <div className="flex flex-col gap-4">
          {!hasData ? (
            <EmptyState
              icon={<HiOutlineCircleStack />}
              title="النظام فارغ حاليًا"
              description="لا توجد بيانات حاليًا. استخدم زر «تحميل بيانات تجريبية» لملء المنصة أو ابدأ بإضافة بياناتك بنفسك."
            />
          ) : (
            <>
              <p className="text-sm leading-relaxed text-slate-500">
                حذف البيانات التجريبية يزيل جميع الطلاب والمدرسين والمواد والامتحانات والنتائج ويعيد النظام إلى
                حالته الفارغة.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="danger" icon={<HiOutlineTrash />} onClick={clearDialog.open} disabled={busy}>
                  حذف البيانات التجريبية
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                  الذهاب إلى لوحة التحكم
                </Button>
              </div>
            </>
          )}
        </div>
      </DashboardCard>

      <ConfirmDialog
        isOpen={clearDialog.isOpen}
        onClose={clearDialog.close}
        onConfirm={handleClear}
        title="حذف جميع البيانات"
        description="سيتم حذف جميع الطلاب والمدرسين والمواد والامتحانات والنتائج نهائيًا. هل أنت متأكد؟"
      />
    </div>
  )
}