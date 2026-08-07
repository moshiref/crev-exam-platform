import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineUserPlus,
  HiOutlineUserMinus,
  HiOutlineBellAlert,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlay,
  HiOutlineAcademicCap,
} from 'react-icons/hi2'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { timeAgo } from '../../utils/statsUtils.js'
import { formatDateTime } from '../../utils/formatters.js'

const TYPE_META = {
  exam_created: { icon: <HiOutlineClipboardDocumentList />, tone: 'text-primary bg-blue-50' },
  exam_updated: { icon: <HiOutlinePencilSquare />, tone: 'text-primary bg-blue-50' },
  exam_deleted: { icon: <HiOutlineTrash />, tone: 'text-danger bg-red-50' },
  exam_started: { icon: <HiOutlinePlay />, tone: 'text-amber-600 bg-amber-50' },
  exam_submitted: { icon: <HiOutlineCheckCircle />, tone: 'text-emerald-600 bg-green-50' },
  teacher_added: { icon: <HiOutlineUserPlus />, tone: 'text-primary bg-blue-50' },
  teacher_updated: { icon: <HiOutlinePencilSquare />, tone: 'text-primary bg-blue-50' },
  teacher_deleted: { icon: <HiOutlineUserMinus />, tone: 'text-danger bg-red-50' },
  student_registered: { icon: <HiOutlineAcademicCap />, tone: 'text-amber-600 bg-amber-50' },
  info: { icon: <HiOutlineBellAlert />, tone: 'text-slate-500 bg-slate-100' },
}

/**
 * Premium admin topbar: mobile menu toggle + page title, a global search
 * field, a real-time notifications dropdown (with alert sound, unread badge
 * and mark-as-read), and the signed-in account chip.
 */
export default function Header({ title, onMenuClick, pageTitle }) {
  const notif = useDisclosure(false)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-100 bg-card/80 px-5 py-4 backdrop-blur-lg sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
        >
          <HiOutlineBars3 className="h-6 w-6" />
        </button>
        <div>
          <h1 className="font-display text-lg font-extrabold text-slate-900 sm:text-xl">{title}</h1>
          <p className="hidden text-xs font-semibold text-slate-400 sm:block">{pageTitle || 'لوحة تحكم الإدارة'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global search (desktop) */}
        <label className="relative hidden xl:block">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="بحث سريع..."
            className="w-56 rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pr-10 pl-4 text-sm font-medium text-slate-600 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={notif.toggle}
            aria-label="الإشعارات"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notif.isOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={notif.close} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 z-50 mt-2 w-80 origin-top-left rounded-2xl bg-card p-3 shadow-glass ring-1 ring-slate-100"
                >
                  <div className="flex items-center justify-between px-2 pb-2 pt-1">
                    <p className="text-sm font-extrabold text-slate-800">الإشعارات</p>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-danger ring-1 ring-red-100">
                      {unreadCount} جديد
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="flex items-center gap-2 py-6 text-sm font-semibold text-slate-400">
                        <HiOutlineBellAlert className="h-5 w-5" />
                        لا توجد إشعارات حتى الآن
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => {
                        const meta = TYPE_META[n.type] ?? TYPE_META.info
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markRead(n.id)
                              notif.close()
                            }}
                            title={formatDateTime(n.createdAt)}
                            className={`flex w-full items-start gap-3 py-2.5 text-right transition-colors hover:bg-slate-50 ${n.read ? '' : 'bg-blue-50/40'}`}
                          >
                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${meta.tone}`}>
                              {meta.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-snug text-slate-700">{n.text}</span>
                              <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                            </span>
                            {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      markAllRead()
                      notif.close()
                    }}
                    className="mt-1 w-full rounded-xl bg-blue-50/70 py-2 text-center text-xs font-bold text-primary ring-1 ring-blue-100 transition-colors hover:bg-blue-50"
                  >
                    تعليم الكل كمقروء
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Account chip */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50/70 py-1.5 pl-3 pr-1.5 ring-1 ring-slate-100">
          <div className="hidden sm:block">
            <p className="text-xs font-extrabold text-slate-800">مدير النظام</p>
            <p className="text-[11px] font-semibold text-slate-400">admin</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
            أد
          </div>
        </div>
      </div>
    </header>
  )
}