import { motion } from 'framer-motion'

/**
 * Small feature tile used in the "المميزات" grid.
 * Purely presentational — icon, title and description are passed in
 * so the Features section stays a simple, readable data-driven list.
 */
export default function FeatureCard({ icon, title, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-card bg-card p-6 shadow-soft ring-1 ring-slate-100 transition-shadow duration-300 hover:shadow-soft-lg sm:p-7"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-primary">
        <span aria-hidden="true">{icon}</span>
      </div>
      <h4 className="mt-4 font-display text-base font-bold text-slate-900 sm:text-lg">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
    </motion.div>
  )
}
