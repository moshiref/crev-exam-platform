import { useEffect, useRef, useState } from 'react'
import { HiOutlineArrowLeft } from 'react-icons/hi2'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { EDUCATIONAL_STAGES, EXAM_STATUSES } from '../../data/mockData.js'
import { getCurrentTeacher } from '../../services/auth.js'
import { getTeacherById, getTeacherPermissions } from '../../services/repository.js'
import { stageOfGrade } from '../../utils/educationLevels.js'

const EMPTY = {
  name: '',
  subject: '',
  stage: EDUCATIONAL_STAGES[0],
  grade: '',
  scheduledDate: '',
  startTime: '',
  endTime: '',
  durationMinutes: 30,
  instructions: '',
  passScore: 0,
  status: 'Draft',
}

/**
 * Step 1 of the teacher exam builder.
 * Basic details plus scheduling, instructions and the pass score threshold.
 * Subject / stage / grade come EXCLUSIVELY from the teacher's admin-defined
 * permissions (subjects / stages / grades). Single allowed values are chosen
 * automatically and locked.
 */
export default function ExamInfoForm({ isOpen, onClose, onSubmit, initialData }) {
  const sessionTeacher = getCurrentTeacher()

  const [perms, setPerms] = useState(() => getTeacherPermissions(sessionTeacher))

  // Always pull the latest permissions from the DB — the admin is the source
  // of truth (teachers.subjects / stages / grades). The session can be stale
  // (e.g. grades granted AFTER the teacher logged in), so relying only on the
  // session leaves the grade list empty. `getTeacherById` maps the columns
  // into clean arrays, so `grades` here are exactly what the admin saved.
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!sessionTeacher?.id) return
      const fetched = await getTeacherById(sessionTeacher.id)
      if (!active || !fetched) return
      setPerms(getTeacherPermissions(fetched))
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allowedSubjects = perms.subjects
  const allowedStages = perms.stages
  const allowedGrades = perms.grades

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const isEditMode = Boolean(initialData)

  // Grades come EXCLUSIVELY from the admin-set `grades` (teachers.grades),
  // filtered to the currently selected stage. If a grade can't be matched to a
  // stage (e.g. custom names), fall back to the full allowed list so the field
  // is never empty — the exact admin values are always shown.
  const gradeOptions = (() => {
    const forStage = allowedGrades.filter((g) => stageOfGrade(g) === form.stage)
    return forStage.length ? forStage : allowedGrades
  })()
  const lockSubject = allowedSubjects.length === 1
  const lockStage = allowedStages.length === 1
  const lockGrade = gradeOptions.length === 1

  function buildInitial() {
    const subject = allowedSubjects.includes(initialData?.subject) ? initialData.subject : allowedSubjects[0] ?? ''
    const stage = allowedStages.includes(initialData?.stage) ? initialData.stage : allowedStages[0] ?? ''
    const forStage = allowedGrades.filter((g) => stageOfGrade(g) === stage)
    const eligible = forStage.length ? forStage : allowedGrades
    const grade = eligible.includes(initialData?.grade) ? initialData.grade : eligible[0] ?? ''
    return { ...EMPTY, ...initialData, subject, stage, grade }
  }

  // Build the form ONCE each time the dialog opens (transition from closed).
  // Re-renders and permission refreshes never rebuild, so a teacher's chosen
  // stage/grade are never reset behind them.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true
      setForm(buildInitial())
      setErrors({})
    }
    if (!isOpen) wasOpenRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // If permissions arrive late (async fetch) and the stage or grade is still
  // empty, auto-fill from the freshly-loaded admin permissions so the grade
  // dropdown is never left empty.
  useEffect(() => {
    if (!isOpen) return
    setForm((prev) => {
      if (prev.stage && prev.grade) return prev
      return buildInitial()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, perms])

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'stage') {
        const forStage = allowedGrades.filter((g) => stageOfGrade(g) === value)
        const eligible = forStage.length ? forStage : allowedGrades
        next.grade = eligible.includes(prev.grade) ? prev.grade : (eligible[0] ?? '')
      }
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'اسم الامتحان مطلوب'
    if (!form.durationMinutes || Number(form.durationMinutes) <= 0) next.durationMinutes = 'أدخل مدة صحيحة بالدقائق'
    if (!form.stage) next.stage = 'حدد المرحلة التعليمية'
    if (!form.grade) next.grade = 'حدد الصف الدراسي'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'تعديل بيانات الامتحان' : 'إنشاء امتحان جديد'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="name"
          label="اسم الامتحان"
          placeholder="مثال: امتحان نهاية الوحدة الأولى"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          className="sm:col-span-2"
        />
        <Select
          id="subject"
          label="المادة"
          options={allowedSubjects}
          value={form.subject}
          disabled={Boolean(form.subject) && lockSubject}
          onChange={(e) => updateField('subject', e.target.value)}
        />
        <Select
          id="stage"
          label="المرحلة التعليمية"
          options={allowedStages}
          value={form.stage}
          disabled={Boolean(form.stage) && lockStage}
          error={errors.stage}
          onChange={(e) => updateField('stage', e.target.value)}
        />
        <Select
          id="grade"
          label="الصف الدراسي"
          options={gradeOptions}
          value={form.grade}
          disabled={Boolean(form.grade) && lockGrade}
          error={errors.grade}
          onChange={(e) => updateField('grade', e.target.value)}
        />
        <Select
          id="status"
          label="حالة الامتحان"
          options={Object.entries(EXAM_STATUSES).map(([value, label]) => ({ value, label }))}
          value={form.status}
          onChange={(e) => updateField('status', e.target.value)}
        />
        <Input
          id="scheduledDate"
          label="تاريخ الامتحان"
          type="date"
          value={form.scheduledDate}
          onChange={(e) => updateField('scheduledDate', e.target.value)}
        />
        <Input
          id="startTime"
          label="وقت البدء"
          type="time"
          value={form.startTime}
          onChange={(e) => updateField('startTime', e.target.value)}
        />
        <Input
          id="endTime"
          label="وقت الانتهاء"
          type="time"
          value={form.endTime}
          onChange={(e) => updateField('endTime', e.target.value)}
        />
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
        <Input
          id="passScore"
          label="درجة النجاح"
          type="number"
          min={0}
          dir="ltr"
          value={form.passScore}
          onChange={(e) => updateField('passScore', e.target.value)}
        />

        <div className="sm:col-span-2">
          <label htmlFor="instructions" className="mb-1.5 block text-sm font-bold text-slate-700">
            تعليمات الامتحان
          </label>
          <textarea
            id="instructions"
            rows={3}
            value={form.instructions}
            onChange={(e) => updateField('instructions', e.target.value)}
            placeholder="اكتب التعليمات التي يراها الطالب قبل بدء الامتحان..."
            className="w-full rounded-xl border bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:border-primary focus:ring-blue-100"
          />
        </div>

        <div className="mt-2 flex gap-3 sm:col-span-2">
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