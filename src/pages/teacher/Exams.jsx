import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlinePlus,
  HiOutlineFunnel,
  HiOutlinePlay,
  HiOutlineArchiveBox,
  HiOutlineArchiveBoxXMark,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
} from 'react-icons/hi2'
import Button from '../../components/ui/Button.jsx'
import SearchBar from '../../components/ui/SearchBar.jsx'
import Select from '../../components/ui/Select.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ExamPreview from '../../components/exams/ExamPreview.jsx'
import ExamInfoForm from '../../components/teacher/ExamInfoForm.jsx'
import TeacherQuestionBuilder from '../../components/teacher/TeacherQuestionBuilder.jsx'
import QuestionForm from '../../components/exams/QuestionForm.jsx'
import { useExams } from '../../hooks/useExams.js'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { useToast } from '../../components/teacher/Toast.jsx'
import { getCurrentTeacher } from '../../services/auth.js'
import { generateQuestionId, toExamInfo, calcTotalScore } from '../../utils/examUtils.js'
import { formatDate } from '../../utils/formatters.js'
import { cn } from '../../utils/cn.js'

const PAGE_SIZE = 6
const STATUS_TONE = { Published: 'success', Draft: 'neutral' }

export default function Exams() {
  const currentTeacher = getCurrentTeacher()
  const {
    exams,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    addExam,
    updateExam,
    deleteExam,
    duplicateExam,
  } = useExams({ ownerId: currentTeacher?.id, ownerSubject: currentTeacher?.subject })
  const toast = useToast()

  const [builderExam, setBuilderExam] = useState(null)
  const [examFormInitial, setExamFormInitial] = useState(null)
  const [previewExam, setPreviewExam] = useState(null)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [examToDelete, setExamToDelete] = useState(null)
  const [builderError, setBuilderError] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)

  const formModal = useDisclosure(false)
  const questionModal = useDisclosure(false)
  const previewModal = useDisclosure(false)
  const deleteDialog = useDisclosure(false)

  const visibleExams = useMemo(() => exams.filter((e) => e.archived === showArchived), [exams, showArchived])
  const pageCount = Math.max(1, Math.ceil(visibleExams.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedExams = visibleExams.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  /* --------------------------- List actions --------------------------- */

  function handleCreate() {
    setBuilderError(null)
    setExamFormInitial(null)
    setBuilderExam({ info: null, questions: [], isNew: true, savedId: null })
    formModal.open()
  }

  function handleTableAction(action, exam) {
    if (action === 'view') {
      setPreviewExam(exam)
      previewModal.open()
    } else if (action === 'edit') {
      setBuilderError(null)
      setExamFormInitial(toExamInfo(exam))
      setBuilderExam({ info: null, questions: exam.questions, isNew: false, savedId: exam.id })
      formModal.open()
    } else if (action === 'delete') {
      setExamToDelete(exam)
      deleteDialog.open()
    } else if (action === 'copy') {
      duplicateExam(exam.id)
      toast('تم إنشاء نسخة من الامتحان كمسودة', 'success')
    } else if (action === 'publish') {
      updateExam(exam.id, { status: 'Published' })
      toast('تم نشر الامتحان بنجاح', 'success')
    } else if (action === 'unpublish') {
      updateExam(exam.id, { status: 'Draft' })
      toast('تم إلغاء نشر الامتحان', 'info')
    } else if (action === 'archive') {
      updateExam(exam.id, { archived: true })
      toast('تم أرشفة الامتحان', 'info')
    } else if (action === 'unarchive') {
      updateExam(exam.id, { archived: false })
      toast('تم إلغاء أرشفة الامتحان', 'success')
    } else if (action === 'take') {
      if (exam.status !== 'Published') {
        toast('لا يمكن بدء الامتحان قبل نشره', 'error')
        return
      }
      window.location.href = `/teacher/exams/take/${exam.id}`
    }
  }

  function handleFormSubmit(info) {
    setBuilderExam((prev) => ({ ...prev, info: { ...(prev.info ?? {}), ...info } }))
    formModal.close()
    setBuilderError(null)
  }

  function handleBackToList() {
    setBuilderExam(null)
    setBuilderError(null)
  }

  /* ------------------------- Question actions ------------------------- */

  function handleAddQuestion() {
    setEditingQuestion(null)
    questionModal.open()
  }

  function handleEditQuestion(question) {
    setEditingQuestion(question)
    questionModal.open()
  }

  function handleQuestionSubmit(values) {
    setBuilderExam((prev) => {
      if (editingQuestion) {
        return {
          ...prev,
          questions: prev.questions.map((q) => (q.id === editingQuestion.id ? { ...values, id: editingQuestion.id } : q)),
        }
      }
      return { ...prev, questions: [...prev.questions, { ...values, id: generateQuestionId() }] }
    })
    questionModal.close()
    setBuilderError(null)
  }

  function handleDeleteQuestion(question) {
    setBuilderExam((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== question.id) }))
  }

  function handleDuplicateQuestion(question) {
    setBuilderExam((prev) => ({ ...prev, questions: [...prev.questions, { ...question, id: generateQuestionId() }] }))
  }

  function handleMoveQuestion(fromIndex, toIndex) {
    setBuilderExam((prev) => {
      const next = [...prev.questions]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...prev, questions: next }
    })
  }

  /* ------------------------------ Save flow ---------------------------- */

  function handlePreview() {
    if (!builderExam?.info) return
    setPreviewExam({ ...builderExam.info, id: builderExam.savedId, questions: builderExam.questions })
    previewModal.open()
  }

  async function handleSave() {
    if (!builderExam?.info) return
    if (builderExam.questions.length === 0) {
      setBuilderError('لا يمكن حفظ الامتحان بدون أسئلة. أضف سؤالًا واحدًا على الأقل أولًا.')
      return
    }
    const payload = { ...builderExam.info, questions: builderExam.questions }
    /* eslint-disable-next-line no-console */
    console.log('[handleSave] Save button clicked — isNew =', builderExam.isNew, '| savedId =', builderExam.savedId)
    /* eslint-disable-next-line no-console */
    console.log('[handleSave] Form values / payload:', payload)
    try {
      if (builderExam.isNew) {
        await addExam(payload)
      } else {
        await updateExam(builderExam.savedId, payload)
      }
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error('[handleSave] save failed:', err)
      setBuilderError(err?.message || 'حدث خطأ غير متوقع أثناء حفظ الامتحان.')
      return
    }
    setBuilderExam(null)
    setBuilderError(null)
    toast('تم حفظ الامتحان بنجاح', 'success')
  }

  /* ------------------------------ Render ------------------------------- */

  const inBuilder = Boolean(builderExam?.info)

  if (inBuilder) {
    return (
      <>
        <TeacherQuestionBuilder
          exam={builderExam}
          saveError={builderError}
          onBack={handleBackToList}
          onAddQuestion={handleAddQuestion}
          onEditQuestion={handleEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onDuplicateQuestion={handleDuplicateQuestion}
          onMoveQuestion={handleMoveQuestion}
          onPreview={handlePreview}
          onSave={handleSave}
        />
        <QuestionForm isOpen={questionModal.isOpen} onClose={questionModal.close} onSubmit={handleQuestionSubmit} initialData={editingQuestion} />
        <ExamPreview isOpen={previewModal.isOpen} onClose={previewModal.close} exam={previewExam} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">إدارة الامتحانات</h2>
          <p className="mt-1 text-sm text-slate-500">{totalCount} امتحان في رصيدك</p>
        </div>
        <Button icon={<HiOutlinePlus />} onClick={handleCreate}>
          إنشاء امتحان جديد
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="ابحث باسم الامتحان أو المادة أو الصف..." />
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            variant={showArchived ? 'primary' : 'outline'}
            size="sm"
            icon={showArchived ? <HiOutlineArchiveBoxXMark /> : <HiOutlineArchiveBox />}
            onClick={() => {
              setShowArchived((prev) => !prev)
              setPage(1)
            }}
          >
            {showArchived ? 'عرض النشطة' : 'الأرشيف'}
          </Button>
        </div>
      </div>

      <div className="rounded-card bg-card p-2 shadow-soft ring-1 ring-slate-100 sm:p-4">
        {pagedExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
              <HiOutlineArchiveBox />
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {showArchived ? 'لا توجد امتحانات في الأرشيف' : 'لا توجد امتحانات مطابقة لبحثك'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile exam cards */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {pagedExams.map((exam) => (
                <div key={exam.id} className="flex min-w-0 flex-col gap-3 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                        {exam.subject.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{exam.name}</p>
                        <p className="truncate text-xs text-slate-400">{exam.subject} · {exam.grade} · {exam.questions.length} سؤال</p>
                      </div>
                    </div>
                    <Badge tone={STATUS_TONE[exam.status] ?? 'neutral'}>
                      {exam.status === 'Published' ? 'منشور' : 'مسودة'}
                    </Badge>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-2 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100 min-[350px]:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">الدرجة الكلية</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-primary">{calcTotalScore(exam.questions)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">درجة النجاح</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{exam.passScore || '—'}</p>
                    </div>
                    <div className="min-w-0 min-[350px]:col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">الموعد</p>
                      {exam.scheduledDate
                        ? (
                          <>
                            <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{formatDate(exam.scheduledDate)}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400" dir="ltr">
                              {exam.startTime || '—'} → {exam.endTime || '—'}
                            </p>
                          </>
                        )
                        : <p className="mt-0.5 text-sm font-bold text-slate-800">غير مجدول</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CardBtn title="معاينة" className="hover:bg-blue-50 hover:text-primary" onClick={() => handleTableAction('view', exam)}>
                      <HiOutlineEyeIcon />
                    </CardBtn>
                    <CardBtn title="تعديل" className="hover:bg-amber-50 hover:text-amber-600" onClick={() => handleTableAction('edit', exam)}>
                      <HiOutlinePencilIcon />
                    </CardBtn>
                    {exam.status === 'Published'
                      ? (
                        <CardBtn title="إلغاء النشر" className="hover:bg-amber-50 hover:text-amber-600" onClick={() => handleTableAction('unpublish', exam)}>
                          <HiOutlineStopIcon />
                        </CardBtn>
                      )
                      : (
                        <CardBtn title="نشر" className="hover:bg-green-50 hover:text-emerald-600" onClick={() => handleTableAction('publish', exam)}>
                          <HiOutlineRocketIcon />
                        </CardBtn>
                      )}
                    <CardBtn title="نسخ" className="hover:bg-indigo-50 hover:text-indigo-600" onClick={() => handleTableAction('copy', exam)}>
                      <HiOutlineCopyIcon />
                    </CardBtn>
                    <CardBtn title={showArchived ? 'إلغاء الأرشفة' : 'أرشفة'} className="hover:bg-slate-100 hover:text-slate-700" onClick={() => handleTableAction(showArchived ? 'unarchive' : 'archive', exam)}>
                      <HiOutlineArchiveBox />
                    </CardBtn>
                    <CardBtn title="بدء (محاكاة الطالب)" className="hover:bg-blue-50 hover:text-primary" onClick={() => handleTableAction('take', exam)}>
                      <HiOutlinePlay />
                    </CardBtn>
                    <CardBtn title="حذف" className="hover:bg-red-50 hover:text-danger" onClick={() => handleTableAction('delete', exam)}>
                      <HiOutlineTrashIcon />
                    </CardBtn>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden scrollbar-thin overflow-x-auto sm:block">
              <table className="w-full min-w-[1000px] border-collapse text-right">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الامتحان</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الدرجة الكلية</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الموعد</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">درجة النجاح</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الحالة</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pagedExams.map((exam, index) => (
                  <motion.tr
                    key={exam.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                          {exam.subject.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800">{exam.name}</p>
                          <p className="text-xs text-slate-400">{exam.subject} · {exam.grade} · {exam.questions.length} سؤال</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-primary">{calcTotalScore(exam.questions)}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-600">
                      {exam.scheduledDate
                        ? (
                          <div>
                            <p>{formatDate(exam.scheduledDate)}</p>
                            <p className="text-xs text-slate-400" dir="ltr">
                              {exam.startTime || '—'} → {exam.endTime || '—'}
                            </p>
                          </div>
                        )
                        : 'غير مجدول'}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{exam.passScore || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={STATUS_TONE[exam.status] ?? 'neutral'}>
                        {exam.status === 'Published' ? 'منشور' : 'مسودة'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <ActionBtn title="معاينة" onClick={() => handleTableAction('view', exam)} className="hover:bg-blue-50 hover:text-primary">
                          <HiOutlineEyeIcon />
                        </ActionBtn>
                        <ActionBtn title="تعديل" onClick={() => handleTableAction('edit', exam)} className="hover:bg-amber-50 hover:text-amber-600">
                          <HiOutlinePencilIcon />
                        </ActionBtn>
                        {exam.status === 'Published'
                          ? (
                            <ActionBtn title="إلغاء النشر" onClick={() => handleTableAction('unpublish', exam)} className="hover:bg-amber-50 hover:text-amber-600">
                              <HiOutlineStopIcon />
                            </ActionBtn>
                          )
                          : (
                            <ActionBtn title="نشر" onClick={() => handleTableAction('publish', exam)} className="hover:bg-green-50 hover:text-emerald-600">
                              <HiOutlineRocketIcon />
                            </ActionBtn>
                          )}
                        <ActionBtn title="نسخ" onClick={() => handleTableAction('copy', exam)} className="hover:bg-indigo-50 hover:text-indigo-600">
                          <HiOutlineCopyIcon />
                        </ActionBtn>
                        <ActionBtn title={showArchived ? 'إلغاء الأرشفة' : 'أرشفة'} onClick={() => handleTableAction(showArchived ? 'unarchive' : 'archive', exam)} className="hover:bg-slate-100 hover:text-slate-700">
                          <HiOutlineArchiveBox />
                        </ActionBtn>
                        <ActionBtn title="بدء (محاكاة الطالب)" onClick={() => handleTableAction('take', exam)} className="hover:bg-blue-50 hover:text-primary">
                          <HiOutlinePlay />
                        </ActionBtn>
                        <ActionBtn title="حذف" onClick={() => handleTableAction('delete', exam)} className="hover:bg-red-50 hover:text-danger">
                          <HiOutlineTrashIcon />
                        </ActionBtn>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400">
              صفحة {safePage} من {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <HiOutlineChevronRight />
              </button>
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <HiOutlineChevronLeft />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExamInfoForm isOpen={formModal.isOpen} onClose={formModal.close} onSubmit={handleFormSubmit} initialData={examFormInitial} />
      <QuestionForm isOpen={questionModal.isOpen} onClose={questionModal.close} onSubmit={handleQuestionSubmit} initialData={editingQuestion} />
      <ExamPreview isOpen={previewModal.isOpen} onClose={previewModal.close} exam={previewExam} />
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={() => {
          if (examToDelete) {
            deleteExam(examToDelete.id)
            toast('تم حذف الامتحان', 'info')
          }
        }}
        title="حذف الامتحان"
        description={examToDelete ? `هل أنت متأكد من حذف امتحان "${examToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.` : ''}
      />
    </div>
  )
}

function ActionBtn({ title, onClick, className, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150', className)}
    >
      <span className="text-base leading-none">{children}</span>
    </button>
  )
}

function CardBtn({ title, onClick, className, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors duration-150', className)}
    >
      <span className="text-base leading-none">{children}</span>
    </button>
  )
}

// Small glyph components so the table stays icon-dense without importing 8 icons
function HiOutlineEyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function HiOutlinePencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
function HiOutlineStopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}
function HiOutlineRocketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M5 14c-1 1-1.5 4-1.5 6.5S8 20 10 19" />
      <path d="M9 15c0-4 3-9 9-10-1 6-6 9-10 9z" />
      <circle cx="14.5" cy="9.5" r="1.3" />
    </svg>
  )
}
function HiOutlineCopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}
function HiOutlineTrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}