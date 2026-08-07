import { motion } from 'framer-motion'
import { HiOutlineClipboardDocumentCheck, HiOutlineClock, HiOutlineQuestionMarkCircle } from 'react-icons/hi2'

const TILES = [
  { key: 'questions', label: 'عدد الأسئلة', tone: { bg: '#DBEAFE', fg: '#2563EB' } },
  { key: 'score', label: 'إجمالي الدرجات', tone: { bg: '#DCFCE7', fg: '#16A34A' } },
  { key: 'duration', label: 'مدة الامتحان', tone: { bg: '#FEF3C7', fg: '#D97706' } },
]

const ICONS = {
  questions: <HiOutlineQuestionMarkCircle />,
  score: <HiOutlineClipboardDocumentCheck />,
  duration: <HiOutlineClock />,
}

/**
 * Live-updating summary strip shown atop the Question Builder.
 * Question count, derived total score, and the exam duration stay in
 * sync automatically as questions are added/edited/removed.
 */
export default function ExamStats({ questionCount, totalScore, durationMinutes }) {
  const values = {
    questions: questionCount,
    score: totalScore,
    duration: durationMinutes ? `${durationMinutes} دقيقة` : '—',
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {TILES.map(({ key, label, tone }, index) => {
        const Icon = ICONS[key]
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: tone.bg, color: tone.fg }}
            >
              {Icon}
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-extrabold leading-none text-slate-900">{values[key]}</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}