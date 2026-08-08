import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineFunnel, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePrinter } from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Badge from '../../components/ui/Badge.jsx'
import TeacherStudentFormModal from '../../components/teacher/TeacherStudentFormModal.jsx'
import StudentCard from '../../components/students/StudentCard.jsx'
import { useStudents } from '../../hooks/useStudents.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { useToast } from '../../components/teacher/Toast.jsx'

/** Teacher-scoped student management — Student ID + password login only, no email. */
export default function Students() {
  const {
    students,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    updateStudent,
    deleteStudent,
  } = useStudents()
  const toast = useToast()

  const formModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)

  const [editingStudent, setEditingStudent] = useState(null)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [printTarget, setPrintTarget] = useState(null)

  useEffect(() => {
    if (!printTarget) return
    const timer = setTimeout(() => window.print(), 150)
    return () => clearTimeout(timer)
  }, [printTarget])

  function handleAction(action, student) {
    if (action === 'edit') {
      setEditingStudent(student)
      formModal.open()
    } else if (action === 'delete') {
      setStudentToDelete(student)
      deleteDialog.open()
    } else if (action === 'print') {
      setPrintTarget(student)
    }
  }

  async function handleSubmit(values) {
    // المدرس لا يملك صلاحية إضافة طالب — التعديل فقط على الطلاب الموجودين.
    if (!editingStudent) return
    await updateStudent(editingStudent.id, values)
    formModal.close()
    toast('تم تحديث بيانات الطالب', 'success')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">الطلاب</h2>
          <p className="mt-1 text-sm text-slate-500">{totalCount} طالب · الدخول بكود الطالب وكلمة المرور فقط</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالاسم أو كود الطالب أو رقم الهاتف..." />
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

      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-semibold text-slate-500">لا يوجد طلاب مطابقون لبحثك</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {students.map((student) => (
                <div key={student.id} className="flex min-w-0 flex-col gap-3 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                        {student.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{student.name}</p>
                        {student.notes && <p className="truncate text-xs text-slate-400">{student.notes}</p>}
                      </div>
                    </div>
                    <Badge tone={student.status === 'Active' ? 'success' : 'neutral'}>
                      {student.status === 'Active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-2 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100 min-[350px]:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">كود الطالب</p>
                      <p className="mt-0.5 truncate font-mono text-sm font-bold text-slate-800" dir="ltr">{student.id}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">الصف الدراسي</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{student.grade}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">هاتف ولي الأمر</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-800" dir="ltr">{student.parentPhone}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">كلمة المرور</p>
                      <p className="mt-0.5 truncate font-mono text-sm font-bold text-slate-800" dir="ltr">{student.password}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RowBtn title="تعديل" className="h-11 w-11 shrink-0 rounded-xl hover:bg-amber-50 hover:text-amber-600" onClick={() => handleAction('edit', student)}>
                      <HiOutlinePencilSquare className="h-5 w-5" />
                    </RowBtn>
                    <RowBtn title="طباعة البطاقة" className="h-11 w-11 shrink-0 rounded-xl hover:bg-indigo-50 hover:text-indigo-600" onClick={() => handleAction('print', student)}>
                      <HiOutlinePrinter className="h-5 w-5" />
                    </RowBtn>
                    <RowBtn title="حذف" className="h-11 w-11 shrink-0 rounded-xl hover:bg-red-50 hover:text-danger" onClick={() => handleAction('delete', student)}>
                      <HiOutlineTrash className="h-5 w-5" />
                    </RowBtn>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden scrollbar-thin overflow-x-auto sm:block">
              <table className="w-full min-w-[900px] border-collapse text-right">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الطالب</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">كود الطالب</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الصف</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">هاتف ولي الأمر</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">كلمة المرور</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الحالة</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                            {student.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{student.name}</p>
                            {student.notes && <p className="max-w-[220px] truncate text-xs text-slate-400">{student.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-sm font-bold text-slate-700" dir="ltr">
                        {student.id}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{student.grade}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-600" dir="ltr">
                        {student.parentPhone}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-sm font-medium text-slate-500" dir="ltr">
                        {student.password}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={student.status === 'Active' ? 'success' : 'neutral'}>
                          {student.status === 'Active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <RowBtn title="تعديل" className="h-8 w-8 rounded-lg hover:bg-amber-50 hover:text-amber-600" onClick={() => handleAction('edit', student)}>
                            <HiOutlinePencilSquare className="h-4 w-4" />
                          </RowBtn>
                          <RowBtn title="طباعة البطاقة" className="h-8 w-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => handleAction('print', student)}>
                            <HiOutlinePrinter className="h-4 w-4" />
                          </RowBtn>
                          <RowBtn title="حذف" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-danger" onClick={() => handleAction('delete', student)}>
                            <HiOutlineTrash className="h-4 w-4" />
                          </RowBtn>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* نموذج التعديل فقط — لا يُفتح إلا عند وجود طالب للتعديل (لا إضافة للمدرس) */}
      {editingStudent && (
        <TeacherStudentFormModal
          isOpen={formModal.isOpen}
          onClose={formModal.close}
          onSubmit={handleSubmit}
          initialData={editingStudent}
        />
      )}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id)
            toast('تم حذف الطالب', 'info')
          }
        }}
        title="حذف الطالب"
        description={studentToDelete ? `هل أنت متأكد من حذف الطالب "${studentToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.` : ''}
      />
      {printTarget && (
        <div className="fixed -left-[9999px] top-0">
          <StudentCard student={printTarget} />
        </div>
      )}
    </div>
  )
}

function RowBtn({ title, className, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center text-slate-400 transition-colors duration-150 ${className}`}
    >
      {children}
    </button>
  )
}