import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineExclamationCircle } from 'react-icons/hi2'

/**
 * Password input with a show/hide toggle and the same animated
 * validation-message pattern as `TextField`.
 */
export default function PasswordField({ id, label, error, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-bold text-slate-700">
          {label}
        </label>
        <a
          href="#forgot-password"
          className="text-xs font-semibold text-primary transition-colors hover:text-secondary"
        >
          نسيت كلمة المرور؟
        </a>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg text-slate-400">
          <HiOutlineLockClosed />
        </span>

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-2xl border bg-slate-50/60 py-3.5 pr-12 pl-12 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error
              ? 'animate-shake border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-primary focus:ring-blue-100'
          }`}
          {...inputProps}
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 left-4 flex items-center text-lg text-slate-400 transition-colors hover:text-primary"
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {visible ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-500"
          >
            <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
