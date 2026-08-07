import { motion } from 'framer-motion'
import {
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineClipboardDocumentCheck,
  HiOutlineListBullet,
} from 'react-icons/hi2'
import Modal from '../ui/Modal.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import { EXAM_STATUSES } from '../../data/mockData.js'
import { calcTotalScore } from '../../utils/examUtils.js'
import { cn } from '../../utils/cn.js'

const OPTIONS_LABELS = ['أ', 'ب', 'ج', 'د']

function MetaChip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  )
}

/**
 * Read-only preview of an exam exactly as a student would see it:
 * exam header (name, subject, stage/grade, duration, score) followed by
 * every question with its choices rendered as radio buttons. No correct
 * answers are revealed — this mirrors the student-taking-exam experience.
 */
export default function ExamPreview({ isOpen, onClose, exam }) {
  if (!exam) return null

  const totalScore = calcTotalScore(exam.questions)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="معاينة الامتحان" maxWidth="max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-5"
      >
        {/* Exam header */}
        <div className="rounded-card bg-gradient-to-l from-primary to-secondary p-5 text-white shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-blue-100">{exam.subject}</p>
              <h4 className="mt-1 font-display text-lg font-extrabold sm:text-xl">{exam.name}</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                <MetaChip icon={<HiOutlineAcademicCap className="h-4 w-4" />} label={`${exam.stage} · ${exam.grade}`} />
                <MetaChip icon={<HiOutlineClock className="h-4 w-4" />} label={`${exam.durationMinutes} دقيقة`} />
              </div>
            </div>
            <Badge tone={exam.status === 'Published' ? 'success' : 'neutral'}>
              {EXAM_STATUSES[exam.status] ?? exam.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-card bg-card p-4 ring-1 ring-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-primary">
              <HiOutlineListBullet />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-900">{exam.questions.length}</p>
              <p className="text-xs font-semibold text-slate-500">سؤال</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-card bg-card p-4 ring-1 ring-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg text-accent">
              <HiOutlineClipboardDocumentCheck />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-900">{totalScore}</p>
              <p className="text-xs font-semibold text-slate-500">الدرجة الكلية</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-4">
          {exam.questions.length === 0 ? (
            <p className="rounded-card bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
              لا توجد أسئلة في هذا الامتحان بعد
            </p>
          ) : (
            exam.questions.map((question, index) => (
              <div key={question.id} className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-relaxed text-slate-800">{question.text}</p>
                </div>

                <div className="mt-4 grid gap-2">
                  {question.type === 'MCQ'
                    ? question.options.map((option, i) => (
                        <label
                          key={i}
                          className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50/60 px-3 py-2.5 ring-1 ring-slate-100"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                            {OPTIONS_LABELS[i]}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{option}</span>
                        </label>
                      ))
                    : (
                      <div className="flex gap-3">
                        {['صح', 'خطأ'].map((label, i) => (
                          <span
                            key={label}
                            className={cn(
                              'flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-center text-sm font-bold text-slate-600',
                              i === 0 && 'border-r-4 border-r-emerald-400'
                            )}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            إغلاق المعاينة
          </Button>
        </div>
      </motion.div>
    </Modal>
  )
}