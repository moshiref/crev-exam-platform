import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * A single large "portal" card on the landing page (teacher / student / parent).
 * Purely presentational — receives its content and destination as props so
 * the same component powers all three entry points without duplication.
 */
export default function LoginCard({ icon, title, description, buttonLabel, to, accent, delay = 0 }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col items-center rounded-card bg-card p-8 text-center shadow-soft ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-soft-lg sm:p-10"
    >
      {/* Icon badge */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl shadow-inner transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundColor: accent.bg }}
      >
        <span aria-hidden="true">{icon}</span>
      </div>

      <h3 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">{description}</p>

      <button
        type="button"
        onClick={() => navigate(to)}
        className="mt-8 w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg focus-visible:-translate-y-0.5 sm:text-base"
        style={{ backgroundImage: accent.gradient }}
      >
        {buttonLabel}
      </button>
    </motion.div>
  )
}
