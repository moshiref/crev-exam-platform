import { useEffect, useState } from 'react'
import { HiOutlinePlus, HiOutlineFunnel, HiOutlineAcademicCap } from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import StudentTable from '../../components/students/StudentTable.jsx'
import StudentFormModal from '../../components/students/StudentFormModal.jsx'
import StudentCreatedModal from '../../components/students/StudentCreatedModal.jsx'
import StudentCard from '../../components/students/StudentCard.jsx'
import { useStudents } from '../../hooks/useStudents.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'

/**
 * Students page — the core of the MVP admin dashboard.
 * Composes: search + status filter, the roster table, the add/edit
 * form modal, the post-creation success summary, and a delete
 * confirmation, all backed by `useStudents` (mock, in-memory for now).
 */
export default function Students() {
  const {
    students,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useStudents()

  const formModal = useDisclosure(false)
  const successModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)

  const [editingStudent, setEditingStudent] = useState(null)
  const [createdStudent, setCreatedStudent] = useState(null)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [printTarget, setPrintTarget] = useState(null)

  // Trigger the browser print dialog once the off-screen card for a
  // row-level "Print Card" action has mounted.
  useEffect(() => {
    if (!printTarget) return
    const timer = setTimeout(() => window.print(), 150)
    return () => clearTimeout(timer)
  }, [printTarget])

  function handleAddClick() {
    setEditingStudent(null)
    formModal.open()
  }

  function handleTableAction(action, student) {
    if (action === 'edit') {
      setEditingStudent(student)
      formModal.open()
    } else if (action === 'delete') {
      setStudentToDelete(student)
      deleteDialog.open()
    } else if (action === 'print') {
      setPrintTarget(student)
    } else if (action === 'view') {
      setEditingStudent(student)
      formModal.open()
    }
  }

  async function handleFormSubmit(values) {
    if (editingStudent) {
      await updateStudent(editingStudent.id, values)
      formModal.close()
    } else {
      const newStudent = await addStudent(values)
      formModal.close()
      setCreatedStudent(newStudent)
      successModal.open()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">الطلاب</h2>
          <p className="mt-1 text-sm text-slate-500">{totalCount} طالب مسجل في المنصة</p>
        </div>
        <Button icon={<HiOutlinePlus />} onClick={handleAddClick}>
          إضافة طالب
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="ابحث بالاسم أو كود الطالب أو رقم الهاتف..."
        />
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="h-4 w-4 shrink-0 text-slate-400" />
          <Select
            options={[
              { value: 'All', label: 'كل الحالات' },
              { value: 'Active', label: 'نشط' },
              { value: 'Inactive', label: 'غير نشط' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:w-40 sm:flex-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        {totalCount === 0 ? (
          <EmptyState
            icon={<HiOutlineAcademicCap />}
            title="لا يوجد طلاب حتى الآن"
            description="أضف أول طالب وسيتم توليد كود الطالب وكلمة المرور ورقم PIN تلقائيًا."
            action={<Button icon={<HiOutlinePlus />} onClick={handleAddClick}>إضافة طالب</Button>}
          />
        ) : (
          <StudentTable students={students} onAction={handleTableAction} />
        )}
      </div>

      {/* Add / Edit modal */}
      <StudentFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleFormSubmit}
        initialData={editingStudent}
      />

      {/* Post-creation success summary */}
      <StudentCreatedModal
        isOpen={successModal.isOpen}
        onClose={() => {
          successModal.close()
          setCreatedStudent(null)
        }}
        student={createdStudent}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => studentToDelete && deleteStudent(studentToDelete.id)}
        title="حذف الطالب"
        description={
          studentToDelete
            ? `هل أنت متأكد من حذف الطالب "${studentToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : ''
        }
      />

      {/* Off-screen card mounted only to power the row-level "Print Card" action */}
      {printTarget && (
        <div className="fixed -left-[9999px] top-0">
          <StudentCard student={printTarget} />
        </div>
      )}
    </div>
  )
}
