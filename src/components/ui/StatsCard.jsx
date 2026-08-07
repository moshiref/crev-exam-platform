import { motion } from 'framer-motion'

const TONES = {
  primary: { bg: '#DBEAFE', fg: '#2563EB' },
  success: { bg: '#DCFCE7', fg: '#16A34A' },
  warning: { bg: '#FEF3C7', fg: '#D97706' },
  secondary: { bg: '#E0E7FF', fg: '#3B82F6' },
}

/**
 * Top-of-dashboard statistic tile: icon, big number, label.
 * `tone` picks a soft icon-badge color from the theme palette.
 */
export default function StatsCard({ icon, label, value, tone = 'primary', delay = 0 }) {
  const colors = TONES[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-soft-lg sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: colors.bg, color: colors.fg }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </motion.div>
  )
}
