import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { cn } from '../../utils/cn.js'

const EMPTY_FORM = {
  text: '',
  type: 'MCQ',
  score: 1,
  options: ['', '', '', ''],
  correctIndex: 0,
  correctAnswer: true,
}

const TYPE_OPTIONS = [
  { value: 'MCQ', label: 'اختيار من متعدد' },
  { value: 'TF', label: 'صح أو خطأ' },
]

/**
 * Step 2 form for a single question (used inside the Question Builder to
 * add or edit one question at a time).
 *  - MCQ: four choices + a radio button per option marks the correct one.
 *  - True/False: a صح/خطأ radio marks the correct answer.
 * The default score is 1 and can be set to any value.
 */
export default function QuestionForm({ isOpen, onClose, onSubmit, initialData }) {
  const isEditMode = Boolean(initialData)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setErrors({})
    }
  }, [isOpen, initialData])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateOption(index, value) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }))
  }

  function addOption() {
    setForm((prev) => {
      if (prev.options.length >= 6) return prev
      return { ...prev, options: [...prev.options, ''] }
    })
  }

  function removeOption(index) {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev // keep at least two choices
      const options = prev.options.filter((_, i) => i !== index)
      const correctIndex =
        prev.correctIndex >= options.length
          ? options.length - 1
          : prev.correctIndex > index
            ? prev.correctIndex - 1
            : prev.correctIndex
      return { ...prev, options, correctIndex }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!form.text.trim()) nextErrors.text = 'نص السؤال مطلوب'
    if (form.type === 'MCQ') {
      if (form.options.some((option) => !option.trim())) {
        nextErrors.options = 'يجب ملء جميع الاختيارات'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload =
      form.type === 'MCQ'
        ? {
            text: form.text.trim(),
            type: 'MCQ',
            score: Number(form.score) || 1,
            options: form.options,
            correctIndex: form.correctIndex,
          }
        : {
            text: form.text.trim(),
            type: 'TF',
            score: Number(form.score) || 1,
            options: null,
            correctAnswer: form.correctAnswer,
          }

    onSubmit(payload)
  }

  const isMcq = form.type === 'MCQ'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="question-text" className="mb-1.5 block text-sm font-bold text-slate-700">
              نص السؤال
            </label>
            <textarea
              id="question-text"
              rows={3}
              value={form.text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder="اكتب نص السؤال هنا..."
              className={cn(
                'w-full rounded-xl border bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4',
                errors.text
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-slate-200 focus:border-primary focus:ring-blue-100'
              )}
            />
            {errors.text && <p className="mt-1.5 text-xs font-semibold text-danger">{errors.text}</p>}
          </div>

          <div className="w-40 shrink-0">
            <label htmlFor="question-type" className="mb-1.5 block text-sm font-bold text-slate-700">
              نوع السؤال
            </label>
            <select
              id="question-type"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-40">
          <label htmlFor="question-score" className="mb-1.5 block text-sm font-bold text-slate-700">
            درجة السؤال
          </label>
          <input
            id="question-score"
            type="number"
            min={1}
            step={1}
            dir="ltr"
            value={form.score}
            onChange={(e) => updateField('score', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {isMcq ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">الاختيارات — حدد الإجابة الصحيحة</label>
              <span className="text-xs font-semibold text-slate-400">{form.options.length} من 6</span>
            </div>
            {form.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-2 pr-3 transition-colors focus-within:border-primary focus-within:bg-white"
              >
                <label
                  className={cn(
                    'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm font-bold transition-colors',
                    form.correctIndex === index
                      ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-soft'
                      : 'bg-white text-slate-400 ring-1 ring-slate-200'
                  )}
                >
                  {index + 1}
                  <input
                    type="radio"
                    name="correct-option"
                    value={index}
                    checked={form.correctIndex === index}
                    onChange={() => updateField('correctIndex', index)}
                    className="sr-only"
                  />
                </label>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`الاختيار ${index + 1}`}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  title="حذف الاختيار"
                  disabled={form.options.length <= 2}
                  onClick={() => removeOption(index)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M6 12h12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={form.options.length >= 6}
              onClick={addOption}
              className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 py-2.5 text-sm font-bold text-primary transition-colors duration-200 hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              إضافة اختيار
            </button>
            {errors.options && <p className="text-xs font-semibold text-danger">{errors.options}</p>}
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">الإجابة الصحيحة</label>
            <div className="flex gap-3">
              {[
                { value: true, label: 'صح' },
                { value: false, label: 'خطأ' },
              ].map((choice) => (
                <label
                  key={String(choice.value)}
                  className={cn(
                    'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-colors',
                    form.correctAnswer === choice.value
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <input
                    type="radio"
                    name="correct-tf"
                    checked={form.correctAnswer === choice.value}
                    onChange={() => updateField('correctAnswer', choice.value)}
                    className="sr-only"
                  />
                  {choice.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1">
            {isEditMode ? 'حفظ التعديلات' : 'إضافة السؤال'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}