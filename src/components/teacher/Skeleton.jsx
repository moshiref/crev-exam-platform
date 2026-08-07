import { motion } from 'framer-motion'
import { cn } from '../../utils/cn.js'

/** A single shimmering placeholder block. */
export function SkeletonBlock({ className = '' }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} />
  )
}

/** Shimmer block sized like a StatsCard tile. */
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-card bg-card p-5 shadow-soft ring-1 ring-slate-100 sm:p-6"
    >
      <SkeletonBlock className="h-12 w-12 rounded-2xl" />
      <SkeletonBlock className="mt-4 h-7 w-20" />
      <SkeletonBlock className="mt-2 h-4 w-24" />
    </motion.div>
  )
}

/** Rows of skeleton lines for tables / lists. */
export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}