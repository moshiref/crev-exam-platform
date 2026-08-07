import { useEffect, useState } from 'react'
import { HiOutlineArrowLeft } from 'react-icons/hi2'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { EDUCATIONAL_STAGES, GRADES_BY_STAGE, EXAM_STATUSES } from '../../data/mockData.js'
import { useSubjects } from '../../hooks/useSubjects.js'

/**
 * Step 1 of the exam builder — capture the exam's basic details.
 * Submitting with "التالي" hands the values up so the parent can start
 * the Question Builder with these settings. Total marks are NOT entered
 * here; that is derived automatically from the questions.
 * Subject options come from the shared data repository so newly added
 * subjects show up here automatically.
 */
export default function ExamForm({ isOpen, onClose, onSubmit, initialData }) {
  const { subjects } = useSubjects()
  const subjectNames = subjects.map((subject) => subject.name)
  const defaultSubject = subjectNames[0] ?? ''

  const isEditMode = Boolean(initialData)
  const [errors, setErrors] = useState({})

  const EMPTY_FORM = {
    name: '',
    subject: defaultSubject,
    stage: EDUCATIONAL_STAGES[0],
    grade: GRADES_BY_STAGE[EDUCATIONAL_STAGES[0]][0],
    durationMinutes: 30,
    status: 'Draft',
  }
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData])

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'stage') {
        next.grade = GRADES_BY_STAGE[value][0]
      }
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'اسم الامتحان مطلوب'
    if (!form.durationMinutes || Number(form.durationMinutes) <= 0) {
      nextErrors.durationMinutes = 'أدخل مدة صحيحة بالدقائق'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit(form)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'تعديل بيانات الامتحان' : 'إنشاء امتحان جديد'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="اسم الامتحان"
          placeholder="مثال: امتحان نهاية الوحدة الأولى"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
        />

        <Select
          id="subject"
          label="المادة"
          options={subjectNames}
          value={form.subject}
          onChange={(e) => updateField('subject', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="stage"
            label="المرحلة التعليمية"
            options={EDUCATIONAL_STAGES}
            value={form.stage}
            onChange={(e) => updateField('stage', e.target.value)}
          />
          <Select
            id="grade"
            label="الصف الدراسي"
            options={GRADES_BY_STAGE[form.stage]}
            value={form.grade}
            onChange={(e) => updateField('grade', e.target.value)}
          />
        </div>

        <Input
          id="duration"
          label="مدة الامتحان (بالدقائق)"
          type="number"
          min={1}
          dir="ltr"
          value={form.durationMinutes}
          onChange={(e) => updateField('durationMinutes', e.target.value)}
          error={errors.durationMinutes}
        />

        <Select
          id="status"
          label="حالة الامتحان"
          options={Object.entries(EXAM_STATUSES).map(([value, label]) => ({ value, label }))}
          value={form.status}
          onChange={(e) => updateField('status', e.target.value)}
        />

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" icon={<HiOutlineArrowLeft />}>
            التالي
          </Button>
        </div>
      </form>
    </Modal>
  )
}