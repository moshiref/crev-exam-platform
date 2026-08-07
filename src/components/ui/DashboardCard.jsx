import { motion } from 'framer-motion'

/**
 * Generic panel card used to host dashboard widgets — "Latest Students",
 * "Latest Exams", "Recent Activity", chart placeholders, etc. Provides a
 * consistent title row (with optional trailing action) around any content.
 */
export default function DashboardCard({ title, action, children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  )
}
