import { motion } from 'framer-motion'

/**
 * Lightweight placeholder bar chart (no charting library) showing
 * exam-activity volume per day. Purely illustrative for the MVP —
 * swap for a real charting lib once there's real data to plot.
 */
export default function WeeklyBarChart({ data }) {
  // Guard against an all-zero week: without a floor, 0/0 yields NaN heights.
  const max = Math.max(...data.map((d) => d.value)) || 1

  return (
    <div className="flex h-48 items-end justify-between gap-2 sm:gap-3">
      {data.map((point, index) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end overflow-hidden rounded-lg bg-slate-50">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(point.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-lg bg-gradient-to-t from-primary to-secondary"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-400">{point.label}</span>
        </div>
      ))}
    </div>
  )
}
