/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineInformationCircle } from 'react-icons/hi2'
import { cn } from '../../utils/cn.js'

const ToastContext = createContext(() => {})

const ICONS = {
  success: <HiOutlineCheckCircle className="h-5 w-5" />,
  error: <HiOutlineXCircle className="h-5 w-5" />,
  info: <HiOutlineInformationCircle className="h-5 w-5" />,
}

const TONES = {
  success: 'text-accent',
  error: 'text-danger',
  info: 'text-primary',
}

/** Hook to surface a toast: `toast('message', 'success')`. */
export function useToast() {
  return useContext(ToastContext)
}

/** Renders animated toasts (best mounted once near the app root). */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-5 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-glass ring-1 ring-slate-100'
              )}
            >
              <span className={cn('shrink-0 text-lg', TONES[toast.type])}>{ICONS[toast.type]}</span>
              <p className="text-sm font-bold text-slate-700">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}