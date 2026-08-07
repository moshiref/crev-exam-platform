import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

/**
 * Generic "are you sure?" confirmation dialog — used for destructive
 * actions like deleting a student/teacher/subject.
 */
export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, description }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-danger">
          <HiOutlineExclamationTriangle />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">{description}</p>

        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            حذف
          </Button>
        </div>
      </div>
    </Modal>
  )
}
