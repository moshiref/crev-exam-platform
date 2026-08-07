import { useState } from 'react'
import { HiOutlineFunnel, HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import SearchBar from '../../components/ui/SearchBar.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import ExamTable from '../../components/exams/ExamTable.jsx'
import ExamPreview from '../../components/exams/ExamPreview.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useExams } from '../../hooks/useExams.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'

/**
 * Exams page — the admin is a SUPERVISOR, not an author.
 *
 * The admin can view, delete, and review every exam (published or not), but
 * they CANNOT create, edit, duplicate or import exams — only teachers author
 * exams. All create/edit/copy entry points are removed; the table runs in
 * `readOnly` mode, and any edit/copy request is rejected defensively.
 */
export default function Exams() {
  const {
    exams,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    deleteExam,
  } = useExams()

  const [previewExam, setPreviewExam] = useState(null)
  const [examToDelete, setExamToDelete] = useState(null)

  const previewModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)

  /* ----------------------------- List actions ----------------------------- */

  function handleTableAction(action, exam) {
    // Admin cannot create/edit/copy exams — block any attempt defensively.
    if (action === 'edit' || action === 'copy' || action === 'create') return
    if (action === 'view') {
      setPreviewExam(exam)
      previewModal.open()
    } else if (action === 'delete') {
      setExamToDelete(exam)
      deleteDialog.open()
    }
  }

  /* -------------------------------- Render --------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">إدارة الامتحانات</h2>
          <p className="mt-1 text-sm text-slate-500">مراجعة وإدارة امتحانات المدرسين.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="ابحث باسم الامتحان أو المادة أو الصف..."
        />
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="h-4 w-4 shrink-0 text-slate-400" />
          <Select
            options={[
              { value: 'All', label: 'كل الحالات' },
              { value: 'Draft', label: 'مسودة' },
              { value: 'Published', label: 'منشور' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        <ExamTable exams={exams} onAction={handleTableAction} readOnly />
      </div>

      {totalCount === 0 && (
        <EmptyState
          icon={<HiOutlineClipboardDocumentList />}
          title="لا توجد امتحانات بعد"
          description="لا يوجد أي امتحان حالياً. يقوم المدرسون بإنشاء الامتحانات."
        />
      )}

      {/* Preview modal (student view) */}
      <ExamPreview isOpen={previewModal.isOpen} onClose={previewModal.close} exam={previewExam} />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => examToDelete && deleteExam(examToDelete.id)}
        title="حذف الامتحان"
        description={
          examToDelete
            ? `هل أنت متأكد من حذف امتحان "${examToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : ''
        }
      />
    </div>
  )
}