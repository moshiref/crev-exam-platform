import { motion } from 'framer-motion'
import { cn } from '../../utils/cn.js'

// Centralized style map so every button in the dashboard (primary
// actions, table row actions, modal footers) stays visually consistent.
const VARIANTS = {
  primary: 'bg-gradient-to-l from-primary to-secondary text-white shadow-soft hover:shadow-soft-lg',
  success: 'bg-gradient-to-l from-emerald-600 to-accent text-white shadow-soft hover:shadow-soft-lg',
  danger: 'bg-danger text-white shadow-soft hover:brightness-110',
  outline: 'border-2 border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary',
  ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700',
}

const SIZES = {
  sm: 'px-3.5 py-2 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-sm sm:text-base gap-2',
}

/**
 * Reusable button used across the entire admin dashboard.
 * `icon` accepts a React Icon element and is placed before the label.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      {children}
    </motion.button>
  )
}
