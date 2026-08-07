import { motion } from 'framer-motion'

/**
 * Premium empty state used across the admin dashboard whenever a data set is
 * empty. Renders a soft illustration-style icon badge, a title, an optional
 * description and an optional action.
 */
export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-3xl text-primary ring-1 ring-primary/10">
          {icon}
        </div>
      )}
      <div>
        <p className="font-display text-base font-extrabold text-slate-800">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  )
}