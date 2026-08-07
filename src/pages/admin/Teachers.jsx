import { useState } from 'react'
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineInboxStack,
  HiOutlineKey,
  HiOutlinePower,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineClipboard,
  HiOutlineCheckCircle,
} from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import { useTeachers } from '../../hooks/useTeachers.js'
import { useSubjects } from '../../hooks/useSubjects.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { STAGES, gradesOfStages } from '../../utils/educationLevels.js'

/** Teachers management — add/edit/delete + credentials & account status. */
export default function Teachers() {
  const { teachers, totalCount, addTeacher, updateTeacher, deleteTeacher, searchTerm, setSearchTerm } = useTeachers()
  const { subjects } = useSubjects()
  const subjectNames = subjects.map((s) => s.name)
  const EMPTY_FORM = { name: '', subjects: [], stages: [], grades: [], phone: '', username: '', password: '', status: 'Active' }
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [teacherToDelete, setTeacherToDelete] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [createdTeacher, setCreatedTeacher] = useState(null)
  const [copied, setCopied] = useState(false)

  const formModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)
  const createdModal = useDisclosure(false)

  function toggleIn(list, value) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  function openAddModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowPassword(false)
    formModal.open()
  }

  function openEditModal(teacher) {
    setEditingId(teacher.id)
    setForm({
      ...teacher,
      subjects: Array.isArray(teacher.subjects) ? teacher.subjects : teacher.subject ? [teacher.subject] : [],
      stages: Array.isArray(teacher.stages) ? teacher.stages : [],
      grades: Array.isArray(teacher.grades) ? teacher.grades : [],
    })
    setShowPassword(false)
    formModal.open()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return

    if (editingId) {
      await updateTeacher(editingId, form)
    } else {
      const created = await addTeacher(form)
      setCreatedTeacher(created)
      setCopied(false)
      createdModal.open()
    }
    formModal.close()
  }

  async function copyTeacherData() {
    if (!createdTeacher) return
    const text = `اسم المدرس: ${createdTeacher.name}\nاسم المستخدم: ${createdTeacher.username}\nكلمة المرور: ${createdTeacher.password}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }

  function toggleStatus(teacher) {
    const next = teacher.status === 'Active' ? 'Inactive' : 'Active'
    updateTeacher(teacher.id, { ...teacher, status: next })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">المدرسون</h2>
          <p className="mt-1 text-sm text-slate-500">{teachers.length} مدرس مسجل في المنصة</p>
        </div>
        <Button icon={<HiOutlinePlus />} onClick={openAddModal}>
          إضافة مدرس
        </Button>
      </div>

      <div className="rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالاسم أو المادة..." />
      </div>

      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        {teachers.length === 0 ? (
          <EmptyState
            icon={<HiOutlineInboxStack />}
            title={totalCount === 0 ? 'لا يوجد مدرسون بعد' : 'لا توجد نتائج مطابقة'}
            description={
              totalCount === 0
                ? 'أضف أول مدرس مع بيانات تسجيل دخوله، وسيظهر هنا مباشرة.'
                : 'جرّب تعديل كلمة البحث للحصول على نتائج.'
            }
            action={
              totalCount === 0 ? (
                <Button icon={<HiOutlinePlus />} onClick={openAddModal}>إضافة مدرس</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-right">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">اسم المدرس</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">المادة</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">اسم المستخدم</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">رقم الهاتف</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الحالة</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-800">{teacher.name}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{Array.isArray(teacher.subjects) && teacher.subjects.length ? teacher.subjects.join('، ') : teacher.subject || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600 ring-1 ring-slate-100" dir="ltr">
                        <HiOutlineKey className="h-3.5 w-3.5 text-slate-400" />
                        {teacher.username || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-600" dir="ltr">{teacher.phone}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={teacher.status === 'Active' ? 'success' : 'neutral'}>
                        {teacher.status === 'Active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={teacher.status === 'Active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          onClick={() => toggleStatus(teacher)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            teacher.status === 'Active'
                              ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                              : 'text-emerald-500 hover:bg-green-50'
                          }`}
                        >
                          <HiOutlinePower className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="تعديل"
                          onClick={() => openEditModal(teacher)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="حذف"
                          onClick={() => {
                            setTeacherToDelete(teacher)
                            deleteDialog.open()
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-danger"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={formModal.isOpen} onClose={formModal.close} title={editingId ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="teacherName"
            label="اسم المدرس"
            placeholder="مثال: أ. أحمد فوزي"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-100">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">صلاحيات التدريس</p>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">المواد</label>
              <div className="flex flex-wrap gap-2">
                {subjectNames.map((subject) => {
                  const selected = form.subjects.includes(subject)
                  return (
                    <button
                      key={subject}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setForm({ ...form, subjects: toggleIn(form.subjects, subject) })}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        selected
                          ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-sm'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary'
                      }`}
                    >
                      {selected ? '☑ ' : '☐ '}
                      {subject}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">المراحل التعليمية</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((stage) => {
                  const selected = form.stages.includes(stage)
                  return (
                    <button
                      key={stage}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setForm({ ...form, stages: toggleIn(form.stages, stage) })}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        selected
                          ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-sm'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary'
                      }`}
                    >
                      {selected ? '☑ ' : '☐ '}
                      {stage}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">الصفوف الدراسية</label>
              {form.stages.length === 0 ? (
                <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-400 ring-1 ring-slate-200">
                  اختر المراحل التعليمية أولاً لعرض الصفوف المتاحة.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gradesOfStages(form.stages).map((grade) => {
                    const selected = form.grades.includes(grade)
                    return (
                      <button
                        key={grade}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setForm({ ...form, grades: toggleIn(form.grades, grade) })}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                          selected
                            ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-sm'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary'
                        }`}
                      >
                        {selected ? '☑ ' : '☐ '}
                        {grade}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <Input
            id="teacherPhone"
            label="رقم الهاتف"
            dir="ltr"
            placeholder="01xxxxxxxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="teacherUsername"
              label="اسم المستخدم"
              dir="ltr"
              placeholder="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <div className="relative">
              <Input
                id="teacherPassword"
                label="كلمة المرور"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label="إظهار كلمة المرور"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-[38px] text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="rounded-xl bg-blue-50/70 px-3 py-2 text-xs font-semibold text-primary ring-1 ring-blue-100">
            {editingId ? 'تُستخدم هذه البيانات في تسجيل دخول المدرس' : 'سيتم توليد اسم مستخدم تلقائياً إذا تُرك فارغاً'}
          </p>
          <Select
            id="teacherStatus"
            label="الحالة"
            options={[{ value: 'Active', label: 'نشط' }, { value: 'Inactive', label: 'غير نشط' }]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={formModal.close}>
              إلغاء
            </Button>
            <Button type="submit" size="md" className="flex-1">
              {editingId ? 'حفظ التعديلات' : 'حفظ'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={createdModal.isOpen}
        onClose={createdModal.close}
        title="تم إنشاء حساب المدرس"
        maxWidth="max-w-sm"
      >
        {createdTeacher && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="font-semibold text-slate-500">اسم المدرس</dt>
                  <dd className="font-bold text-slate-900">{createdTeacher.name}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-semibold text-slate-500">اسم المستخدم</dt>
                  <dd className="font-mono font-bold text-slate-900" dir="ltr">{createdTeacher.username}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-semibold text-slate-500">كلمة المرور</dt>
                  <dd className="font-mono font-bold text-slate-900" dir="ltr">{createdTeacher.password}</dd>
                </div>
              </dl>
            </div>
            <Button type="button" variant="outline" icon={copied ? <HiOutlineCheckCircle className="h-4 w-4" /> : <HiOutlineClipboard className="h-4 w-4" />} onClick={copyTeacherData} className="w-full">
              {copied ? 'تم النسخ ✓' : 'نسخ البيانات'}
            </Button>
            <Button size="md" onClick={createdModal.close} className="w-full">إغلاق</Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => teacherToDelete && deleteTeacher(teacherToDelete.id)}
        title="حذف المدرس"
        description={teacherToDelete ? `هل أنت متأكد من حذف "${teacherToDelete.name}"؟` : ''}
      />
    </div>
  )
}