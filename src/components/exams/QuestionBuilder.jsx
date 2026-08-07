import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import ExamStats from './ExamStats.jsx'
import QuestionCard from './QuestionCard.jsx'
import { EXAM_STATUSES } from '../../data/mockData.js'
import { calcTotalScore } from '../../utils/examUtils.js'

/**
 * Step 2 of the exam builder — the full Question Builder.
 * Top strip shows live stats (question count / total score / duration),
 * then the editable question list, a large "add question" action, and a
 * footer with preview + save. All state is lifted to the Exams page;
 * this component stays purely presentational and callback-driven.
 */
export default function QuestionBuilder({
  exam,
  saveError,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onPreview,
  onSave,
}) {
  const { info, questions, isNew } = exam
  const totalScore = calcTotalScore(questions)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Builder header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            title="العودة لقائمة الامتحانات"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-slate-500 shadow-soft ring-1 ring-slate-100 transition-colors hover:text-primary"
          >
            <HiOutlineArrowRight className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">منشئ الأسئلة</h2>
              <Badge tone={info.status === 'Published' ? 'success' : 'neutral'}>
                {EXAM_STATUSES[info.status] ?? info.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {info.name || 'امتحان بدون اسم'} — {info.subject} · {info.grade}
            </p>
          </div>
        </div>
      </div>

      {/* Live stats */}
      <ExamStats
        questionCount={questions.length}
        totalScore={totalScore}
        durationMinutes={info.durationMinutes}
      />

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-card p-10 text-center shadow-soft ring-1 ring-slate-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-primary">
            <HiOutlinePlus />
          </div>
          <p className="text-sm font-bold text-slate-700">لا توجد أسئلة بعد</p>
          <p className="max-w-xs text-xs text-slate-500">
            ابدأ بإضافة أول سؤال إلى امتحانك باستخدام الزر أدناه، وستتحدث الإحصائيات تلقائيًا.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onEdit={onEditQuestion}
                onDelete={onDeleteQuestion}
                onDuplicate={onDuplicateQuestion}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add question */}
      <button
        type="button"
        onClick={onAddQuestion}
        className="flex items-center justify-center gap-2 rounded-card border-2 border-dashed border-blue-200 bg-blue-50/40 py-5 text-sm font-bold text-primary transition-colors duration-200 hover:border-primary hover:bg-blue-50"
      >
        <HiOutlinePlus className="text-xl" />
        إضافة سؤال جديد
      </button>

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-danger ring-1 ring-red-100"
        >
          <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0" />
          {saveError}
        </motion.div>
      )}

      {/* Footer actions */}
      <div className="flex flex-col-reverse gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-400">
          {isNew ? 'سيتم حفظ الامتحان كمسودة حتى تكتمل الأسئلة.' : 'سيتم حفظ تعديلاتك على الامتحان.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" icon={<HiOutlineEye />} onClick={onPreview}>
            معاينة الامتحان
          </Button>
          <Button variant="success" icon={<HiOutlineCheckCircle />} onClick={onSave}>
            حفظ الامتحان
          </Button>
        </div>
      </div>
    </motion.div>
  )
}