import { motion } from 'framer-motion'
import {
  HiOutlinePencilSquare,
  HiOutlineDocumentDuplicate,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2'
import Badge from '../ui/Badge.jsx'
import { cn } from '../../utils/cn.js'

const OPTIONS_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

/**
 * A single question rendered inside the Question Builder.
 * Shows the question text, its type, score, and the full answer set with
 * the correct answer visually highlighted, plus edit / duplicate / delete
 * actions. Animated in/out via the parent's AnimatePresence layout.
 */
export default function QuestionCard({ question, index, onEdit, onDelete, onDuplicate }) {
  const isMcq = question.type === 'MCQ'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-relaxed text-slate-800">{question.text}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={isMcq ? 'primary' : 'neutral'}>
                {isMcq ? 'اختيار من متعدد' : 'صح أو خطأ'}
              </Badge>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
                {question.score} درجة
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="تعديل"
            onClick={() => onEdit(question)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-amber-50 hover:text-amber-600"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="تكرار السؤال"
            onClick={() => onDuplicate(question)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <HiOutlineDocumentDuplicate className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="حذف"
            onClick={() => onDelete(question)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-danger"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
        {isMcq
          ? question.options.map((option, i) => {
              const correct = i === question.correctIndex
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ring-1',
                    correct
                      ? 'bg-green-50 text-emerald-700 ring-emerald-100'
                      : 'bg-slate-50/60 text-slate-600 ring-slate-100'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                      correct ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'
                    )}
                  >
                    {OPTIONS_LABELS[i]}
                  </span>
                  <span className="flex-1">{option}</span>
                  {correct && <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
                </div>
              )
            })
          : (
            <div className="flex flex-wrap gap-2">
              {[
                { value: true, label: 'صح' },
                { value: false, label: 'خطأ' },
              ].map((choice) => {
                const correct = choice.value === question.correctAnswer
                return (
                  <span
                    key={String(choice.value)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ring-1',
                      correct
                        ? 'bg-green-50 text-emerald-700 ring-emerald-100'
                        : 'bg-slate-50 text-slate-500 ring-slate-100'
                    )}
                  >
                    {correct ? <HiOutlineCheckCircle className="h-4 w-4" /> : <HiOutlineXCircle className="h-4 w-4" />}
                    {choice.label}
                  </span>
                )
              })}
            </div>
          )}
      </div>
    </motion.article>
  )
}