import { useState } from 'react'
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineBookOpen } from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useSubjects } from '../../hooks/useSubjects.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'

/** Subjects management — add/edit/delete as a card grid. */
export default function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [subjectToDelete, setSubjectToDelete] = useState(null)

  const formModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)

  function openAddModal() {
    setEditingId(null)
    setName('')
    formModal.open()
  }

  function openEditModal(subject) {
    setEditingId(subject.id)
    setName(subject.name)
    formModal.open()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim()) return

    if (editingId) {
      await updateSubject(editingId, name.trim())
    } else {
      await addSubject(name.trim())
    }
    formModal.close()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">المواد الدراسية</h2>
          <p className="mt-1 text-sm text-slate-500">{subjects.length} مادة دراسية مسجلة</p>
        </div>
        <Button icon={<HiOutlinePlus />} onClick={openAddModal}>
          إضافة مادة
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<HiOutlineBookOpen />}
          title="لا توجد مواد دراسية بعد"
          description="أضف أول مادة — الرياضيات، اللغة العربية... — وسيتمكن المدرسون من الربط بها."
          action={<Button icon={<HiOutlinePlus />} onClick={openAddModal}>إضافة مادة</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex items-start justify-between rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 transition-shadow hover:shadow-soft-lg"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-primary">
                <HiOutlineBookOpen />
              </div>
              <div>
                <p className="font-display text-base font-bold text-slate-900">{subject.name}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {subject.teachersCount ?? 0} مدرسين · {subject.examsCount ?? 0} امتحانات
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="تعديل"
                onClick={() => openEditModal(subject)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
              >
                <HiOutlinePencilSquare className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="حذف"
                onClick={() => {
                  setSubjectToDelete(subject)
                  deleteDialog.open()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-danger"
              >
                <HiOutlineTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      <Modal isOpen={formModal.isOpen} onClose={formModal.close} title={editingId ? 'تعديل المادة الدراسية' : 'إضافة مادة دراسية'} maxWidth="max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="subjectName"
            label="اسم المادة"
            placeholder="مثال: الرياضيات"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={formModal.close}>
              إلغاء
            </Button>
            <Button type="submit" size="md" className="flex-1">
              {editingId ? 'حفظ' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => subjectToDelete && deleteSubject(subjectToDelete.id)}
        title="حذف المادة"
        description={subjectToDelete ? `هل أنت متأكد من حذف مادة "${subjectToDelete.name}"؟` : ''}
      />
    </div>
  )
}