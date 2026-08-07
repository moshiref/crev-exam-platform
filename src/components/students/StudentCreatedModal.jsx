import { useState } from 'react'
import { HiOutlineCheckCircle, HiOutlineClipboardDocument, HiOutlineClipboardDocumentCheck, HiOutlinePrinter } from 'react-icons/hi2'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import StudentCard from './StudentCard.jsx'

/**
 * Success summary shown right after a new student is created.
 * Surfaces the auto-generated Student ID / password / parent PIN with
 * a one-click copy, plus a printable card preview.
 */
export default function StudentCreatedModal({ isOpen, onClose, student }) {
  const [copied, setCopied] = useState(false)

  if (!student) return null

  function handleCopy() {
    const summary = `كود الطالب: ${student.id}\nكلمة المرور: ${student.password}\nكود ولي الأمر: ${student.parentPin}`
    navigator.clipboard?.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تم إنشاء الطالب بنجاح" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl text-accent">
          <HiOutlineCheckCircle />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          تم إنشاء حساب الطالب <span className="font-bold text-slate-800">{student.name}</span> بنجاح، وتوليد بيانات الدخول تلقائيًا.
        </p>

        <div className="mt-6 w-full">
          <StudentCard student={student} />
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            icon={copied ? <HiOutlineClipboardDocumentCheck /> : <HiOutlineClipboardDocument />}
            onClick={handleCopy}
          >
            {copied ? 'تم النسخ' : 'نسخ البيانات'}
          </Button>
          <Button variant="success" size="md" className="flex-1" icon={<HiOutlinePrinter />} onClick={handlePrint}>
            طباعة البطاقة
          </Button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600"
        >
          إغلاق
        </button>
      </div>
    </Modal>
  )
}
