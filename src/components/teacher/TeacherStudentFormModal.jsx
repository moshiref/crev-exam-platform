import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { EDUCATIONAL_STAGES, GRADES_BY_STAGE } from '../../data/mockData.js'

const EMPTY = {
  name: '',
  id: '',
  password: '',
  stage: EDUCATIONAL_STAGES[0],
  grade: GRADES_BY_STAGE[EDUCATIONAL_STAGES[0]][0],
  parentPhone: '',
  status: 'Active',
  notes: '',
}

/**
 * Teacher-flavored student form. NO email field — students sign in with
 * Student ID + password only. Both the ID and password are optional: leave
 * them empty to auto-generate. Extra fields (parent phone, status, notes).
 */
export default function TeacherStudentFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const isEditMode = Boolean(initialData)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY, ...initialData } : EMPTY)
      setErrors({})
    }
  }, [isOpen, initialData])

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'stage') next.grade = GRADES_BY_STAGE[value][0]
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'اسم الطالب مطلوب'
    if (!form.parentPhone.trim()) next.parentPhone = 'رقم هاتف ولي الأمر مطلوب'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit(form)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="name"
          label="اسم الطالب"
          placeholder="مثال: محمد أحمد السيد"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          className="sm:col-span-2"
        />
        <Input
          id="studentId"
          label="كود الطالب (اتركه فارغًا للتوليد التلقائي)"
          placeholder="مثال: CREV-1025"
          dir="ltr"
          value={form.id}
          onChange={(e) => updateField('id', e.target.value)}
        />
        <Input
          id="password"
          label="كلمة المرور (اتركها فارغة للتوليد التلقائي)"
          placeholder="مثال: 483921"
          dir="ltr"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
        />
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
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="mb-1.5 block text-sm font-bold text-slate-700">
            ملاحظات
          </label>
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="أي ملاحظات خاصة بالطالب (اختياري)..."
            className="w-full rounded-xl border bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:border-primary focus:ring-blue-100"
          />
        </div>

        <div className="mt-2 flex gap-3 sm:col-span-2">
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