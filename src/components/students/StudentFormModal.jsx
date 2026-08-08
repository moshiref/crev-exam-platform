import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { EDUCATIONAL_STAGES, GRADES_BY_STAGE } from '../../data/mockData.js'

const EMPTY_FORM = {
  name: '',
  stage: EDUCATIONAL_STAGES[0],
  grade: GRADES_BY_STAGE[EDUCATIONAL_STAGES[0]][0],
  parentPhone: '',
  status: 'Active',
}

/**
 * Add / Edit Student modal.
 * In "add" mode, submitting hands the form values up to the parent,
 * which is responsible for generating the ID/password/PIN (via
 * `useStudents`) and showing the success summary.
 */
export default function StudentFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const isEditMode = Boolean(initialData)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  // Reset the form whenever the modal opens (fresh for "add",
  // pre-filled for "edit").
  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setErrors({})
    }
  }, [isOpen, initialData])

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Keep grade in sync with the selected educational stage.
      if (field === 'stage') {
        next.grade = GRADES_BY_STAGE[value][0]
      }
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'اسم الطالب مطلوب'
    if (!form.parentPhone.trim()) nextErrors.parentPhone = 'رقم هاتف ولي الأمر مطلوب'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit(form)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="اسم الطالب"
          placeholder="مثال: محمد أحمد السيد"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          id="parentPhone"
          label="رقم هاتف ولي الأمر"
          placeholder="01xxxxxxxxx"
          dir="ltr"
          value={form.parentPhone}
          onChange={(e) => updateField('parentPhone', e.target.value)}
          error={errors.parentPhone}
        />

        <Select
          id="status"
          label="الحالة"
          options={[
            { value: 'Active', label: 'نشط' },
            { value: 'Inactive', label: 'غير نشط' },
          ]}
          value={form.status}
          onChange={(e) => updateField('status', e.target.value)}
        />

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1">
            {isEditMode ? 'حفظ التعديلات' : 'حفظ وإنشاء الطالب'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
