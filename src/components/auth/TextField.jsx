import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineExclamationCircle } from 'react-icons/hi2'

/**
 * Reusable labeled text input with a leading icon and an animated
 * validation message. Used for the student-code field (and any future
 * plain-text auth fields) so login forms stay visually consistent.
 */
export default function TextField({
  id,
  label,
  icon,
  error,
  ...inputProps
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          className={`w-full rounded-2xl border bg-slate-50/60 py-3.5 pr-12 pl-4 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
            error
              ? 'animate-shake border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-primary focus:ring-blue-100'
          }`}
          {...inputProps}
        />
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
