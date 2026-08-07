import { HiOutlineCheckCircle } from 'react-icons/hi2'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import { EXAM_STATUSES } from '../../data/mockData.js'
import { calcTotalScore } from '../../utils/examUtils.js'

/**
 * Success confirmation shown the moment an exam is saved.
 * Confirms the exam was persisted (to mock data for now) and surfaces a
 * compact summary of what was saved before returning to the list.
 */
export default function ExamSavedModal({ isOpen, onClose, exam }) {
  if (!exam) return null

  const totalScore = calcTotalScore(exam.questions)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تم حفظ الامتحان بنجاح" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl text-accent">
          <HiOutlineCheckCircle />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          تم حفظ الامتحان <span className="font-bold text-slate-800">{exam.name}</span> بنجاح، ويمكنك إدارته من قائمة
          الامتحانات في أي وقت.
        </p>

        <div className="mt-5 w-full rounded-card bg-slate-50 p-4 ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المادة</span>
            <span className="text-sm font-bold text-slate-700">{exam.subject}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الأسئلة</span>
            <span className="text-sm font-bold text-slate-700">{exam.questions.length}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الدرجة الكلية</span>
            <span className="text-sm font-bold text-primary">{totalScore}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الحالة</span>
            <Badge tone={exam.status === 'Published' ? 'success' : 'neutral'}>
              {EXAM_STATUSES[exam.status] ?? exam.status}
            </Badge>
          </div>
        </div>

        <Button variant="primary" size="md" className="mt-6 w-full" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </Modal>
  )
}