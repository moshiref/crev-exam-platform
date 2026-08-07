import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
} from 'react-icons/hi2'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import ExamStats from '../exams/ExamStats.jsx'
import QuestionCard from '../exams/QuestionCard.jsx'
import { EXAM_STATUSES } from '../../data/mockData.js'
import { calcTotalScore } from '../../utils/examUtils.js'
import { cn } from '../../utils/cn.js'

/**
 * Step 2 of the TEACHER exam builder — the question list with reordering.
 * Questions can be reordered with the chevron buttons or by dragging the
 * handle on each card. Live stats (count / total score / duration) come from
 * ExamStats. The card itself is the shared QuestionCard.
 */
export default function TeacherQuestionBuilder({
  exam,
  saveError,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestion,
  onPreview,
  onSave,
}) {
  const { info, questions } = exam
  const totalScore = calcTotalScore(questions)
  const [dragIndex, setDragIndex] = useState(null)

  function handleDrop(targetIndex) {
    if (dragIndex === null || dragIndex === targetIndex) return
    onMoveQuestion(dragIndex, targetIndex)
    setDragIndex(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
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

      <ExamStats questionCount={questions.length} totalScore={totalScore} durationMinutes={info.durationMinutes} />

      <p className="-mb-2 text-xs font-semibold text-slate-400">
        اسحب الأسئلة لإعادة ترتيبها، أو استخدم الأسهم لعملية ترتيب دقيقة.
      </p>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-card p-10 text-center shadow-soft ring-1 ring-slate-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-primary">
            <HiOutlinePlus />
          </div>
          <p className="text-sm font-bold text-slate-700">لا توجد أسئلة بعد</p>
          <p className="max-w-xs text-xs text-slate-500">
            ابدأ بإضافة أول سؤال إلى امتحانك باستخدام الزر أدناه.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => setDragIndex(null)}
                className={cn('flex flex-col gap-2 rounded-card p-1 transition-all duration-200', dragIndex === index && 'opacity-50')}
              >
                <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <span className="cursor-grab select-none" title="اسحب للترتيب">
                      ⠿
                    </span>
                    <span>سؤال {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="تحريك لأعلى"
                      disabled={index === 0}
                      onClick={() => onMoveQuestion(index, index - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <HiOutlineChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="تحريك لأسفل"
                      disabled={index === questions.length - 1}
                      onClick={() => onMoveQuestion(index, index + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <HiOutlineChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <QuestionCard
                  question={question}
                  index={index}
                  onEdit={onEditQuestion}
                  onDelete={onDeleteQuestion}
                  onDuplicate={onDuplicateQuestion}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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

      <div className="flex flex-col-reverse gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-400">إجمالي درجة الامتحان: {totalScore}</p>
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