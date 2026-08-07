import { useState } from 'react'
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineSquares2X2,
  HiOutlineAcademicCap,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import { useClasses } from '../../hooks/useClasses.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { cn } from '../../utils/cn.js'

const STAGES = ['ابتدائي', 'إعدادي', 'ثانوي']
const STAGE_FILTERS = ['All', ...STAGES]

const STAGE_TONE = {
  ابتدائي: 'success',
  إعدادي: 'warning',
  ثانوي: 'secondary',
}

/** Classes (الصفوف) management — admin rosters across all educational stages. */
export default function Classes() {
  const {
    classes,
    totalCount,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
    addClass,
    updateClass,
    deleteClass,
  } = useClasses()

  const EMPTY_FORM = { name: '', stage: STAGES[0] }
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [classToDelete, setClassToDelete] = useState(null)

  const formModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)

  function openAddModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    formModal.open()
  }

  function openEditModal(cls) {
    setEditingId(cls.id)
    setForm({ name: cls.name, stage: cls.stage })
    formModal.open()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return

    if (editingId) {
      await updateClass(editingId, form)
    } else {
      await addClass(form)
    }
    formModal.close()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">إدارة الصفوف</h2>
          <p className="mt-1 text-sm text-slate-500">{totalCount} صف دراسي عبر جميع المراحل</p>
        </div>
        <Button icon={<HiOutlinePlus />} onClick={openAddModal}>
          إضافة صف
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث عن صف أو مرحلة..." />
        <div className="flex flex-wrap items-center gap-2">
          {STAGE_FILTERS.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                stageFilter === stage
                  ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-soft'
                  : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
              )}
            >
              {stage === 'All' ? 'الكل' : stage}
            </button>
          ))}
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={<HiOutlineSquares2X2 />}
          title={totalCount === 0 ? 'لا توجد صفوف بعد' : 'لا توجد نتائج مطابقة'}
          description={
            totalCount === 0
              ? 'أضف أول صف دراسي وسيتم ربط الطلاب والامتحانات به لاحقًا.'
              : 'جرّب تعديل كلمة البحث أو الفلتر.'
          }
          action={totalCount === 0 ? <Button icon={<HiOutlinePlus />} onClick={openAddModal}>إضافة صف</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col gap-4 rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-primary">
                  <HiOutlineSquares2X2 />
                </div>
                <Badge tone={STAGE_TONE[cls.stage] ?? 'neutral'}>{cls.stage}</Badge>
              </div>

              <div>
                <p className="font-display text-base font-bold text-slate-900">{cls.name}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-400" dir="ltr">{cls.id}</p>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-50 pt-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <HiOutlineAcademicCap className="h-4 w-4 text-primary" />
                  {cls.studentsCount} طالب
                </span>
                <span className="flex items-center gap-1.5">
                  <HiOutlineClipboardDocumentList className="h-4 w-4 text-secondary" />
                  {cls.examsCount} امتحان
                </span>
              </div>

              <div className="flex items-center gap-1 border-t border-slate-50 pt-2">
                <button
                  type="button"
                  title="تعديل"
                  onClick={() => openEditModal(cls)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                >
                  <HiOutlinePencilSquare className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="حذف"
                  onClick={() => {
                    setClassToDelete(cls)
                    deleteDialog.open()
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-danger"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={formModal.isOpen} onClose={formModal.close} title={editingId ? 'تعديل الصف' : 'إضافة صف جديد'} maxWidth="max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="className"
            label="اسم الصف"
            placeholder="مثال: الأول الابتدائي"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            id="classStage"
            label="المرحلة الدراسية"
            options={STAGES}
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value })}
          />
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={formModal.close}>
              إلغاء
            </Button>
            <Button type="submit" size="md" className="flex-1">
              {editingId ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => classToDelete && deleteClass(classToDelete.id)}
        title="حذف الصف"
        description={classToDelete ? `هل أنت متأكد من حذف "${classToDelete.name}"؟` : ''}
      />
    </div>
  )
}